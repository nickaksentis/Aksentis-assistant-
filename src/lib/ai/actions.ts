import { db } from "@/lib/db";
import {
  events,
  eventAttendees,
  reminders,
  familyMembers,
  activityLog,
  savedLocations,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { REMINDER_PRESETS } from "@/types";
import { naiveToUTC, getDefaultTimezone } from "@/lib/timezone";
import { searchPlaces } from "@/lib/places/google";
import type { AIAction } from "./types";

interface ActionResult {
  success: boolean;
  detail: string;
}

/**
 * Execute a structured action returned by the conversational AI.
 */
export async function executeAction(
  action: AIAction,
  memberId: number,
  memberTimezone: string | null
): Promise<ActionResult> {
  const tz = memberTimezone || (await getDefaultTimezone());

  switch (action.type) {
    case "create_event":
      return executeCreateEvent(action, memberId, tz);
    case "update_event":
      return executeUpdateEvent(action, memberId, tz);
    case "delete_event":
      return executeDeleteEvent(action, memberId);
    case "list_events":
      // No-op: AI already has events in context and formats the reply
      return { success: true, detail: "Events listed in reply" };
    case "save_location":
      return executeSaveLocation(action, memberId);
  }
}

async function executeCreateEvent(
  action: Extract<AIAction, { type: "create_event" }>,
  memberId: number,
  timezone: string
): Promise<ActionResult> {
  try {
    const utcDate = naiveToUTC(action.date, timezone);

    const [newEvent] = await db
      .insert(events)
      .values({
        name: action.name,
        date: utcDate,
        location: action.location || null,
        placeId: action.placeId || null,
        latitude: action.latitude || null,
        longitude: action.longitude || null,
        description: action.description || null,
        createdBy: memberId,
      })
      .returning();

    // Add attendees if specified
    if (action.attendees && action.attendees.length > 0) {
      const allMembers = await db
        .select({ id: familyMembers.id, name: familyMembers.name })
        .from(familyMembers);

      const attendeeRows = action.attendees
        .map((name) => {
          const match = allMembers.find(
            (m) => m.name.toLowerCase() === name.toLowerCase()
          );
          return match
            ? { eventId: newEvent.id, memberId: match.id }
            : null;
        })
        .filter(Boolean) as { eventId: number; memberId: number }[];

      if (attendeeRows.length > 0) {
        await db.insert(eventAttendees).values(attendeeRows);
      }
    }

    // Create reminders
    const presetValues = action.reminderPresets?.length
      ? action.reminderPresets
      : ["1d"];

    const eventDate = new Date(utcDate);
    const reminderRows = presetValues
      .map((presetValue) => {
        const preset = REMINDER_PRESETS.find((p) => p.value === presetValue);
        if (!preset) return null;
        const scheduledAt = new Date(
          eventDate.getTime() - preset.minutes * 60 * 1000
        );
        if (scheduledAt <= new Date()) return null;
        return {
          eventId: newEvent.id,
          scheduledAt: scheduledAt.toISOString(),
          sendTo: "creator" as const,
          status: "pending" as const,
        };
      })
      .filter(Boolean);

    if (reminderRows.length > 0) {
      await db
        .insert(reminders)
        .values(reminderRows as typeof reminders.$inferInsert[]);
    }

    // Activity log
    await db.insert(activityLog).values({
      action: "event_created",
      entityType: "event",
      entityId: newEvent.id,
      memberId,
      changes: JSON.stringify({ name: action.name }),
    });

    return {
      success: true,
      detail: `Created event "${action.name}" (ID: ${newEvent.id})`,
    };
  } catch (err) {
    console.error("executeCreateEvent error:", err);
    return {
      success: false,
      detail: `Failed to create event: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function executeUpdateEvent(
  action: Extract<AIAction, { type: "update_event" }>,
  memberId: number,
  timezone: string
): Promise<ActionResult> {
  try {
    // Verify event exists
    const existing = await db.query.events.findFirst({
      where: eq(events.id, action.eventId),
    });

    if (!existing) {
      return {
        success: false,
        detail: `Event ID ${action.eventId} not found`,
      };
    }

    // Build update set
    const updates: Record<string, unknown> = {};
    const changes: Record<string, { old: unknown; new: unknown }> = {};

    if (action.name && action.name !== existing.name) {
      updates.name = action.name;
      changes.name = { old: existing.name, new: action.name };
    }
    if (action.date) {
      const utcDate = naiveToUTC(action.date, timezone);
      if (utcDate !== existing.date) {
        updates.date = utcDate;
        changes.date = { old: existing.date, new: utcDate };
      }
    }
    if (action.location !== undefined && action.location !== existing.location) {
      updates.location = action.location || null;
      changes.location = { old: existing.location, new: action.location };
    }
    if (
      action.description !== undefined &&
      action.description !== existing.description
    ) {
      updates.description = action.description || null;
      changes.description = {
        old: existing.description,
        new: action.description,
      };
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date().toISOString();
      await db
        .update(events)
        .set(updates)
        .where(eq(events.id, action.eventId));
    }

    // Update attendees if specified
    if (action.attendees) {
      await db
        .delete(eventAttendees)
        .where(eq(eventAttendees.eventId, action.eventId));

      const allMembers = await db
        .select({ id: familyMembers.id, name: familyMembers.name })
        .from(familyMembers);

      const attendeeRows = action.attendees
        .map((name) => {
          const match = allMembers.find(
            (m) => m.name.toLowerCase() === name.toLowerCase()
          );
          return match
            ? { eventId: action.eventId, memberId: match.id }
            : null;
        })
        .filter(Boolean) as { eventId: number; memberId: number }[];

      if (attendeeRows.length > 0) {
        await db.insert(eventAttendees).values(attendeeRows);
      }
    }

    // Update reminders if specified
    if (action.reminderPresets) {
      // Delete existing reminders for this event
      await db
        .delete(reminders)
        .where(
          and(
            eq(reminders.eventId, action.eventId),
            eq(reminders.status, "pending")
          )
        );

      const eventDate = new Date(updates.date as string || existing.date);
      const reminderRows = action.reminderPresets
        .map((presetValue) => {
          const preset = REMINDER_PRESETS.find((p) => p.value === presetValue);
          if (!preset) return null;
          const scheduledAt = new Date(
            eventDate.getTime() - preset.minutes * 60 * 1000
          );
          if (scheduledAt <= new Date()) return null;
          return {
            eventId: action.eventId,
            scheduledAt: scheduledAt.toISOString(),
            sendTo: "creator" as const,
            status: "pending" as const,
          };
        })
        .filter(Boolean);

      if (reminderRows.length > 0) {
        await db
          .insert(reminders)
          .values(reminderRows as typeof reminders.$inferInsert[]);
      }
    }

    // Activity log
    if (Object.keys(changes).length > 0) {
      await db.insert(activityLog).values({
        action: "event_updated",
        entityType: "event",
        entityId: action.eventId,
        memberId,
        changes: JSON.stringify(changes),
      });
    }

    return {
      success: true,
      detail: `Updated event "${existing.name}" (ID: ${action.eventId})`,
    };
  } catch (err) {
    console.error("executeUpdateEvent error:", err);
    return {
      success: false,
      detail: `Failed to update event: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function executeSaveLocation(
  action: Extract<AIAction, { type: "save_location" }>,
  memberId: number
): Promise<ActionResult> {
  try {
    let address = action.address || "";
    let placeId: string | null = null;

    // If searchQuery provided, look up via Google Places
    if (action.searchQuery && !address) {
      const results = await searchPlaces(action.searchQuery);
      if (results.length > 0) {
        address = results[0].description;
        placeId = results[0].placeId;
      }
    }

    if (!address) {
      return { success: false, detail: "No address found for location" };
    }

    const [location] = await db
      .insert(savedLocations)
      .values({
        name: action.name,
        address,
        placeId,
        locationType: action.locationType || "other",
      })
      .returning();

    await db.insert(activityLog).values({
      action: "location_created",
      entityType: "location",
      entityId: location.id,
      memberId,
      changes: JSON.stringify({ name: action.name, address, source: "ai" }),
    });

    return {
      success: true,
      detail: `Saved location "${action.name}" at ${address} (ID: ${location.id})`,
    };
  } catch (err) {
    console.error("executeSaveLocation error:", err);
    return {
      success: false,
      detail: `Failed to save location: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function executeDeleteEvent(
  action: Extract<AIAction, { type: "delete_event" }>,
  memberId: number
): Promise<ActionResult> {
  try {
    const existing = await db.query.events.findFirst({
      where: eq(events.id, action.eventId),
    });

    if (!existing) {
      return {
        success: false,
        detail: `Event ID ${action.eventId} not found`,
      };
    }

    await db.delete(events).where(eq(events.id, action.eventId));

    // Activity log
    await db.insert(activityLog).values({
      action: "event_deleted",
      entityType: "event",
      entityId: action.eventId,
      memberId,
      changes: JSON.stringify({ name: existing.name }),
    });

    return {
      success: true,
      detail: `Deleted event "${existing.name}" (ID: ${action.eventId})`,
    };
  } catch (err) {
    console.error("executeDeleteEvent error:", err);
    return {
      success: false,
      detail: `Failed to delete event: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

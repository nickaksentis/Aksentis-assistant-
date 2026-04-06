import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  events,
  eventAttendees,
  reminders,
  familyMembers,
  savedLocations,
  smsLog,
  activityLog,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { REMINDER_PRESETS } from "@/types";
import { desc, eq } from "drizzle-orm";
import { sendSMS } from "@/lib/sms/twilio";
import { getTravelTime } from "@/lib/places/google";
import {
  naiveToUTC,
  getDefaultTimezone,
  formatEventTimeForTimezone,
} from "@/lib/timezone";

export async function GET() {
  const allEvents = await db.query.events.findMany({
    orderBy: [desc(events.date)],
    with: {
      attendees: {
        with: {
          member: true,
        },
      },
    },
  });

  return NextResponse.json(allEvents);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    name,
    date,
    location,
    placeId,
    latitude,
    longitude,
    description,
    attendees,
    reminderPresets,
    reminderRecipients,
  } = body;

  if (!name?.trim() || !date) {
    return NextResponse.json(
      { error: "Name and date are required" },
      { status: 400 }
    );
  }

  // Look up creator's timezone and convert naive date to UTC
  const creator = await db.query.familyMembers.findFirst({
    where: eq(familyMembers.id, session.memberId),
  });
  const creatorTz =
    creator?.timezone || (await getDefaultTimezone());
  const utcDate = naiveToUTC(date, creatorTz);

  // Create the event
  const [newEvent] = await db
    .insert(events)
    .values({
      name: name.trim(),
      date: utcDate,
      endDate: null,
      location: location || null,
      placeId: placeId || null,
      latitude: latitude || null,
      longitude: longitude || null,
      description: description || null,
      createdBy: session.memberId,
    })
    .returning();

  // Log event creation
  await db.insert(activityLog).values({
    action: "event_created",
    entityType: "event",
    entityId: newEvent.id,
    memberId: session.memberId,
    changes: null,
  });

  // Add attendees
  if (attendees?.length > 0) {
    await db.insert(eventAttendees).values(
      attendees.map((memberId: number) => ({
        eventId: newEvent.id,
        memberId,
      }))
    );
  }

  // Create reminders based on presets
  if (reminderPresets?.length > 0) {
    const eventDate = new Date(utcDate);
    const reminderRows = reminderPresets
      .map((presetValue: string) => {
        const preset = REMINDER_PRESETS.find((p) => p.value === presetValue);
        if (!preset) return null;
        const scheduledAt = new Date(
          eventDate.getTime() - preset.minutes * 60 * 1000
        );
        if (scheduledAt <= new Date()) return null;
        return {
          eventId: newEvent.id,
          scheduledAt: scheduledAt.toISOString(),
          sendTo: (reminderRecipients || "creator") as
            | "creator"
            | "attendees"
            | "all",
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

  // Save location to saved_locations if it has a placeId
  if (location && placeId) {
    const existing = await db.query.savedLocations?.findFirst({
      where: eq(savedLocations.placeId, placeId),
    });
    if (!existing) {
      await db.insert(savedLocations).values({
        name: location.split(",")[0].trim(),
        address: location,
        placeId,
        latitude: latitude || null,
        longitude: longitude || null,
        locationType: "other",
      });
    }
  }

  // Travel time departure reminder
  if (placeId) {
    try {
      if (creator?.homeAddress) {
        const travel = await getTravelTime(creator.homeAddress, placeId);
        if (travel && !travel.skip) {
          const eventDate = new Date(utcDate);
          const departureTime = new Date(
            eventDate.getTime() - (travel.durationMinutes + 15) * 60 * 1000
          );
          if (departureTime > new Date()) {
            const localTime = formatEventTimeForTimezone(
              utcDate,
              creatorTz,
              "h:mm a"
            );
            await db.insert(reminders).values({
              eventId: newEvent.id,
              scheduledAt: departureTime.toISOString(),
              sendTo: "creator",
              status: "pending",
              messageBody: `Time to head out! It's about ${travel.durationText} to ${location?.split(",")[0] || "your event"}. Your ${name.trim()} starts at ${localTime}.`,
            });
          }
        }
      }
    } catch {
      // Travel time is best-effort, don't fail event creation
    }
  }

  // Send SMS confirmation to creator
  try {
    if (creator?.phone && creator.isActive) {
      const formattedDate = formatEventTimeForTimezone(
        utcDate,
        creatorTz,
        "EEE, MMM d 'at' h:mm a"
      );
      const locationInfo = location ? ` at ${location.split(",")[0]}` : "";
      const confirmMsg = `All set! I've added '${name.trim()}' on ${formattedDate}${locationInfo} to your calendar. Reminders are set!`;

      const sid = await sendSMS(creator.phone, confirmMsg);
      await db.insert(smsLog).values({
        memberId: session.memberId,
        phone: creator.phone,
        messageBody: confirmMsg,
        twilioSid: sid,
        direction: "outbound",
        status: "sent",
      });
    }
  } catch {
    // SMS confirmation is best-effort
  }

  return NextResponse.json(newEvent, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    id,
    name,
    date,
    location,
    placeId,
    latitude,
    longitude,
    description,
    attendees,
    reminderPresets,
    reminderRecipients,
  } = body;

  if (!id) {
    return NextResponse.json({ error: "Event ID required" }, { status: 400 });
  }

  // Look up user's timezone for date conversion
  const updater = await db.query.familyMembers.findFirst({
    where: eq(familyMembers.id, session.memberId),
  });
  const updaterTz =
    updater?.timezone || (await getDefaultTimezone());

  // Convert date to UTC if provided
  const utcDate = date ? naiveToUTC(date, updaterTz) : undefined;

  // Fetch current event for change tracking
  const existing = await db.query.events.findFirst({
    where: eq(events.id, id),
    with: {
      attendees: { with: { member: true } },
      reminders: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Build changes object (only modified fields)
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  if (name !== undefined && name !== existing.name)
    changes.name = { old: existing.name, new: name };
  if (utcDate !== undefined && utcDate !== existing.date)
    changes.date = { old: existing.date, new: utcDate };
  if (location !== undefined && (location || null) !== (existing.location || null))
    changes.location = { old: existing.location, new: location || null };
  if (description !== undefined && (description || null) !== (existing.description || null))
    changes.description = { old: existing.description, new: description || null };

  // Update the event
  const [updated] = await db
    .update(events)
    .set({
      name: name?.trim() || existing.name,
      date: utcDate || existing.date,
      location: location !== undefined ? location || null : existing.location,
      placeId: placeId !== undefined ? placeId || null : existing.placeId,
      latitude: latitude !== undefined ? latitude || null : existing.latitude,
      longitude: longitude !== undefined ? longitude || null : existing.longitude,
      description: description !== undefined ? description || null : existing.description,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(events.id, id))
    .returning();

  // Update attendees if provided
  if (attendees !== undefined) {
    const oldAttendees = existing.attendees?.map((a) => a.member.name).sort().join(", ") || "";
    await db.delete(eventAttendees).where(eq(eventAttendees.eventId, id));
    if (attendees.length > 0) {
      await db.insert(eventAttendees).values(
        attendees.map((memberId: number) => ({
          eventId: id,
          memberId,
        }))
      );
    }
    // Fetch new attendee names for change log
    const newAttendeeRows = await db.query.eventAttendees.findMany({
      where: eq(eventAttendees.eventId, id),
      with: { member: true },
    });
    const newAttendeeNames = newAttendeeRows.map((a) => a.member.name).sort().join(", ") || "";
    if (oldAttendees !== newAttendeeNames) {
      changes.attendees = { old: oldAttendees, new: newAttendeeNames };
    }
  }

  // Update reminders if provided
  if (reminderPresets !== undefined) {
    // Delete old reminders
    await db.delete(reminders).where(eq(reminders.eventId, id));
    // Create new ones
    if (reminderPresets.length > 0) {
      const eventDate = new Date(utcDate || existing.date);
      const reminderRows = reminderPresets
        .map((presetValue: string) => {
          const preset = REMINDER_PRESETS.find((p) => p.value === presetValue);
          if (!preset) return null;
          const scheduledAt = new Date(
            eventDate.getTime() - preset.minutes * 60 * 1000
          );
          if (scheduledAt <= new Date()) return null;
          return {
            eventId: id,
            scheduledAt: scheduledAt.toISOString(),
            sendTo: (reminderRecipients || "creator") as "creator" | "attendees" | "all",
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
  }

  // Log the edit with changes
  if (Object.keys(changes).length > 0) {
    await db.insert(activityLog).values({
      action: "event_updated",
      entityType: "event",
      entityId: id,
      memberId: session.memberId,
      changes: JSON.stringify(changes),
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Event ID required" }, { status: 400 });
  }

  await db.delete(events).where(eq(events.id, id));
  return NextResponse.json({ success: true });
}

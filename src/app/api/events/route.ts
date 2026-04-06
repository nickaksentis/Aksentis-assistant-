import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  events,
  eventAttendees,
  reminders,
  familyMembers,
  savedLocations,
  smsLog,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { REMINDER_PRESETS } from "@/types";
import { desc, eq } from "drizzle-orm";
import { sendSMS } from "@/lib/sms/twilio";
import { getTravelTime } from "@/lib/places/google";
import { format, parseISO } from "date-fns";

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

  // Create the event
  const [newEvent] = await db
    .insert(events)
    .values({
      name: name.trim(),
      date,
      endDate: null,
      location: location || null,
      placeId: placeId || null,
      latitude: latitude || null,
      longitude: longitude || null,
      description: description || null,
      createdBy: session.memberId,
    })
    .returning();

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
    const eventDate = new Date(date);
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
      const creator = await db.query.familyMembers.findFirst({
        where: eq(familyMembers.id, session.memberId),
      });
      if (creator?.homeAddress) {
        const travel = await getTravelTime(creator.homeAddress, placeId);
        if (travel && !travel.skip) {
          const eventDate = new Date(date);
          const departureTime = new Date(
            eventDate.getTime() - (travel.durationMinutes + 15) * 60 * 1000
          );
          if (departureTime > new Date()) {
            await db.insert(reminders).values({
              eventId: newEvent.id,
              scheduledAt: departureTime.toISOString(),
              sendTo: "creator",
              status: "pending",
              messageBody: `Time to head out! It's about ${travel.durationText} to ${location?.split(",")[0] || "your event"}. Your ${name.trim()} starts at ${format(parseISO(date), "h:mm a")}.`,
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
    const creator = await db.query.familyMembers.findFirst({
      where: eq(familyMembers.id, session.memberId),
    });
    if (creator?.phone && creator.isActive) {
      const formattedDate = format(parseISO(date), "EEE, MMM d 'at' h:mm a");
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

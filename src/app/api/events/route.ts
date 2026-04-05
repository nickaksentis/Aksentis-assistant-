import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events, eventAttendees, reminders } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { REMINDER_PRESETS } from "@/types";
import { desc, eq } from "drizzle-orm";

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
    endDate,
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
      endDate: endDate || null,
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
        // Only create reminder if it's in the future
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

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  reminders,
  events,
  familyMembers,
  eventAttendees,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { desc, eq, asc, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = req.nextUrl.searchParams.get("status");

  // Fetch all reminders with event info
  const allReminders = await db.query.reminders.findMany({
    with: {
      event: {
        with: {
          creator: true,
          attendees: {
            with: {
              member: true,
            },
          },
        },
      },
    },
    orderBy: [asc(reminders.scheduledAt)],
  });

  // Filter by status if provided
  let filtered = allReminders;
  if (status && status !== "all") {
    filtered = allReminders.filter((r) => r.status === status);
  }

  // Build response with resolved recipient names and channel
  const logs = filtered.map((r) => {
    let sendToNames = "";
    let channel: string | null = null;

    if (r.sendTo === "creator" && r.event?.creator) {
      sendToNames = r.event.creator.name;
      channel = r.event.creator.preferredChannel || null;
    } else if (r.sendTo === "attendees" && r.event?.attendees) {
      const names = r.event.attendees.map((a) => a.member.name);
      sendToNames = names.join(", ") || "No attendees";
      // Use first attendee's channel as indicator
      channel = r.event.attendees[0]?.member.preferredChannel || null;
    } else if (r.sendTo === "all") {
      sendToNames = "All members";
    }

    return {
      id: r.id,
      eventId: r.eventId,
      eventName: r.event?.name || "Unknown",
      eventDate: r.event?.date || "",
      scheduledAt: r.scheduledAt,
      sendTo: r.sendTo,
      sendToNames,
      status: r.status,
      sentAt: r.sentAt,
      messageBody: r.messageBody,
      channel,
    };
  });

  // Sort: pending by scheduledAt ASC first, then sent/failed by sentAt DESC
  logs.sort((a, b) => {
    const aIsPending = a.status === "pending";
    const bIsPending = b.status === "pending";
    if (aIsPending && !bIsPending) return -1;
    if (!aIsPending && bIsPending) return 1;
    if (aIsPending && bIsPending) {
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    }
    // Both non-pending: sort by sentAt descending
    const aTime = a.sentAt ? new Date(a.sentAt).getTime() : 0;
    const bTime = b.sentAt ? new Date(b.sentAt).getTime() : 0;
    return bTime - aTime;
  });

  // Summary counts from all reminders (not filtered)
  const counts = {
    scheduled: allReminders.filter((r) => r.status === "pending").length,
    sent: allReminders.filter((r) => r.status === "sent").length,
    failed: allReminders.filter((r) => r.status === "failed").length,
  };

  return NextResponse.json({ logs, counts });
}

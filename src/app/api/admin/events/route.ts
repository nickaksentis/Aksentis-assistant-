import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { desc } from "drizzle-orm";

// Admin-only: returns all events with creator and reminder info
export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allEvents = await db.query.events.findMany({
    orderBy: [desc(events.date)],
    with: {
      creator: true,
      attendees: {
        with: {
          member: true,
        },
      },
      reminders: true,
    },
  });

  return NextResponse.json(allEvents);
}

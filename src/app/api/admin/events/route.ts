import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { checkPermission } from "@/lib/permissions";
import { desc } from "drizzle-orm";

export async function GET() {
  const session = await checkPermission("events");
  if (!session) {
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

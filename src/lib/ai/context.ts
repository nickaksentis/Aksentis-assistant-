import { db } from "@/lib/db";
import {
  smsLog,
  events,
  eventAttendees,
  familyMembers,
} from "@/lib/db/schema";
import { eq, and, gte, notInArray, desc, asc } from "drizzle-orm";
import { formatEventTimeForTimezone } from "@/lib/timezone";
import type { ConversationContext } from "./types";

/**
 * Retrieve recent conversation history for a member from smsLog.
 * Returns the last `limit` messages within the last 48 hours,
 * ordered oldest-first for the Claude messages array.
 */
export async function getConversationHistory(
  memberId: number,
  limit = 20
): Promise<{ role: "user" | "assistant"; content: string }[]> {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const rows = await db
    .select({
      direction: smsLog.direction,
      messageBody: smsLog.messageBody,
      createdAt: smsLog.createdAt,
    })
    .from(smsLog)
    .where(
      and(
        eq(smsLog.memberId, memberId),
        gte(smsLog.createdAt, cutoff),
        notInArray(smsLog.status, ["spam_blocked", "inactive_blocked"])
      )
    )
    .orderBy(desc(smsLog.createdAt))
    .limit(limit);

  // Reverse to oldest-first and map direction to role
  return rows.reverse().map((row) => ({
    role: row.direction === "inbound" ? ("user" as const) : ("assistant" as const),
    content: row.messageBody,
  }));
}

/**
 * Get upcoming events for the next `days` days, with attendees and reminders.
 */
export async function getUpcomingEvents(
  days = 14,
  timezone = "America/New_York"
): Promise<ConversationContext["upcomingEvents"]> {
  const now = new Date();
  const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const rows = await db.query.events.findMany({
    where: and(
      gte(events.date, now.toISOString()),
    ),
    with: {
      attendees: {
        with: {
          member: true,
        },
      },
      reminders: true,
    },
    orderBy: [asc(events.date)],
  });

  // Filter to events within the date range
  const filtered = rows.filter(
    (e) => new Date(e.date) <= end
  );

  return filtered.map((e) => ({
    id: e.id,
    name: e.name,
    date: formatEventTimeForTimezone(
      e.date,
      timezone,
      "EEE MMM d 'at' h:mm a"
    ),
    location: e.location,
    description: e.description,
    attendees: e.attendees.map(
      (a: { member: { name: string } }) => a.member.name
    ),
    reminders: e.reminders.map(
      (r: { scheduledAt: string; status: string }) => ({
        scheduledAt: r.scheduledAt,
        status: r.status,
      })
    ),
  }));
}

/**
 * Assemble the full ConversationContext object.
 */
export function buildConversationContext(
  member: { id: number; name: string; timezone: string | null },
  history: { role: "user" | "assistant"; content: string }[],
  upcomingEvents: ConversationContext["upcomingEvents"],
  allMembers: { id: number; name: string }[],
  currentDate: string
): ConversationContext {
  return {
    memberName: member.name,
    memberId: member.id,
    memberTimezone: member.timezone || "America/New_York",
    familyMembers: allMembers,
    recentMessages: history,
    upcomingEvents,
    currentDate,
  };
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { smsLog, familyMembers } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { desc, eq, and, gte, lte, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = req.nextUrl;
  const direction = url.searchParams.get("direction");
  const status = url.searchParams.get("status");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const limit = parseInt(url.searchParams.get("limit") || "100");

  // Build conditions
  const conditions = [];
  if (direction) conditions.push(eq(smsLog.direction, direction as "inbound" | "outbound"));
  if (status) conditions.push(eq(smsLog.status, status));
  if (from) conditions.push(gte(smsLog.createdAt, from));
  if (to) conditions.push(lte(smsLog.createdAt, to));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const logs = await db
    .select({
      id: smsLog.id,
      phone: smsLog.phone,
      messageBody: smsLog.messageBody,
      twilioSid: smsLog.twilioSid,
      direction: smsLog.direction,
      status: smsLog.status,
      createdAt: smsLog.createdAt,
      memberId: smsLog.memberId,
      memberName: familyMembers.name,
    })
    .from(smsLog)
    .leftJoin(familyMembers, eq(smsLog.memberId, familyMembers.id))
    .where(where)
    .orderBy(desc(smsLog.createdAt))
    .limit(limit);

  // Get summary counts
  const [counts] = await db
    .select({
      total: sql<number>`count(*)`,
      inbound: sql<number>`sum(case when ${smsLog.direction} = 'inbound' then 1 else 0 end)`,
      outbound: sql<number>`sum(case when ${smsLog.direction} = 'outbound' then 1 else 0 end)`,
      spam: sql<number>`sum(case when ${smsLog.status} = 'spam_blocked' then 1 else 0 end)`,
      failed: sql<number>`sum(case when ${smsLog.status} = 'failed' then 1 else 0 end)`,
    })
    .from(smsLog);

  return NextResponse.json({ logs, counts });
}

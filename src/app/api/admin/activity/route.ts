import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activityLog, familyMembers } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { desc, eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "25");
  const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");

  const logs = await db
    .select({
      id: activityLog.id,
      action: activityLog.action,
      entityType: activityLog.entityType,
      entityId: activityLog.entityId,
      memberId: activityLog.memberId,
      memberName: familyMembers.name,
      changes: activityLog.changes,
      createdAt: activityLog.createdAt,
    })
    .from(activityLog)
    .leftJoin(familyMembers, eq(activityLog.memberId, familyMembers.id))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(activityLog);

  return NextResponse.json({ logs, total: countResult.count });
}

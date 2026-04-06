import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activityLog, familyMembers } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
    .limit(200);

  return NextResponse.json(logs);
}

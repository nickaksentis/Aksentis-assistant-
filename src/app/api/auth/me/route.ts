import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { familyMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ isLoggedIn: false }, { status: 401 });
  }

  // Fetch timezone from member record
  let timezone: string | null = null;
  try {
    const member = await db.query.familyMembers.findFirst({
      where: eq(familyMembers.id, session.memberId),
    });
    timezone = member?.timezone || null;
  } catch {
    // Best effort
  }

  return NextResponse.json({
    isLoggedIn: true,
    memberId: session.memberId,
    memberName: session.memberName,
    isAdmin: session.isAdmin,
    timezone,
  });
}

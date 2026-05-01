import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { familyMembers } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { memberId, name, pin } = await req.json();

  if ((!memberId && !name?.trim()) || !pin) {
    return NextResponse.json(
      { error: "Name and password are required" },
      { status: 400 }
    );
  }

  let member;
  if (memberId) {
    member = await db.query.familyMembers.findFirst({
      where: eq(familyMembers.id, Number(memberId)),
    });
  } else {
    member = await db.query.familyMembers.findFirst({
      where: sql`lower(${familyMembers.name}) = lower(${name.trim()})`,
    });
  }

  if (!member || member.pin !== pin) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  if (!member.isActive) {
    return NextResponse.json(
      {
        error:
          "Your account isn't active yet. Check your phone for an activation text and reply YES.",
      },
      { status: 403 }
    );
  }

  const session = await getSession();
  session.memberId = member.id;
  session.memberName = member.name;
  session.isAdmin = member.isAdmin;
  session.isLoggedIn = true;
  session.canManageLocations = member.isAdmin || member.canManageLocations;
  session.canManageEvents = member.isAdmin || member.canManageEvents;
  session.canManageMembers = member.isAdmin || member.canManageMembers;
  await session.save();

  return NextResponse.json({ success: true, name: member.name });
}

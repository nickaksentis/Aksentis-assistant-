import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { familyMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { memberId, pin } = await req.json();

  if (!memberId || !pin) {
    return NextResponse.json(
      { error: "Member and PIN are required" },
      { status: 400 }
    );
  }

  const member = await db.query.familyMembers.findFirst({
    where: eq(familyMembers.id, Number(memberId)),
  });

  if (!member || member.pin !== pin) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
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
  await session.save();

  return NextResponse.json({ success: true, name: member.name });
}

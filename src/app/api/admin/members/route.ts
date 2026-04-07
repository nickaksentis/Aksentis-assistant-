import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { familyMembers } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const members = await db
    .select({
      id: familyMembers.id,
      name: familyMembers.name,
      phone: familyMembers.phone,
      pin: familyMembers.pin,
      isAdmin: familyMembers.isAdmin,
      isActive: familyMembers.isActive,
      homeAddress: familyMembers.homeAddress,
      homePlaceId: familyMembers.homePlaceId,
      homeLat: familyMembers.homeLat,
      homeLng: familyMembers.homeLng,
      timezone: familyMembers.timezone,
      preferredChannel: familyMembers.preferredChannel,
      createdAt: familyMembers.createdAt,
    })
    .from(familyMembers);

  return NextResponse.json(members);
}

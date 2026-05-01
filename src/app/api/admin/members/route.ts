import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { familyMembers } from "@/lib/db/schema";
import { checkPermission } from "@/lib/permissions";

export async function GET() {
  const session = await checkPermission("members");
  if (!session) {
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
      canManageLocations: familyMembers.canManageLocations,
      canManageEvents: familyMembers.canManageEvents,
      canManageMembers: familyMembers.canManageMembers,
      createdAt: familyMembers.createdAt,
    })
    .from(familyMembers);

  return NextResponse.json(members);
}

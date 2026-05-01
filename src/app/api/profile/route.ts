import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { familyMembers, activityLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await db.query.familyMembers.findFirst({
    where: eq(familyMembers.id, session.memberId),
  });

  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: member.id,
    name: member.name,
    phone: member.phone,
    isAdmin: member.isAdmin,
    homeAddress: member.homeAddress,
    homeLat: member.homeLat,
    homeLng: member.homeLng,
    timezone: member.timezone,
    preferredChannel: member.preferredChannel,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, phone, pin, homeAddress, homePlaceId, homeLat: manualLat, homeLng: manualLng, timezone, preferredChannel } =
    await req.json();

  if (pin?.trim() && (pin.trim().length < 6 || !/\d/.test(pin.trim()))) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters with at least 1 number" },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (name?.trim()) updates.name = name.trim();
  if (phone?.trim()) updates.phone = phone.trim();
  if (pin?.trim()) updates.pin = pin.trim();
  if (homeAddress !== undefined) updates.homeAddress = homeAddress?.trim() || null;
  if (homePlaceId !== undefined) updates.homePlaceId = homePlaceId || null;
  if (timezone !== undefined) updates.timezone = timezone || null;
  if (preferredChannel !== undefined) updates.preferredChannel = preferredChannel || null;

  let geocodeStatus = "skipped";
  if (manualLat?.trim() || manualLng?.trim()) {
    updates.homeLat = manualLat?.trim() || null;
    updates.homeLng = manualLng?.trim() || null;
    geocodeStatus = "manual";
  } else if (homeAddress !== undefined) {
    if (homeAddress?.trim()) {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (apiKey) {
        try {
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(homeAddress.trim())}&key=${apiKey}`;
          const geoRes = await fetch(geocodeUrl);
          const geoData = await geoRes.json();
          if (geoData.status === "OK" && geoData.results?.[0]?.geometry?.location) {
            updates.homeLat = String(geoData.results[0].geometry.location.lat);
            updates.homeLng = String(geoData.results[0].geometry.location.lng);
            geocodeStatus = "success";
          } else {
            updates.homeLat = null;
            updates.homeLng = null;
            geocodeStatus = `google_${geoData.status || "UNKNOWN"}`;
          }
        } catch {
          geocodeStatus = "error";
        }
      }
    } else {
      updates.homeLat = null;
      updates.homeLng = null;
    }
  }

  const existing = await db.query.familyMembers.findFirst({
    where: eq(familyMembers.id, session.memberId),
  });

  const [updated] = await db
    .update(familyMembers)
    .set(updates)
    .where(eq(familyMembers.id, session.memberId))
    .returning();

  if (existing) {
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    for (const [key, value] of Object.entries(updates)) {
      const oldVal = (existing as Record<string, unknown>)[key];
      if (oldVal !== value) {
        changes[key] = { old: oldVal ?? null, new: value ?? null };
      }
    }
    if (Object.keys(changes).length > 0) {
      await db.insert(activityLog).values({
        action: "member_updated",
        entityType: "member",
        entityId: session.memberId,
        memberId: session.memberId,
        changes: JSON.stringify(changes),
      });
    }
  }

  if (updated.name !== session.memberName) {
    session.memberName = updated.name;
    await session.save();
  }

  return NextResponse.json({ ...updated, geocodeStatus });
}

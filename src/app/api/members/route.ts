import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { familyMembers, smsLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { sendSMS } from "@/lib/sms/twilio";

// Public: returns id + name only (for login page and attendee picker)
export async function GET() {
  const members = await db
    .select({ id: familyMembers.id, name: familyMembers.name })
    .from(familyMembers);
  return NextResponse.json(members);
}

// Admin: create a new family member
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, phone, pin, isAdmin, homeAddress, homePlaceId, timezone } =
    await req.json();
  if (!name?.trim() || !phone?.trim() || !pin?.trim()) {
    return NextResponse.json(
      { error: "Name, phone, and password are required" },
      { status: 400 }
    );
  }

  // Password validation: at least 6 chars, at least 1 number
  if (pin.trim().length < 6 || !/\d/.test(pin.trim())) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters with at least 1 number" },
      { status: 400 }
    );
  }

  // Geocode home address to get lat/lng
  let homeLat: string | null = null;
  let homeLng: string | null = null;
  if (homeAddress?.trim()) {
    try {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (apiKey) {
        const geoRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            homeAddress.trim()
          )}&key=${apiKey}`
        );
        const geoData = await geoRes.json();
        if (geoData.results?.[0]?.geometry?.location) {
          homeLat = String(geoData.results[0].geometry.location.lat);
          homeLng = String(geoData.results[0].geometry.location.lng);
        }
      }
    } catch {
      // Best effort — save without coords
    }
  }

  const [member] = await db
    .insert(familyMembers)
    .values({
      name: name.trim(),
      phone: phone.trim(),
      pin: pin.trim(),
      isAdmin: isAdmin || false,
      isActive: false, // New members start inactive until they reply YES
      timezone: timezone || null,
      homeAddress: homeAddress?.trim() || null,
      homePlaceId: homePlaceId || null,
      homeLat,
      homeLng,
    })
    .returning();

  // Send activation SMS
  try {
    const activationMsg = `Hi ${member.name}! You've been added to the Family Calendar Assistant. Reply YES to activate your account.`;
    const sid = await sendSMS(member.phone, activationMsg);
    await db.insert(smsLog).values({
      memberId: member.id,
      phone: member.phone,
      messageBody: activationMsg,
      twilioSid: sid,
      direction: "outbound",
      status: "sent",
    });
  } catch {
    // SMS is best-effort during member creation
  }

  return NextResponse.json(member, { status: 201 });
}

// Admin: update a family member
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, name, phone, pin, isAdmin, homeAddress, homePlaceId, timezone } =
    await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  // Validate password if provided
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
  if (typeof isAdmin === "boolean") updates.isAdmin = isAdmin;
  if (homeAddress !== undefined)
    updates.homeAddress = homeAddress?.trim() || null;
  if (homePlaceId !== undefined) updates.homePlaceId = homePlaceId || null;
  if (timezone !== undefined) updates.timezone = timezone || null;

  // Geocode home address when it changes
  if (homeAddress !== undefined) {
    if (homeAddress?.trim()) {
      try {
        const apiKey = process.env.GOOGLE_PLACES_API_KEY;
        if (apiKey) {
          const geoRes = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
              homeAddress.trim()
            )}&key=${apiKey}`
          );
          const geoData = await geoRes.json();
          if (geoData.results?.[0]?.geometry?.location) {
            updates.homeLat = String(geoData.results[0].geometry.location.lat);
            updates.homeLng = String(geoData.results[0].geometry.location.lng);
          } else {
            updates.homeLat = null;
            updates.homeLng = null;
          }
        }
      } catch {
        // Best effort — keep existing coords
      }
    } else {
      updates.homeLat = null;
      updates.homeLng = null;
    }
  }

  const [updated] = await db
    .update(familyMembers)
    .set(updates)
    .where(eq(familyMembers.id, id))
    .returning();

  return NextResponse.json(updated);
}

// Admin: delete a family member
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  await db.delete(familyMembers).where(eq(familyMembers.id, id));
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { familyMembers, smsLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { sendMessage, type Channel } from "@/lib/messaging/send";

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

  const { name, phone, pin, isAdmin, homeAddress, homePlaceId, homeLat: manualLat, homeLng: manualLng, timezone, preferredChannel } =
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

  // Use manually provided lat/lng, or geocode the home address
  let homeLat: string | null = manualLat?.trim() || null;
  let homeLng: string | null = manualLng?.trim() || null;
  let geocodeStatus = "skipped";
  if (!homeLat && !homeLng && homeAddress?.trim()) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.log("[Geocode POST] No GOOGLE_PLACES_API_KEY env var set");
      geocodeStatus = "no_api_key";
    } else {
      try {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          homeAddress.trim()
        )}&key=${apiKey}`;
        console.log("[Geocode POST] Calling:", geocodeUrl.replace(apiKey, "KEY_REDACTED"));
        const geoRes = await fetch(geocodeUrl);
        const geoData = await geoRes.json();
        console.log("[Geocode POST] Response status:", geoData.status, "error_message:", geoData.error_message || "none", "results count:", geoData.results?.length || 0);
        if (geoData.status === "OK" && geoData.results?.[0]?.geometry?.location) {
          homeLat = String(geoData.results[0].geometry.location.lat);
          homeLng = String(geoData.results[0].geometry.location.lng);
          geocodeStatus = "success";
          console.log("[Geocode POST] Got coords:", homeLat, homeLng);
        } else {
          geocodeStatus = `google_${geoData.status || "UNKNOWN"}`;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[Geocode POST] Fetch error:", msg);
        geocodeStatus = `error: ${msg}`;
      }
    }
  } else if (homeLat && homeLng) {
    geocodeStatus = "manual";
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
      preferredChannel: preferredChannel || null,
    })
    .returning();

  // Send activation message via preferred channel
  try {
    const channel = (preferredChannel as Channel) || undefined;
    const activationMsg = `Hi ${member.name}! You've been added to the Family Calendar Assistant. Reply YES to activate your account.`;
    const result = await sendMessage(member.phone, activationMsg, channel);
    await db.insert(smsLog).values({
      memberId: member.id,
      phone: member.phone,
      messageBody: activationMsg,
      twilioSid: result.sid,
      direction: "outbound",
      status: "sent",
      channel: result.channel,
    });
  } catch {
    // Activation message is best-effort during member creation
  }

  return NextResponse.json({ ...member, geocodeStatus }, { status: 201 });
}

// Admin: update a family member
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, name, phone, pin, isAdmin, homeAddress, homePlaceId, homeLat: manualLat, homeLng: manualLng, timezone, preferredChannel } =
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
  if (preferredChannel !== undefined) updates.preferredChannel = preferredChannel || null;

  // Use manually provided lat/lng if present
  let geocodeStatus = "skipped";
  if (manualLat?.trim() || manualLng?.trim()) {
    updates.homeLat = manualLat?.trim() || null;
    updates.homeLng = manualLng?.trim() || null;
    geocodeStatus = "manual";
  } else if (homeAddress !== undefined) {
    // Geocode home address when it changes and no manual coords
    if (homeAddress?.trim()) {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        console.log("[Geocode PUT] No GOOGLE_PLACES_API_KEY env var set");
        geocodeStatus = "no_api_key";
      } else {
        try {
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            homeAddress.trim()
          )}&key=${apiKey}`;
          console.log("[Geocode PUT] Calling:", geocodeUrl.replace(apiKey, "KEY_REDACTED"));
          const geoRes = await fetch(geocodeUrl);
          const geoData = await geoRes.json();
          console.log("[Geocode PUT] Response status:", geoData.status, "error_message:", geoData.error_message || "none", "results count:", geoData.results?.length || 0);
          if (geoData.status === "OK" && geoData.results?.[0]?.geometry?.location) {
            updates.homeLat = String(geoData.results[0].geometry.location.lat);
            updates.homeLng = String(geoData.results[0].geometry.location.lng);
            geocodeStatus = "success";
            console.log("[Geocode PUT] Got coords:", updates.homeLat, updates.homeLng);
          } else {
            updates.homeLat = null;
            updates.homeLng = null;
            geocodeStatus = `google_${geoData.status || "UNKNOWN"}`;
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[Geocode PUT] Fetch error:", msg);
          geocodeStatus = `error: ${msg}`;
        }
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

  return NextResponse.json({ ...updated, geocodeStatus });
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

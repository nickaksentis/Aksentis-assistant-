import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { address } = await req.json();
  if (!address?.trim()) {
    return NextResponse.json(
      { error: "Address is required", status: "NO_ADDRESS" },
      { status: 400 }
    );
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      status: "NO_API_KEY",
      error: "GOOGLE_PLACES_API_KEY environment variable is not set",
      lat: null,
      lng: null,
    });
  }

  try {
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address.trim()
    )}&key=${apiKey}`;

    const res = await fetch(geocodeUrl);
    const data = await res.json();

    if (data.status === "OK" && data.results?.[0]?.geometry?.location) {
      const { lat, lng } = data.results[0].geometry.location;
      return NextResponse.json({
        status: "OK",
        lat: String(lat),
        lng: String(lng),
        formattedAddress: data.results[0].formatted_address,
        placeId: data.results[0].place_id,
      });
    }

    return NextResponse.json({
      status: data.status || "UNKNOWN",
      error: data.error_message || `Google returned status: ${data.status}`,
      lat: null,
      lng: null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      status: "FETCH_ERROR",
      error: msg,
      lat: null,
      lng: null,
    });
  }
}

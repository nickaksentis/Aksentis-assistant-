import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savedLocations } from "@/lib/db/schema";
import { like } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ predictions: [] });
  }

  // Search saved locations first
  let saved: {
    placeId: string;
    description: string;
    mainText: string;
    secondaryText: string;
    isSaved: boolean;
  }[] = [];

  try {
    const savedResults = await db
      .select()
      .from(savedLocations)
      .where(like(savedLocations.name, `%${q}%`))
      .limit(3);

    saved = savedResults.map((loc) => ({
      placeId: loc.placeId || `saved-${loc.id}`,
      description: loc.address,
      mainText: loc.name,
      secondaryText: loc.locationType !== "other" ? loc.locationType : loc.address,
      isSaved: true,
    }));
  } catch {
    // Saved locations query is best-effort
  }

  // Then search Google Places
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ predictions: saved });
  }

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        q
      )}&key=${apiKey}&types=establishment|geocode`
    );
    const data = await res.json();

    const googlePredictions = (data.predictions || []).map(
      (p: {
        place_id: string;
        description: string;
        structured_formatting: {
          main_text: string;
          secondary_text: string;
        };
      }) => ({
        placeId: p.place_id,
        description: p.description,
        mainText: p.structured_formatting?.main_text || p.description,
        secondaryText: p.structured_formatting?.secondary_text || "",
        isSaved: false,
      })
    );

    // Saved locations first, then Google results (dedup by placeId)
    const savedPlaceIds = new Set(saved.map((s) => s.placeId));
    const deduped = googlePredictions.filter(
      (p: { placeId: string }) => !savedPlaceIds.has(p.placeId)
    );

    return NextResponse.json({ predictions: [...saved, ...deduped] });
  } catch {
    return NextResponse.json({ predictions: saved });
  }
}

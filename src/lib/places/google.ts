const MAX_TRAVEL_MINUTES = 180; // 3 hours

interface TravelTimeResult {
  durationMinutes: number;
  durationText: string;
  skip: boolean; // true if > 3 hours (likely vacation)
}

export interface PlaceSearchResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export async function searchPlaces(
  query: string,
  biasLat?: string,
  biasLng?: string
): Promise<PlaceSearchResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];

  try {
    let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      query
    )}&key=${apiKey}&types=establishment|geocode`;

    if (biasLat && biasLng) {
      url += `&location=${biasLat},${biasLng}&radius=80000`;
    }

    const res = await fetch(url);
    const data = await res.json();

    return (data.predictions || [])
      .slice(0, 5)
      .map(
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
        })
      );
  } catch {
    return [];
  }
}

export async function getTravelTime(
  originAddress: string,
  destinationPlaceId: string
): Promise<TravelTimeResult | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
        originAddress
      )}&destinations=place_id:${destinationPlaceId}&mode=driving&key=${apiKey}`
    );
    const data = await res.json();

    const element = data.rows?.[0]?.elements?.[0];
    if (!element || element.status !== "OK") return null;

    const durationMinutes = Math.ceil(element.duration.value / 60);
    return {
      durationMinutes,
      durationText: element.duration.text,
      skip: durationMinutes > MAX_TRAVEL_MINUTES,
    };
  } catch {
    return null;
  }
}

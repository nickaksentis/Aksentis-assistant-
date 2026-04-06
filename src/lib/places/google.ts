const MAX_TRAVEL_MINUTES = 180; // 3 hours

interface TravelTimeResult {
  durationMinutes: number;
  durationText: string;
  skip: boolean; // true if > 3 hours (likely vacation)
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

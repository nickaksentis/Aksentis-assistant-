import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern (New York)" },
  { value: "America/Chicago", label: "Central (Chicago)" },
  { value: "America/Denver", label: "Mountain (Denver)" },
  { value: "America/Los_Angeles", label: "Pacific (Los Angeles)" },
  { value: "America/Anchorage", label: "Alaska (Anchorage)" },
  { value: "Pacific/Honolulu", label: "Hawaii (Honolulu)" },
  { value: "America/Phoenix", label: "Arizona (Phoenix, no DST)" },
  { value: "America/Puerto_Rico", label: "Atlantic (Puerto Rico)" },
  { value: "Europe/London", label: "UK (London)" },
  { value: "Europe/Paris", label: "Central Europe (Paris)" },
  { value: "Europe/Berlin", label: "Central Europe (Berlin)" },
  { value: "Asia/Tokyo", label: "Japan (Tokyo)" },
  { value: "Asia/Shanghai", label: "China (Shanghai)" },
  { value: "Asia/Kolkata", label: "India (Kolkata)" },
  { value: "Australia/Sydney", label: "Australia (Sydney)" },
];

export async function getDefaultTimezone(): Promise<string> {
  try {
    const row = await db.query.siteSettings.findFirst({
      where: eq(siteSettings.key, "defaultTimezone"),
    });
    return row?.value || "America/New_York";
  } catch {
    return "America/New_York";
  }
}

/**
 * Convert a naive datetime-local string (e.g. "2026-04-10T15:00")
 * to a UTC ISO string, interpreting the input as being in the given timezone.
 */
export function naiveToUTC(naiveDatetime: string, timezone: string): string {
  const utcDate = fromZonedTime(naiveDatetime, timezone);
  return utcDate.toISOString();
}

/**
 * Format a UTC ISO string for display in a given timezone.
 */
export function formatEventTimeForTimezone(
  utcIsoString: string,
  timezone: string,
  formatStr: string = "EEEE, MMMM d 'at' h:mm a"
): string {
  return formatInTimeZone(utcIsoString, timezone, formatStr);
}

/**
 * Convert a UTC ISO string back to a naive datetime-local value
 * in the user's timezone (for form inputs).
 */
export function utcToLocalNaive(
  utcIsoString: string,
  timezone: string
): string {
  return formatInTimeZone(utcIsoString, timezone, "yyyy-MM-dd'T'HH:mm");
}

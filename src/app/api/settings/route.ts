import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";

// Public GET — returns site name, slogan (no auth needed for display)
export async function GET() {
  try {
    const rows = await db.select().from(siteSettings);
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return NextResponse.json(settings);
  } catch {
    // Table may not exist yet before migration
    return NextResponse.json({
      siteName: "Family Calendar",
      siteSlogan: "Keep everyone on the same page",
      defaultTimezone: "America/New_York",
    });
  }
}

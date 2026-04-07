import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { siteSettings, activityLog } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

// Admin GET — returns all settings
export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db.select().from(siteSettings);
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return NextResponse.json(settings);
}

// Admin PUT — update a setting
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates = await req.json();
  if (typeof updates !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Get current values for change tracking
  const currentRows = await db.select().from(siteSettings);
  const currentSettings: Record<string, string> = {};
  for (const row of currentRows) {
    currentSettings[row.key] = row.value;
  }

  const changes: Record<string, { old: unknown; new: unknown }> = {};

  for (const [key, value] of Object.entries(updates)) {
    if (typeof value !== "string") continue;
    const oldValue = currentSettings[key] || null;
    if (oldValue !== value) {
      changes[key] = { old: oldValue, new: value };
    }
    // Upsert: try update, if no rows affected, insert
    const result = await db
      .update(siteSettings)
      .set({ value })
      .where(eq(siteSettings.key, key))
      .returning();
    if (result.length === 0) {
      await db.insert(siteSettings).values({ key, value });
    }
  }

  // Log settings change
  if (Object.keys(changes).length > 0) {
    await db.insert(activityLog).values({
      action: "settings_updated",
      entityType: "settings",
      entityId: 0,
      memberId: session.memberId,
      changes: JSON.stringify(changes),
    });
  }

  return NextResponse.json({ success: true });
}

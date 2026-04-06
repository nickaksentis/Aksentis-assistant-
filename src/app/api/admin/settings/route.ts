import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
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

  for (const [key, value] of Object.entries(updates)) {
    if (typeof value !== "string") continue;
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

  return NextResponse.json({ success: true });
}

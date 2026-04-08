import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { blockedPhones } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(blockedPhones)
      .orderBy(desc(blockedPhones.blockedAt));

    return NextResponse.json({ blocked: rows, total: rows.length });
  } catch (err) {
    console.error("Failed to fetch blocked phones:", err);
    return NextResponse.json(
      { error: "Failed to fetch blocked numbers" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { phone, reason } = await req.json();
    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const normalized = phone.replace(/[^\d+]/g, "");
    await db
      .insert(blockedPhones)
      .values({
        phone: normalized,
        reason: reason || "Manually blocked by admin",
      })
      .onConflictDoNothing();

    return NextResponse.json({ success: true, phone: normalized });
  } catch (err) {
    console.error("Failed to block phone:", err);
    return NextResponse.json(
      { error: "Failed to block number" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    await db.delete(blockedPhones).where(eq(blockedPhones.phone, phone));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to unblock phone:", err);
    return NextResponse.json(
      { error: "Failed to unblock number" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savedLocations } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

// Admin GET — list all saved locations
export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const locations = await db
    .select()
    .from(savedLocations)
    .orderBy(desc(savedLocations.createdAt));

  return NextResponse.json(locations);
}

// Admin POST — add a new saved location
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, address, placeId, latitude, longitude, locationType } =
    await req.json();

  if (!name?.trim() || !address?.trim()) {
    return NextResponse.json(
      { error: "Name and address are required" },
      { status: 400 }
    );
  }

  const [location] = await db
    .insert(savedLocations)
    .values({
      name: name.trim(),
      address: address.trim(),
      placeId: placeId || null,
      latitude: latitude || null,
      longitude: longitude || null,
      locationType: locationType || "other",
    })
    .returning();

  return NextResponse.json(location, { status: 201 });
}

// Admin PUT — update a saved location
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, name, address, locationType } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (name?.trim()) updates.name = name.trim();
  if (address?.trim()) updates.address = address.trim();
  if (locationType) updates.locationType = locationType;

  const [updated] = await db
    .update(savedLocations)
    .set(updates)
    .where(eq(savedLocations.id, id))
    .returning();

  return NextResponse.json(updated);
}

// Admin DELETE — remove a saved location
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  await db.delete(savedLocations).where(eq(savedLocations.id, id));
  return NextResponse.json({ success: true });
}

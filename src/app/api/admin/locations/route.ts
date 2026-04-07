import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savedLocations, activityLog } from "@/lib/db/schema";
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

  await db.insert(activityLog).values({
    action: "location_created",
    entityType: "location",
    entityId: location.id,
    memberId: session.memberId,
    changes: JSON.stringify({ name: location.name, address: location.address }),
  });

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

  // Fetch existing for change tracking
  const existing = await db.query.savedLocations.findFirst({
    where: eq(savedLocations.id, id),
  });

  const [updated] = await db
    .update(savedLocations)
    .set(updates)
    .where(eq(savedLocations.id, id))
    .returning();

  if (existing) {
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    if (name?.trim() && name.trim() !== existing.name) changes.name = { old: existing.name, new: name.trim() };
    if (address?.trim() && address.trim() !== existing.address) changes.address = { old: existing.address, new: address.trim() };
    if (locationType && locationType !== existing.locationType) changes.locationType = { old: existing.locationType, new: locationType };
    if (Object.keys(changes).length > 0) {
      await db.insert(activityLog).values({
        action: "location_updated",
        entityType: "location",
        entityId: id,
        memberId: session.memberId,
        changes: JSON.stringify(changes),
      });
    }
  }

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

  // Fetch before deleting for the log
  const existing = await db.query.savedLocations.findFirst({
    where: eq(savedLocations.id, id),
  });

  await db.delete(savedLocations).where(eq(savedLocations.id, id));

  if (existing) {
    await db.insert(activityLog).values({
      action: "location_deleted",
      entityType: "location",
      entityId: id,
      memberId: session.memberId,
      changes: JSON.stringify({ name: existing.name }),
    });
  }

  return NextResponse.json({ success: true });
}

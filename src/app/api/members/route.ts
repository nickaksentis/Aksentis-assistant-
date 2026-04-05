import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { familyMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// Public: returns id + name only
export async function GET() {
  const members = await db
    .select({ id: familyMembers.id, name: familyMembers.name })
    .from(familyMembers);
  return NextResponse.json(members);
}

// Admin: create a new family member
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, phone, pin, isAdmin } = await req.json();
  if (!name?.trim() || !phone?.trim() || !pin?.trim()) {
    return NextResponse.json(
      { error: "Name, phone, and PIN are required" },
      { status: 400 }
    );
  }

  const [member] = await db
    .insert(familyMembers)
    .values({
      name: name.trim(),
      phone: phone.trim(),
      pin: pin.trim(),
      isAdmin: isAdmin || false,
    })
    .returning();

  return NextResponse.json(member, { status: 201 });
}

// Admin: update a family member
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, name, phone, pin, isAdmin } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (name?.trim()) updates.name = name.trim();
  if (phone?.trim()) updates.phone = phone.trim();
  if (pin?.trim()) updates.pin = pin.trim();
  if (typeof isAdmin === "boolean") updates.isAdmin = isAdmin;

  const [updated] = await db
    .update(familyMembers)
    .set(updates)
    .where(eq(familyMembers.id, id))
    .returning();

  return NextResponse.json(updated);
}

// Admin: delete a family member
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  await db.delete(familyMembers).where(eq(familyMembers.id, id));
  return NextResponse.json({ success: true });
}

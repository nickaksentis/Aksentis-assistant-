import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { familyMembers } from "@/lib/db/schema";

export async function GET() {
  const members = await db
    .select({ id: familyMembers.id, name: familyMembers.name })
    .from(familyMembers);
  return NextResponse.json(members);
}

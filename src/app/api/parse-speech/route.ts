import { NextRequest, NextResponse } from "next/server";
import { parseEventFromText } from "@/lib/ai/parse-event";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { familyMembers } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text } = await req.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI not configured. Set ANTHROPIC_API_KEY." },
      { status: 500 }
    );
  }

  try {
    const members = await db
      .select({ name: familyMembers.name })
      .from(familyMembers);
    const memberNames = members.map((m) => m.name);

    const parsed = await parseEventFromText(
      text,
      new Date().toISOString(),
      memberNames
    );

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("AI parse error:", err);
    return NextResponse.json(
      { error: "Failed to parse event from text" },
      { status: 500 }
    );
  }
}

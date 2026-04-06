import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { familyMembers, events, reminders, smsLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { parseEventFromText } from "@/lib/ai/parse-event";
import { generateTwimlResponse } from "@/lib/sms/twilio";
import { REMINDER_PRESETS } from "@/types";
import {
  naiveToUTC,
  getDefaultTimezone,
  formatEventTimeForTimezone,
} from "@/lib/timezone";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const from = formData.get("From") as string;
  const body = formData.get("Body") as string;
  const messageSid = formData.get("MessageSid") as string;

  if (!from || !body) {
    return new NextResponse(
      generateTwimlResponse("Invalid message received."),
      { headers: { "Content-Type": "text/xml" } }
    );
  }

  // Log inbound SMS
  await db.insert(smsLog).values({
    phone: from,
    messageBody: body,
    twilioSid: messageSid || null,
    direction: "inbound",
    status: "received",
  });

  // Check if sender is a registered family member
  const member = await db.query.familyMembers.findFirst({
    where: eq(familyMembers.phone, from),
  });

  // Unknown number — log as spam and reject
  if (!member) {
    await db.insert(smsLog).values({
      phone: from,
      messageBody: `[SPAM BLOCKED] Unknown number attempted: ${body}`,
      direction: "inbound",
      status: "spam_blocked",
    });

    return new NextResponse(
      generateTwimlResponse(
        "Sorry, this number isn't registered with the family calendar."
      ),
      { headers: { "Content-Type": "text/xml" } }
    );
  }

  // Handle YES activation response
  if (body.trim().toUpperCase() === "YES" && !member.isActive) {
    await db
      .update(familyMembers)
      .set({ isActive: true })
      .where(eq(familyMembers.id, member.id));

    await db.insert(smsLog).values({
      memberId: member.id,
      phone: from,
      messageBody: "You're all set! Your account is now active. You can now use the Family Calendar Assistant.",
      direction: "outbound",
      status: "sent",
    });

    return new NextResponse(
      generateTwimlResponse(
        "You're all set! Your account is now active. You can now use the Family Calendar Assistant."
      ),
      { headers: { "Content-Type": "text/xml" } }
    );
  }

  // Inactive member — block and prompt activation
  if (!member.isActive) {
    await db.insert(smsLog).values({
      memberId: member.id,
      phone: from,
      messageBody: `[INACTIVE BLOCKED] ${body}`,
      direction: "inbound",
      status: "inactive_blocked",
    });

    return new NextResponse(
      generateTwimlResponse(
        "Your account isn't active yet. Reply YES to activate."
      ),
      { headers: { "Content-Type": "text/xml" } }
    );
  }

  // Parse the message with AI
  try {
    const allMembers = await db
      .select({ name: familyMembers.name })
      .from(familyMembers);
    const memberNames = allMembers.map((m) => m.name);

    const parsed = await parseEventFromText(
      body,
      new Date().toISOString(),
      memberNames
    );

    if (!parsed.name || !parsed.date) {
      return new NextResponse(
        generateTwimlResponse(
          "I couldn't understand that. Try something like: 'Soccer practice Tuesday at 4pm at Lincoln Park'"
        ),
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // Convert parsed date to UTC using sender's timezone
    const memberTz =
      member.timezone || (await getDefaultTimezone());
    const utcDate = naiveToUTC(parsed.date, memberTz);

    // Create the event
    const [newEvent] = await db
      .insert(events)
      .values({
        name: parsed.name,
        date: utcDate,
        endDate: null,
        location: parsed.location || null,
        description: parsed.description || null,
        createdBy: member.id,
      })
      .returning();

    // Create default reminders
    const presetValues = parsed.reminderPresets?.length
      ? parsed.reminderPresets
      : ["1d"];

    const eventDate = new Date(utcDate);
    const reminderRows = presetValues
      .map((presetValue: string) => {
        const preset = REMINDER_PRESETS.find((p) => p.value === presetValue);
        if (!preset) return null;
        const scheduledAt = new Date(
          eventDate.getTime() - preset.minutes * 60 * 1000
        );
        if (scheduledAt <= new Date()) return null;
        return {
          eventId: newEvent.id,
          scheduledAt: scheduledAt.toISOString(),
          sendTo: "creator" as const,
          status: "pending" as const,
        };
      })
      .filter(Boolean);

    if (reminderRows.length > 0) {
      await db
        .insert(reminders)
        .values(reminderRows as typeof reminders.$inferInsert[]);
    }

    // Build confirmation message
    const formattedDate = formatEventTimeForTimezone(
      utcDate,
      memberTz,
      "EEE MMM d 'at' h:mm a"
    );
    const reminderInfo =
      reminderRows.length > 0
        ? ` Reminders set for ${presetValues.join(", ")} before.`
        : "";

    const confirmation = `Got it! Added '${parsed.name}' on ${formattedDate}.${parsed.location ? ` At ${parsed.location}.` : ""}${reminderInfo}`;

    // Log outbound response
    await db.insert(smsLog).values({
      memberId: member.id,
      phone: from,
      messageBody: confirmation,
      direction: "outbound",
      status: "sent",
    });

    return new NextResponse(generateTwimlResponse(confirmation), {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err) {
    console.error("Inbound SMS processing error:", err);
    return new NextResponse(
      generateTwimlResponse(
        "Sorry, something went wrong processing your message. Please try again."
      ),
      { headers: { "Content-Type": "text/xml" } }
    );
  }
}

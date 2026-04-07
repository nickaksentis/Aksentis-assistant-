import { db } from "@/lib/db";
import { familyMembers, events, reminders, smsLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { parseEventFromText } from "@/lib/ai/parse-event";
import { generateTwimlResponse } from "@/lib/messaging/send";
import { REMINDER_PRESETS } from "@/types";
import {
  naiveToUTC,
  getDefaultTimezone,
  formatEventTimeForTimezone,
} from "@/lib/timezone";

export type InboundChannel = "sms" | "whatsapp";

/**
 * Handle an inbound message from SMS or WhatsApp.
 * Returns TwiML response string.
 */
export async function handleInboundMessage(
  phone: string,
  body: string,
  messageSid: string | null,
  channel: InboundChannel
): Promise<string> {
  // Log inbound message
  await db.insert(smsLog).values({
    phone,
    messageBody: body,
    twilioSid: messageSid || null,
    direction: "inbound",
    status: "received",
  });

  // Check if sender is a registered family member
  const member = await db.query.familyMembers.findFirst({
    where: eq(familyMembers.phone, phone),
  });

  // Unknown number — log as spam and reject
  if (!member) {
    await db.insert(smsLog).values({
      phone,
      messageBody: `[SPAM BLOCKED] Unknown number attempted: ${body}`,
      direction: "inbound",
      status: "spam_blocked",
    });

    return generateTwimlResponse(
      "Sorry, this number isn't registered with the family calendar."
    );
  }

  // Handle YES activation response
  if (body.trim().toUpperCase() === "YES" && !member.isActive) {
    await db
      .update(familyMembers)
      .set({ isActive: true })
      .where(eq(familyMembers.id, member.id));

    const activationMsg =
      "You're all set! Your account is now active. You can now use the Family Calendar Assistant.";

    await db.insert(smsLog).values({
      memberId: member.id,
      phone,
      messageBody: activationMsg,
      direction: "outbound",
      status: "sent",
    });

    return generateTwimlResponse(activationMsg);
  }

  // Inactive member — block and prompt activation
  if (!member.isActive) {
    await db.insert(smsLog).values({
      memberId: member.id,
      phone,
      messageBody: `[INACTIVE BLOCKED] ${body}`,
      direction: "inbound",
      status: "inactive_blocked",
    });

    return generateTwimlResponse(
      "Your account isn't active yet. Reply YES to activate."
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
      return generateTwimlResponse(
        "I couldn't understand that. Try something like: 'Soccer practice Tuesday at 4pm at Lincoln Park'"
      );
    }

    // Convert parsed date to UTC using sender's timezone
    const memberTz = member.timezone || (await getDefaultTimezone());
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

    const channelLabel = channel === "whatsapp" ? "WhatsApp" : "SMS";
    const confirmation = `Got it! Added '${parsed.name}' on ${formattedDate}.${parsed.location ? ` At ${parsed.location}.` : ""}${reminderInfo}`;

    // Log outbound response
    await db.insert(smsLog).values({
      memberId: member.id,
      phone,
      messageBody: confirmation,
      direction: "outbound",
      status: "sent",
    });

    return generateTwimlResponse(confirmation);
  } catch (err) {
    console.error(`Inbound ${channel} processing error:`, err);
    return generateTwimlResponse(
      "Sorry, something went wrong processing your message. Please try again."
    );
  }
}

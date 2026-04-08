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
import { getTemplate, interpolate } from "@/lib/messaging/templates";

export type InboundChannel = "sms" | "whatsapp";

/**
 * Handle an inbound message from SMS or WhatsApp.
 * Returns TwiML response string.
 */
export async function handleInboundMessage(
  rawPhone: string,
  body: string,
  messageSid: string | null,
  channel: InboundChannel
): Promise<string> {
  // Normalize phone: strip whatsapp: prefix and whitespace
  const phone = rawPhone.replace(/^whatsapp:/, "").trim();

  // Log inbound message
  await db.insert(smsLog).values({
    phone,
    messageBody: body,
    twilioSid: messageSid || null,
    direction: "inbound",
    status: "received",
    channel,
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
      channel,
    });

    const unregisteredMsg = await getTemplate("tpl_unregistered");
    await db.insert(smsLog).values({
      phone,
      messageBody: unregisteredMsg,
      direction: "outbound",
      status: "sent",
      channel,
    });
    return generateTwimlResponse(unregisteredMsg);
  }

  // Handle YES activation response
  if (body.trim().toUpperCase() === "YES" && !member.isActive) {
    await db
      .update(familyMembers)
      .set({ isActive: true })
      .where(eq(familyMembers.id, member.id));

    const activationMsg = await getTemplate("tpl_activation_success");

    await db.insert(smsLog).values({
      memberId: member.id,
      phone,
      messageBody: activationMsg,
      direction: "outbound",
      status: "sent",
      channel,
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
      channel,
    });

    const inactiveMsg = await getTemplate("tpl_inactive_prompt");
    await db.insert(smsLog).values({
      memberId: member.id,
      phone,
      messageBody: inactiveMsg,
      direction: "outbound",
      status: "sent",
      channel,
    });
    return generateTwimlResponse(inactiveMsg);
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
      const replyMsg = await getTemplate("tpl_parse_failure");
      await db.insert(smsLog).values({
        memberId: member.id,
        phone,
        messageBody: replyMsg,
        direction: "outbound",
        status: "sent",
        channel,
      });
      return generateTwimlResponse(replyMsg);
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

    // Build confirmation message from template
    const formattedDate = formatEventTimeForTimezone(
      utcDate,
      memberTz,
      "EEE MMM d 'at' h:mm a"
    );
    const reminderInfo =
      reminderRows.length > 0
        ? ` Reminders set for ${presetValues.join(", ")} before.`
        : "";

    const confirmTpl = await getTemplate("tpl_event_created_inbound");
    const confirmation = interpolate(confirmTpl, {
      EventName: parsed.name,
      Date: formattedDate,
      Location: parsed.location ? ` At ${parsed.location}.` : "",
      ReminderTimes: reminderInfo,
    });

    // Log outbound response
    await db.insert(smsLog).values({
      memberId: member.id,
      phone,
      messageBody: confirmation,
      direction: "outbound",
      status: "sent",
      channel,
    });

    return generateTwimlResponse(confirmation);
  } catch (err) {
    console.error(`Inbound ${channel} processing error:`, err);
    const errorMsg = await getTemplate("tpl_error");
    await db.insert(smsLog).values({
      memberId: member.id,
      phone,
      messageBody: errorMsg,
      direction: "outbound",
      status: "sent",
      channel,
    });
    return generateTwimlResponse(errorMsg);
  }
}

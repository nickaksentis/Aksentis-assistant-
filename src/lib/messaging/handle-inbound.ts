import { db } from "@/lib/db";
import {
  familyMembers,
  smsLog,
  blockedPhones,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  generateTwimlResponse,
  generateEmptyTwimlResponse,
} from "@/lib/messaging/send";
import { getTemplate, interpolate } from "@/lib/messaging/templates";
import {
  getConversationHistory,
  getUpcomingEvents,
  getPastEvents,
  getSavedLocations,
  buildConversationContext,
} from "@/lib/ai/context";
import { processConversation } from "@/lib/ai/conversation";
import { executeAction } from "@/lib/ai/actions";
import { getDefaultTimezone, formatEventTimeForTimezone } from "@/lib/timezone";

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

  // ── Check if phone is blocked ──
  const blocked = await db.query.blockedPhones.findFirst({
    where: eq(blockedPhones.phone, phone),
  });
  if (blocked) {
    // Silent rejection — no response
    await db.insert(smsLog).values({
      phone,
      messageBody: `[BLOCKED] ${body}`,
      direction: "inbound",
      status: "spam_blocked",
      channel,
    });
    return generateEmptyTwimlResponse();
  }

  // ── Look up registered family member ──
  const member = await db.query.familyMembers.findFirst({
    where: eq(familyMembers.phone, phone),
  });

  // ── Unregistered number — silent rejection + spam tracking ──
  if (!member) {
    await db.insert(smsLog).values({
      phone,
      messageBody: `[SPAM BLOCKED] Unknown number attempted: ${body}`,
      direction: "inbound",
      status: "spam_blocked",
      channel,
    });

    // Count previous spam attempts for this number
    const spamLogs = await db
      .select({ id: smsLog.id })
      .from(smsLog)
      .where(
        and(
          eq(smsLog.phone, phone),
          eq(smsLog.status, "spam_blocked")
        )
      );

    // After 3 attempts, auto-block the number
    if (spamLogs.length >= 3) {
      await db
        .insert(blockedPhones)
        .values({
          phone,
          reason: `Auto-blocked after ${spamLogs.length} unregistered attempts`,
        })
        .onConflictDoNothing();
    }

    // Silent rejection — no response to unregistered numbers
    return generateEmptyTwimlResponse();
  }

  // ── Handle YES activation response ──
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

  // ── Inactive member — prompt activation ──
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

  // ── Active member — Conversational AI ──
  try {
    const memberTz = member.timezone || (await getDefaultTimezone());
    const currentDate = formatEventTimeForTimezone(
      new Date().toISOString(),
      memberTz,
      "EEE MMM d, yyyy 'at' h:mm a zzz"
    );

    // Build conversation context
    const [history, upcomingEvents, pastEvents, savedLocs, allMembers] =
      await Promise.all([
        getConversationHistory(member.id),
        getUpcomingEvents(183, memberTz),
        getPastEvents(183, memberTz),
        getSavedLocations(),
        db
          .select({ id: familyMembers.id, name: familyMembers.name })
          .from(familyMembers),
      ]);

    const context = buildConversationContext(
      { id: member.id, name: member.name, timezone: member.timezone },
      history,
      upcomingEvents,
      pastEvents,
      savedLocs,
      allMembers,
      currentDate
    );

    // Process through conversational AI
    const aiResponse = await processConversation(body, context);

    // Execute action if present
    if (aiResponse.action) {
      const result = await executeAction(
        aiResponse.action,
        member.id,
        member.timezone
      );
      if (!result.success) {
        console.error("Action execution failed:", result.detail);
      }
    }

    // Log outbound response
    await db.insert(smsLog).values({
      memberId: member.id,
      phone,
      messageBody: aiResponse.reply,
      direction: "outbound",
      status: "sent",
      channel,
    });

    return generateTwimlResponse(aiResponse.reply);
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

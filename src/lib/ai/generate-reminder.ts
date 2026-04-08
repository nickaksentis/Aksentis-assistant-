import Anthropic from "@anthropic-ai/sdk";
import { getAiTone } from "@/lib/messaging/templates";

const anthropic = new Anthropic();

interface ReminderContext {
  recipientName: string;
  eventName: string;
  eventDate: string;
  eventLocation?: string | null;
  travelTimeMinutes?: number | null;
}

export async function generateReminderMessage(
  context: ReminderContext
): Promise<string> {
  const locationInfo = context.eventLocation
    ? `Location: ${context.eventLocation}${context.travelTimeMinutes ? ` (about ${context.travelTimeMinutes} min drive)` : ""}`
    : "";

  const tonePrompt = await getAiTone("ai_reminder_prompt");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `${tonePrompt}

Recipient: ${context.recipientName}
Event: ${context.eventName}
Date/Time: ${context.eventDate}
${locationInfo}

Respond with ONLY the SMS message text, no quotes or explanation.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type");
  }
  return content.text.trim();
}

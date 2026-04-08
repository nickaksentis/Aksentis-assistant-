import Anthropic from "@anthropic-ai/sdk";
import { getAiTone } from "@/lib/messaging/templates";
import type { ConversationContext, AIResponse } from "./types";

const anthropic = new Anthropic();

/**
 * Process a conversational message through Claude.
 * Returns a natural language reply and an optional structured action.
 */
export async function processConversation(
  userMessage: string,
  context: ConversationContext
): Promise<AIResponse> {
  const systemPrompt = await getAiTone("ai_conversation_prompt");

  // Build the contextual system prompt with injected data
  const fullSystemPrompt = `${systemPrompt}

Current date and time: ${context.currentDate}
You are talking to: ${context.memberName}
Family members: ${context.familyMembers.map((m) => `${m.name} (id: ${m.id})`).join(", ")}

Upcoming events (next 6 months):
${
  context.upcomingEvents.length === 0
    ? "No upcoming events."
    : context.upcomingEvents
        .map(
          (e) =>
            `- [ID: ${e.id}] "${e.name}" on ${e.date}${e.location ? ` at ${e.location}` : ""}${e.description ? ` — ${e.description}` : ""}${e.attendees.length > 0 ? ` (attendees: ${e.attendees.join(", ")})` : ""}`
        )
        .join("\n")
}

Past events (last 6 months):
${
  context.pastEvents.length === 0
    ? "No past events."
    : context.pastEvents
        .map(
          (e) =>
            `- [ID: ${e.id}] "${e.name}" on ${e.date}${e.location ? ` at ${e.location}` : ""}${e.description ? ` — ${e.description}` : ""}`
        )
        .join("\n")
}

Saved locations:
${
  context.savedLocations.length === 0
    ? "No saved locations."
    : context.savedLocations
        .map(
          (loc) =>
            `- [ID: ${loc.id}] "${loc.name}" — ${loc.address}${loc.locationType !== "other" ? ` (${loc.locationType.replace("_", " ")})` : ""}`
        )
        .join("\n")
}`;

  // Build Claude messages array from conversation history
  const messages: Anthropic.MessageParam[] = context.recentMessages.map(
    (msg) => ({
      role: msg.role,
      content: msg.content,
    })
  );

  // Append the current user message
  messages.push({ role: "user", content: userMessage });

  // Ensure messages alternate roles (Claude requirement)
  // If first message is "assistant", prepend a user placeholder
  if (messages.length > 0 && messages[0].role === "assistant") {
    messages.unshift({ role: "user", content: "(previous conversation)" });
  }

  // Merge consecutive same-role messages
  const mergedMessages: Anthropic.MessageParam[] = [];
  for (const msg of messages) {
    if (
      mergedMessages.length > 0 &&
      mergedMessages[mergedMessages.length - 1].role === msg.role
    ) {
      // Merge content
      const prev = mergedMessages[mergedMessages.length - 1];
      prev.content = `${prev.content}\n${msg.content}`;
    } else {
      mergedMessages.push({ ...msg });
    }
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: fullSystemPrompt,
    messages: mergedMessages,
  });

  const content = response.content[0];
  if (content.type !== "text") {
    return {
      reply: "Sorry, I had trouble processing that. Please try again.",
      action: null,
    };
  }

  // Parse JSON response
  try {
    // Strip markdown code fences if present
    let text = content.text.trim();
    if (text.startsWith("```")) {
      text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(text) as AIResponse;

    if (!parsed.reply || typeof parsed.reply !== "string") {
      const cleanText = content.text
        .replace(/\{[\s\S]*"reply"\s*:[\s\S]*\}\s*$/, "")
        .trim();
      return {
        reply: (cleanText || "Sorry, I had trouble processing that.").substring(0, 480),
        action: null,
      };
    }

    return parsed;
  } catch {
    // Try to extract JSON from mixed text+JSON responses
    const jsonMatch = content.text.match(/\{[\s\S]*"reply"\s*:\s*"[\s\S]*\}$/);
    if (jsonMatch) {
      try {
        const extracted = JSON.parse(jsonMatch[0]) as AIResponse;
        if (extracted.reply && typeof extracted.reply === "string") {
          return extracted;
        }
      } catch {
        // extraction also failed, fall through
      }
    }

    // Final fallback: strip any JSON artifacts from the text
    console.warn(
      "AI response was not valid JSON, using as plain text:",
      content.text.substring(0, 200)
    );
    const cleanText = content.text
      .replace(/\{[\s\S]*"reply"\s*:[\s\S]*\}\s*$/, "")
      .trim();
    return {
      reply: (cleanText || content.text.trim()).substring(0, 480),
      action: null,
    };
  }
}

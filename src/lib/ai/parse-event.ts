import Anthropic from "@anthropic-ai/sdk";

interface ParsedEvent {
  name: string;
  date: string | null;
  endDate: string | null;
  location: string | null;
  description: string | null;
  attendees: string[];
  reminderPresets: string[];
}

const anthropic = new Anthropic();

export async function parseEventFromText(
  text: string,
  currentDate: string,
  familyMembers: string[]
): Promise<ParsedEvent> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a helpful assistant that parses natural language into calendar event data.

Current date and time: ${currentDate}
Family members: ${familyMembers.join(", ")}

Parse the following text into a calendar event. Return a JSON object with these fields:
- name: string (event title)
- date: string | null (ISO datetime like "2026-04-10T16:00", infer from context if relative dates like "next Tuesday")
- endDate: string | null (ISO datetime, if mentioned)
- location: string | null
- description: string | null (any extra details)
- attendees: string[] (names of family members mentioned, matched from the list above)
- reminderPresets: string[] (suggested from: "1h", "3h", "1d", "2d", "1w", "2w", "1mo", "2mo", "6mo" - default to ["1d"] if not specified)

Respond ONLY with the JSON object, no markdown or explanation.

Text: "${text}"`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type");
  }

  return JSON.parse(content.text) as ParsedEvent;
}

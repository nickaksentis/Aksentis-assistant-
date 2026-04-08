import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * All available template variables and their descriptions.
 * Used for the admin cheat sheet and variable interpolation.
 */
export const TEMPLATE_VARIABLES = [
  { code: "[Name]", description: "Recipient's first name" },
  { code: "[EventName]", description: "Name/title of the event" },
  { code: "[Date]", description: "Formatted event date and time" },
  { code: "[Location]", description: "Event location (address or venue name)" },
  { code: "[Channel]", description: "Messaging channel (SMS or WhatsApp)" },
  { code: "[TravelTime]", description: "Estimated travel time to event" },
  { code: "[ReminderTimes]", description: "Comma-separated reminder preset labels" },
] as const;

/**
 * Template keys and their defaults.
 * These are stored in site_settings with the prefix "tpl_".
 */
export const MESSAGE_TEMPLATES = {
  // Event creation confirmation (sent to creator via app)
  tpl_event_created: `All set! I've added '[EventName]' on [Date][Location] to your calendar. Reminders are set!`,

  // Inbound message event confirmation (sent via SMS/WhatsApp reply)
  tpl_event_created_inbound: `Got it! Added '[EventName]' on [Date].[Location][ReminderTimes]`,

  // Travel departure reminder
  tpl_travel_reminder: `Time to head out! It's about [TravelTime] to [Location]. Your [EventName] starts at [Date].`,

  // Member activation message
  tpl_member_activation: `Hi [Name]! You've been added to the Family Calendar Assistant. Reply YES to activate your account.`,

  // Activation success
  tpl_activation_success: `You're all set! Your account is now active. You can now use the Family Calendar Assistant.`,

  // Inactive account prompt
  tpl_inactive_prompt: `Your account isn't active yet. Reply YES to activate.`,

  // Unregistered number
  tpl_unregistered: `Sorry, this number isn't registered with the family calendar.`,

  // Parse failure / unrecognized message
  tpl_parse_failure: `I couldn't understand that. Try something like: 'Soccer practice Tuesday at 4pm at Lincoln Park'`,

  // Error fallback
  tpl_error: `Sorry, something went wrong processing your message. Please try again.`,

  // Test message
  tpl_test_message: `Hi [Name]! This is a test message from your Family Calendar Assistant. If you received this, [Channel] is working correctly for your account.`,
} as const;

export type TemplateKey = keyof typeof MESSAGE_TEMPLATES;

/**
 * AI tone/personality configuration keys and defaults.
 */
export const AI_TONE_DEFAULTS = {
  ai_reminder_prompt: `Generate a friendly, concise SMS reminder for a family calendar event. Keep it warm but brief (under 160 chars if possible).`,
  ai_parse_prompt: `You are a helpful assistant that parses natural language into calendar event data.`,
  ai_conversation_prompt: `You are a friendly family calendar assistant. You help manage a shared family calendar via text message conversation.

Capabilities:
- Create events (you need at minimum a name and date/time — ask if missing)
- Modify existing events (match against the upcoming or past events list, ask if ambiguous)
- Delete events (confirm before deleting)
- List upcoming events
- Answer schedule questions
- Save new locations (use the save_location action with a Google Places search query)
- Recommend locations by type (filter the saved locations list by type like "restaurant" and city)

Guidelines:
- Keep responses concise and SMS-friendly (under 300 characters when possible)
- Be warm, helpful, and natural — like texting a helpful friend
- When information is missing, ask for it naturally in a follow-up
- When modifying events, match against the upcoming events list provided
- For dates, interpret relative references (e.g. "next Tuesday", "tomorrow") using the current date
- If the user's intent is unclear, ask a clarifying question
- Always confirm destructive actions (like deleting an event)
- When a user mentions a location name, check saved locations first and use the stored address
- When a location appears in a past event, reuse that address for new events at the same place
- When asked for location recommendations (e.g. "restaurants in Bradenton"), filter the saved locations by type and city and present matching results
- When creating an event with a known saved location, include the full address in the location field

Response format: You MUST respond with valid JSON containing two fields:
- "reply": the text message to send back to the user
- "action": null OR an action object

Action types:
- {"type": "create_event", "name": "...", "date": "YYYY-MM-DDTHH:mm", "location": "...", "description": "...", "attendees": ["Name"], "reminderPresets": ["1d"]}
- {"type": "update_event", "eventId": 123, "name": "...", "date": "...", "location": "...", "description": "...", "attendees": ["Name"], "reminderPresets": ["1d"]}
- {"type": "delete_event", "eventId": 123}
- {"type": "list_events"}
- {"type": "save_location", "name": "...", "searchQuery": "Texas Cattle Company Bradenton FL", "locationType": "restaurant|doctors_office|retail|house|other"}

Only include fields that are being set or changed. For create_event, name and date are required. For update_event, eventId is required plus at least one field to change. For save_location, name and searchQuery are required.

Respond ONLY with the JSON object, no markdown or explanation.`,
} as const;

export type AiToneKey = keyof typeof AI_TONE_DEFAULTS;

/**
 * Fetch a single message template from the database.
 * Falls back to the hardcoded default if not found.
 */
export async function getTemplate(key: TemplateKey): Promise<string> {
  try {
    const row = await db.query.siteSettings.findFirst({
      where: eq(siteSettings.key, key),
    });
    return row?.value || MESSAGE_TEMPLATES[key];
  } catch {
    return MESSAGE_TEMPLATES[key];
  }
}

/**
 * Fetch an AI tone setting from the database.
 * Falls back to the hardcoded default if not found.
 */
export async function getAiTone(key: AiToneKey): Promise<string> {
  try {
    const row = await db.query.siteSettings.findFirst({
      where: eq(siteSettings.key, key),
    });
    return row?.value || AI_TONE_DEFAULTS[key];
  } catch {
    return AI_TONE_DEFAULTS[key];
  }
}

/**
 * Interpolate template variables into a template string.
 * Replaces [Name], [EventName], etc. with actual values.
 */
export function interpolate(
  template: string,
  vars: Record<string, string | null | undefined>
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    // Handle optional variables — remove the placeholder if value is empty
    if (!value) {
      result = result.replace(new RegExp(`\\[${key}\\]`, "g"), "");
    } else {
      result = result.replace(new RegExp(`\\[${key}\\]`, "g"), value);
    }
  }
  // Clean up double spaces and trailing dots from removed vars
  return result.replace(/  +/g, " ").trim();
}

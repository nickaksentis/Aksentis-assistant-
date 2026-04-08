/**
 * Shared TypeScript interfaces for the conversational AI system.
 */

export interface ConversationContext {
  memberName: string;
  memberId: number;
  memberTimezone: string;
  familyMembers: { id: number; name: string }[];
  recentMessages: { role: "user" | "assistant"; content: string }[];
  upcomingEvents: {
    id: number;
    name: string;
    date: string;
    location: string | null;
    description: string | null;
    attendees: string[];
    reminders: { scheduledAt: string; status: string }[];
  }[];
  currentDate: string;
}

export interface CreateEventAction {
  type: "create_event";
  name: string;
  date: string; // ISO datetime like "2026-04-10T16:00"
  location?: string;
  description?: string;
  attendees?: string[];
  reminderPresets?: string[];
}

export interface UpdateEventAction {
  type: "update_event";
  eventId: number;
  name?: string;
  date?: string;
  location?: string;
  description?: string;
  attendees?: string[];
  reminderPresets?: string[];
}

export interface DeleteEventAction {
  type: "delete_event";
  eventId: number;
}

export interface ListEventsAction {
  type: "list_events";
}

export type AIAction =
  | CreateEventAction
  | UpdateEventAction
  | DeleteEventAction
  | ListEventsAction;

export interface AIResponse {
  reply: string;
  action: AIAction | null;
}

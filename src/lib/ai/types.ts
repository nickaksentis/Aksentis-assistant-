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
  pastEvents: {
    id: number;
    name: string;
    date: string;
    location: string | null;
    description: string | null;
    attendees: string[];
  }[];
  savedLocations: {
    id: number;
    name: string;
    address: string;
    locationType: string;
  }[];
  currentDate: string;
}

export interface CreateEventAction {
  type: "create_event";
  name: string;
  date: string; // ISO datetime like "2026-04-10T16:00"
  location?: string;
  placeId?: string;
  latitude?: string;
  longitude?: string;
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

export interface SaveLocationAction {
  type: "save_location";
  name: string;
  address?: string;
  searchQuery?: string;
  locationType?: "restaurant" | "doctors_office" | "retail" | "house" | "other";
}

export type AIAction =
  | CreateEventAction
  | UpdateEventAction
  | DeleteEventAction
  | ListEventsAction
  | SaveLocationAction;

export interface AIResponse {
  reply: string;
  action: AIAction | null;
}

import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  familyMembers,
  events,
  reminders,
  smsLog,
} from "@/lib/db/schema";

export type FamilyMember = InferSelectModel<typeof familyMembers>;
export type NewFamilyMember = InferInsertModel<typeof familyMembers>;

export type Event = InferSelectModel<typeof events>;
export type NewEvent = InferInsertModel<typeof events>;

export type Reminder = InferSelectModel<typeof reminders>;
export type NewReminder = InferInsertModel<typeof reminders>;

export type SmsLogEntry = InferSelectModel<typeof smsLog>;

export const REMINDER_PRESETS = [
  { label: "1 hour", value: "1h", minutes: 60 },
  { label: "3 hours", value: "3h", minutes: 180 },
  { label: "1 day", value: "1d", minutes: 1440 },
  { label: "2 days", value: "2d", minutes: 2880 },
  { label: "1 week", value: "1w", minutes: 10080 },
  { label: "2 weeks", value: "2w", minutes: 20160 },
  { label: "1 month", value: "1mo", minutes: 43200 },
  { label: "2 months", value: "2mo", minutes: 86400 },
  { label: "6 months", value: "6mo", minutes: 259200 },
] as const;

export type ReminderPreset = (typeof REMINDER_PRESETS)[number]["value"];

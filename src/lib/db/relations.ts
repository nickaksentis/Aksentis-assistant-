import { relations } from "drizzle-orm";
import {
  familyMembers,
  events,
  eventAttendees,
  reminders,
  smsLog,
  activityLog,
} from "./schema";

export const familyMembersRelations = relations(familyMembers, ({ many }) => ({
  events: many(events),
  attendances: many(eventAttendees),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(familyMembers, {
    fields: [events.createdBy],
    references: [familyMembers.id],
  }),
  attendees: many(eventAttendees),
  reminders: many(reminders),
}));

export const eventAttendeesRelations = relations(
  eventAttendees,
  ({ one }) => ({
    event: one(events, {
      fields: [eventAttendees.eventId],
      references: [events.id],
    }),
    member: one(familyMembers, {
      fields: [eventAttendees.memberId],
      references: [familyMembers.id],
    }),
  })
);

export const remindersRelations = relations(reminders, ({ one }) => ({
  event: one(events, {
    fields: [reminders.eventId],
    references: [events.id],
  }),
}));

export const smsLogRelations = relations(smsLog, ({ one }) => ({
  reminder: one(reminders, {
    fields: [smsLog.reminderId],
    references: [reminders.id],
  }),
  member: one(familyMembers, {
    fields: [smsLog.memberId],
    references: [familyMembers.id],
  }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  member: one(familyMembers, {
    fields: [activityLog.memberId],
    references: [familyMembers.id],
  }),
}));

import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const familyMembers = sqliteTable("family_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  pin: text("pin").notNull(),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  date: text("date").notNull(),
  endDate: text("end_date"),
  location: text("location"),
  placeId: text("place_id"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  description: text("description"),
  createdBy: integer("created_by")
    .notNull()
    .references(() => familyMembers.id),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const eventAttendees = sqliteTable(
  "event_attendees",
  {
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    memberId: integer("member_id")
      .notNull()
      .references(() => familyMembers.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.eventId, table.memberId] })]
);

export const reminders = sqliteTable("reminders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  scheduledAt: text("scheduled_at").notNull(),
  sendTo: text("send_to", { enum: ["creator", "attendees", "all"] })
    .notNull()
    .default("creator"),
  status: text("status", { enum: ["pending", "sent", "failed"] })
    .notNull()
    .default("pending"),
  messageBody: text("message_body"),
  sentAt: text("sent_at"),
});

export const smsLog = sqliteTable("sms_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reminderId: integer("reminder_id").references(() => reminders.id),
  memberId: integer("member_id").references(() => familyMembers.id),
  phone: text("phone").notNull(),
  messageBody: text("message_body").notNull(),
  twilioSid: text("twilio_sid"),
  direction: text("direction", { enum: ["inbound", "outbound"] })
    .notNull()
    .default("outbound"),
  status: text("status").notNull().default("queued"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const familyMembers = sqliteTable("family_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  pin: text("pin").notNull(),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  timezone: text("timezone"),
  homeAddress: text("home_address"),
  homePlaceId: text("home_place_id"),
  homeLat: text("home_lat"),
  homeLng: text("home_lng"),
  preferredChannel: text("preferred_channel"),
  canManageLocations: integer("can_manage_locations", { mode: "boolean" }).notNull().default(false),
  canManageEvents: integer("can_manage_events", { mode: "boolean" }).notNull().default(false),
  canManageMembers: integer("can_manage_members", { mode: "boolean" }).notNull().default(false),
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
  channel: text("channel"),
  status: text("status").notNull().default("queued"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const activityLog = sqliteTable("activity_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  action: text("action").notNull(), // "event_created", "event_updated"
  entityType: text("entity_type").notNull(), // "event"
  entityId: integer("entity_id").notNull(),
  memberId: integer("member_id").references(() => familyMembers.id),
  changes: text("changes"), // JSON string of { field: { old, new } }
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const savedLocations = sqliteTable("saved_locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  address: text("address").notNull(),
  placeId: text("place_id"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  locationType: text("location_type").notNull().default("other"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const blockedPhones = sqliteTable("sms_blocked_phones", {
  phone: text("phone").primaryKey(),
  reason: text("reason"),
  blockedAt: text("blocked_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

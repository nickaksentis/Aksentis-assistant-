#!/usr/bin/env node
// Run this script to create tables and seed the database on Turso.
// Usage: node setup-remote-db.mjs

import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Set DATABASE_URL and DATABASE_AUTH_TOKEN environment variables.");
  process.exit(1);
}

const client = createClient({ url, authToken });

const tables = [
  `CREATE TABLE IF NOT EXISTS family_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    pin TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    end_date TEXT,
    location TEXT,
    place_id TEXT,
    latitude TEXT,
    longitude TEXT,
    description TEXT,
    created_by INTEGER NOT NULL REFERENCES family_members(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS event_attendees (
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, member_id)
  )`,
  `CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    scheduled_at TEXT NOT NULL,
    send_to TEXT NOT NULL DEFAULT 'creator',
    status TEXT NOT NULL DEFAULT 'pending',
    message_body TEXT,
    sent_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS sms_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reminder_id INTEGER REFERENCES reminders(id),
    member_id INTEGER REFERENCES family_members(id),
    phone TEXT NOT NULL,
    message_body TEXT NOT NULL,
    twilio_sid TEXT,
    direction TEXT NOT NULL DEFAULT 'outbound',
    status TEXT NOT NULL DEFAULT 'queued',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
];

const seeds = [
  `INSERT OR IGNORE INTO family_members (id, name, phone, pin, is_admin) VALUES (1, 'Nick', '+10000000000', '1234', 1)`,
  `INSERT OR IGNORE INTO family_members (id, name, phone, pin, is_admin) VALUES (2, 'Partner', '+10000000001', '1234', 0)`,
];

async function run() {
  console.log("Creating tables...");
  for (const sql of tables) {
    await client.execute(sql);
  }
  console.log("✓ All 5 tables created.");

  console.log("Seeding family members...");
  for (const sql of seeds) {
    await client.execute(sql);
  }
  console.log("✓ Seed complete. Default PIN for all members: 1234");
  console.log("\nUpdate the phone numbers and PINs from the Admin page after logging in.");
}

run().catch((e) => {
  console.error("Failed:", e.message);
  process.exit(1);
});

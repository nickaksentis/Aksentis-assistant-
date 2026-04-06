import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

// This endpoint runs database migrations automatically.
// Called during Vercel build or manually.
const migrations = [
  // v1.0.0 - Base tables (idempotent with IF NOT EXISTS)
  `CREATE TABLE IF NOT EXISTS family_members (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT NOT NULL, pin TEXT NOT NULL, is_admin INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1, home_address TEXT, home_place_id TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, date TEXT NOT NULL, end_date TEXT, location TEXT, place_id TEXT, latitude TEXT, longitude TEXT, description TEXT, created_by INTEGER NOT NULL REFERENCES family_members(id), created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS event_attendees (event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE, member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE, PRIMARY KEY (event_id, member_id))`,
  `CREATE TABLE IF NOT EXISTS reminders (id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE, scheduled_at TEXT NOT NULL, send_to TEXT NOT NULL DEFAULT 'creator', status TEXT NOT NULL DEFAULT 'pending', message_body TEXT, sent_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS sms_log (id INTEGER PRIMARY KEY AUTOINCREMENT, reminder_id INTEGER REFERENCES reminders(id), member_id INTEGER REFERENCES family_members(id), phone TEXT NOT NULL, message_body TEXT NOT NULL, twilio_sid TEXT, direction TEXT NOT NULL DEFAULT 'outbound', status TEXT NOT NULL DEFAULT 'queued', created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS saved_locations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, address TEXT NOT NULL, place_id TEXT, latitude TEXT, longitude TEXT, location_type TEXT NOT NULL DEFAULT 'other', created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS activity_log (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id INTEGER NOT NULL, member_id INTEGER REFERENCES family_members(id), changes TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  // v1.3.0 - Site settings
  `CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
];

// ALTER TABLE migrations — these use a try/catch per statement since
// SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN.
const alterMigrations = [
  `ALTER TABLE family_members ADD COLUMN home_address TEXT`,
  `ALTER TABLE family_members ADD COLUMN home_place_id TEXT`,
  `ALTER TABLE family_members ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1`,
  // v1.3.0
  `ALTER TABLE family_members ADD COLUMN timezone TEXT`,
];

export async function POST() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  if (!url) {
    return NextResponse.json(
      { error: "DATABASE_URL not configured" },
      { status: 500 }
    );
  }

  const client = createClient({ url, authToken });
  const results: string[] = [];

  // Run CREATE TABLE migrations
  for (const sql of migrations) {
    try {
      await client.execute(sql);
      const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
      results.push(`✓ Table ${tableName} ready`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push(`✗ ${msg}`);
    }
  }

  // Run ALTER TABLE migrations (ignore "duplicate column" errors)
  for (const sql of alterMigrations) {
    try {
      await client.execute(sql);
      results.push(`✓ ${sql.substring(0, 60)}...`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("duplicate column") || msg.includes("already exists")) {
        results.push(`- Column already exists, skipped`);
      } else {
        results.push(`✗ ${msg}`);
      }
    }
  }

  // Seed site_settings with defaults (INSERT OR IGNORE = idempotent)
  const seedStatements = [
    `INSERT OR IGNORE INTO site_settings (key, value) VALUES ('siteName', 'Family Calendar')`,
    `INSERT OR IGNORE INTO site_settings (key, value) VALUES ('siteSlogan', 'Keep everyone on the same page')`,
    `INSERT OR IGNORE INTO site_settings (key, value) VALUES ('defaultTimezone', 'America/New_York')`,
  ];

  for (const sql of seedStatements) {
    try {
      await client.execute(sql);
      results.push(`✓ Seed: ${sql.substring(45, 90)}...`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push(`- Seed skipped: ${msg}`);
    }
  }

  return NextResponse.json({ success: true, results });
}

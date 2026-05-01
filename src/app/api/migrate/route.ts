import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import { CURRENT_VERSION } from "@/lib/revision-log";
import { MESSAGE_TEMPLATES, AI_TONE_DEFAULTS } from "@/lib/messaging/templates";

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
  // v2.0.0 - Blocked phones
  `CREATE TABLE IF NOT EXISTS sms_blocked_phones (phone TEXT PRIMARY KEY, reason TEXT, blocked_at TEXT NOT NULL DEFAULT (datetime('now')))`,
];

// ALTER TABLE migrations — these use a try/catch per statement since
// SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN.
const alterMigrations = [
  `ALTER TABLE family_members ADD COLUMN home_address TEXT`,
  `ALTER TABLE family_members ADD COLUMN home_place_id TEXT`,
  `ALTER TABLE family_members ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1`,
  // v1.3.0
  `ALTER TABLE family_members ADD COLUMN timezone TEXT`,
  // v1.3.2
  `ALTER TABLE family_members ADD COLUMN home_lat TEXT`,
  `ALTER TABLE family_members ADD COLUMN home_lng TEXT`,
  // v1.4.0
  `ALTER TABLE family_members ADD COLUMN preferred_channel TEXT`,
  // v1.4.1
  `ALTER TABLE sms_log ADD COLUMN channel TEXT`,
  // v2.3.0 - Role-based permissions
  `ALTER TABLE family_members ADD COLUMN can_manage_locations INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE family_members ADD COLUMN can_manage_events INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE family_members ADD COLUMN can_manage_members INTEGER NOT NULL DEFAULT 0`,
];

// Check if migrations are needed (compare stored schema version to app version)
export async function GET() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  if (!url) {
    return NextResponse.json({ needed: true, schemaVersion: null });
  }

  try {
    const client = createClient({ url, authToken });
    const result = await client.execute(
      `SELECT value FROM site_settings WHERE key = 'schemaVersion'`
    );
    const schemaVersion = result.rows[0]?.value as string | undefined;
    return NextResponse.json({
      needed: schemaVersion !== CURRENT_VERSION,
      schemaVersion: schemaVersion || null,
      appVersion: CURRENT_VERSION,
    });
  } catch {
    // Table might not exist yet — migrations definitely needed
    return NextResponse.json({ needed: true, schemaVersion: null, appVersion: CURRENT_VERSION });
  }
}

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
    `INSERT OR IGNORE INTO site_settings (key, value) VALUES ('defaultChannel', 'sms')`,
  ];

  // Seed message templates and AI tone settings
  for (const [key, value] of Object.entries(MESSAGE_TEMPLATES)) {
    seedStatements.push(
      `INSERT OR IGNORE INTO site_settings (key, value) VALUES ('${key}', '${value.replace(/'/g, "''")}')`
    );
  }
  for (const [key, value] of Object.entries(AI_TONE_DEFAULTS)) {
    seedStatements.push(
      `INSERT OR IGNORE INTO site_settings (key, value) VALUES ('${key}', '${value.replace(/'/g, "''")}')`
    );
  }

  for (const sql of seedStatements) {
    try {
      await client.execute(sql);
      results.push(`✓ Seed: ${sql.substring(45, 90)}...`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push(`- Seed skipped: ${msg}`);
    }
  }

  // Update schema version to current app version
  try {
    await client.execute(
      `INSERT OR REPLACE INTO site_settings (key, value) VALUES ('schemaVersion', '${CURRENT_VERSION}')`
    );
    results.push(`✓ Schema version set to ${CURRENT_VERSION}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push(`- Schema version update skipped: ${msg}`);
  }

  return NextResponse.json({ success: true, results });
}

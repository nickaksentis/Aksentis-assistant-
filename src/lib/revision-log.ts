export const CURRENT_VERSION = "1.3.4";

export const REVISION_LOG = [
  {
    version: "1.0.0",
    date: "2026-04-06",
    changes: [
      "Initial release: event creation, calendar view, SMS reminders",
      "AI voice input (speech-to-text)",
      "Admin panel for members and events",
      "Inbound SMS event creation",
      "Privacy policy and terms pages",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-04-06",
    changes: [
      "Dark blue theme redesign",
      "Fix mobile horizontal scroll and input consistency",
      "Remove end date field",
      "Add home address to user profiles",
      "Saved locations database with faster search",
      "Travel time departure reminders (auto-skip if > 3h)",
      "SMS confirmation on event creation",
      "User activation flow (Reply YES to activate)",
      "Block spam and inactive SMS numbers with logging",
      "Admin usage and SMS logs page",
      "Revision log with version tracking",
    ],
  },
  {
    version: "1.1.1",
    date: "2026-04-06",
    changes: [
      "Test SMS button per user in admin members page",
      "Auto-migration API at /api/migrate",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-04-06",
    changes: [
      "Edit event support: admin events page and user events page with pencil icon",
      "Full event editing with change tracking (name, date, location, description, attendees)",
      "Activity log in Usage & Logs page showing creations and edits with diff view",
      "Edit link on activity log entries to jump to event editor",
      "Changed PIN to password (min 6 characters, at least 1 number)",
      "Persistent cookie sessions (30-day login)",
      "Logout button on home page next to admin link",
      "Privacy Policy and Terms links on home page",
    ],
  },
  {
    version: "1.3.0",
    date: "2026-04-06",
    changes: [
      "Remove password hint from login page",
      "Time input restricted to 15-minute intervals (00, 15, 30, 45)",
      "Admin General Settings page: edit site name, slogan, and default timezone",
      "Dynamic site name and slogan on home page and login page",
      "Admin Saved Locations page: add (with Google search), edit, delete locations",
      "Per-user timezone field on member profiles",
      "Timezone-aware event storage: dates converted to UTC on save",
      "Timezone-aware SMS reminders: event times displayed in each recipient's local timezone",
      "Edit event page converts UTC dates back to user's local timezone",
      "Site settings table with seed data via auto-migration",
    ],
  },
  {
    version: "1.3.1",
    date: "2026-04-07",
    changes: [
      "Location search results biased near user's home address",
      "Geocode caching to reduce API calls",
    ],
  },
  {
    version: "1.3.2",
    date: "2026-04-07",
    changes: [
      "Geocode home address at save time and store lat/lng in database",
      "Location search uses stored coordinates for reliable bias",
      "Display geocoded coordinates below home address in admin members page",
      "Remove in-memory geocode cache in favor of persisted data",
    ],
  },
  {
    version: "1.3.3",
    date: "2026-04-07",
    changes: [
      "Migration status indicator: red card when migrations needed, blue when up to date",
      "Schema version tracking in site_settings after each migration run",
      "GET /api/migrate endpoint to check if migrations are needed",
    ],
  },
  {
    version: "1.3.4",
    date: "2026-04-07",
    changes: [
      "Home address field uses Google Places search (same as event location)",
      "Editable lat/lng fields on member profile for manual override",
      "Geocode runs automatically on save when lat/lng not provided",
      "Lat/lng clear when new address selected to trigger fresh geocode",
    ],
  },
];

export const CURRENT_VERSION = "1.2.0";

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
];

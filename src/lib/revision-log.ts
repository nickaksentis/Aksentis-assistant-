export const CURRENT_VERSION = "1.1.0";

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
];

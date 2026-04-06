import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Family Calendar Assistant",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: April 6, 2026
        </p>

        <div className="prose prose-neutral max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-3">Overview</h2>
            <p className="leading-relaxed">
              Family Calendar Assistant (&quot;the Service&quot;) is a private family
              calendar application that sends SMS reminders for scheduled
              events. This privacy policy explains what information we collect,
              how we use it, and how we protect it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              Information We Collect
            </h2>
            <p className="leading-relaxed mb-3">
              We collect only the information necessary to provide calendar and
              reminder functionality. This includes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Name</strong> — to identify family members within the
                calendar
              </li>
              <li>
                <strong>Phone number</strong> — to send SMS event reminders
              </li>
              <li>
                <strong>Event name</strong> — the title of the calendar event
              </li>
              <li>
                <strong>Event date and time</strong> — when the event is
                scheduled
              </li>
              <li>
                <strong>Event location</strong> — where the event takes place
                (optional)
              </li>
              <li>
                <strong>Event description</strong> — additional event details
                (optional)
              </li>
              <li>
                <strong>Event attendees</strong> — which family members are
                attending
              </li>
              <li>
                <strong>Reminder preferences</strong> — when to send reminder
                notifications
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              How We Use Your Information
            </h2>
            <p className="leading-relaxed">
              Your information is used exclusively for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                Displaying calendar events to authorized family members
              </li>
              <li>
                Sending personal SMS reminders about upcoming events to the
                phone numbers provided
              </li>
              <li>
                Processing inbound SMS messages to create calendar events
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              No Third-Party Sharing
            </h2>
            <p className="leading-relaxed">
              We do not sell, trade, rent, or otherwise share your personal
              information with any third-party services for marketing purposes.
              Your data is never used for advertising, analytics, or any
              purpose unrelated to the calendar reminder service described
              above.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              Third-Party Service Providers
            </h2>
            <p className="leading-relaxed">
              We use Twilio solely to deliver SMS reminder messages to your
              phone number. Twilio processes your phone number and message
              content only for the purpose of delivering those messages. No
              data is shared with Twilio for marketing or any other purpose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Data Security</h2>
            <p className="leading-relaxed">
              Your data is stored securely and access is restricted to
              authorized family members through PIN-based authentication. We
              take reasonable measures to protect your information from
              unauthorized access or disclosure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Data Retention</h2>
            <p className="leading-relaxed">
              Event data and associated reminders are retained for as long as
              the event exists in the calendar. Family members may delete
              events at any time. Account information is retained until
              removed by an administrator.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Contact</h2>
            <p className="leading-relaxed">
              If you have questions about this privacy policy, please contact
              us by replying <strong>HELP</strong> to any SMS message received
              from the Service.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

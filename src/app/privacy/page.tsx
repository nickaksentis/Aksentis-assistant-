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
          Last updated: April 21, 2026
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
            <p className="leading-relaxed mt-3">
              <strong>
                Mobile phone numbers will not be shared with third parties
                for promotional or marketing purposes.
              </strong>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              Messaging Frequency &amp; Rates
            </h2>
            <p className="leading-relaxed">
              Message frequency varies based on the number of calendar events
              and reminder preferences configured for your account. You may
              receive event reminders, confirmation messages, and
              conversational replies when interacting with the assistant.
              Typically, you can expect between 1 and 20 messages per month
              depending on calendar activity.
            </p>
            <p className="leading-relaxed mt-3">
              <strong>Message and data rates may apply.</strong> Any charges
              incurred for text messages are your responsibility and are
              determined by your mobile carrier and wireless plan. Contact
              your carrier for pricing details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              Opt-In &amp; Opt-Out
            </h2>
            <p className="leading-relaxed">
              Before receiving messages, users must select SMS as their
              messaging channel and complete the required consent checkboxes,
              as shown below:
            </p>

            <div className="my-4 rounded-xl border border-border bg-[#0f1729] p-4 max-w-md">
              <p className="text-sm font-medium text-blue-400 mb-2">
                Messaging Channel
              </p>
              <div className="flex h-10 w-full items-center rounded-md border border-blue-500 bg-[#1a2332] px-3 text-sm text-white mb-3">
                <span className="flex-1">SMS</span>
                <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex items-start gap-2 text-sm text-white">
                    <div className="mt-0.5 h-4 w-4 shrink-0 rounded border border-muted-foreground" />
                    <span className="leading-snug text-xs">
                      I consent to receive non-marketing text messages from
                      Family Calendar regarding event details. Message frequency
                      varies, message and data rates may apply. Reply HELP for
                      assistance, reply STOP to opt out.
                    </span>
                  </div>
                  <p className="text-xs text-red-400 mt-0.5 ml-6">Required for SMS</p>
                </div>
                <div>
                  <div className="flex items-start gap-2 text-sm text-white">
                    <div className="mt-0.5 h-4 w-4 shrink-0 rounded border border-muted-foreground" />
                    <span className="text-xs">
                      I agree to the Family Calendar{" "}
                      <span className="text-blue-400 underline">Privacy Policy</span>
                    </span>
                  </div>
                  <p className="text-xs text-red-400 mt-0.5 ml-6">Required for SMS</p>
                </div>
                <div>
                  <div className="flex items-start gap-2 text-sm text-white">
                    <div className="mt-0.5 h-4 w-4 shrink-0 rounded border border-muted-foreground" />
                    <span className="text-xs">
                      I agree to the Family Calendar{" "}
                      <span className="text-blue-400 underline">Terms of Service</span>
                    </span>
                  </div>
                  <p className="text-xs text-red-400 mt-0.5 ml-6">Required for SMS</p>
                </div>
              </div>
            </div>

            <p className="leading-relaxed">
              You must then reply <strong>YES</strong> to an activation message
              to opt in and begin receiving messages. You may opt out at any
              time by replying with any of the following keywords:
              {" "}<strong>STOP</strong>, <strong>STOPALL</strong>,
              {" "}<strong>UNSUBSCRIBE</strong>, <strong>CANCEL</strong>,
              {" "}<strong>END</strong>, <strong>QUIT</strong>,
              {" "}<strong>OPTOUT</strong>, or <strong>REVOKE</strong>.
            </p>
            <p className="leading-relaxed mt-3">
              For help, reply <strong>HELP</strong> or <strong>INFO</strong>.
              To resubscribe after opting out, reply <strong>START</strong>.
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
              us by replying <strong>HELP</strong> or <strong>INFO</strong> to
              any SMS message received from the Service, or email us at{" "}
              <strong>support@aksentis.com</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

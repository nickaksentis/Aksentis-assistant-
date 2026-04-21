import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions - Family Calendar Assistant",
};

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Terms and Conditions
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: April 21, 2026
        </p>

        <div className="prose prose-neutral max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-3">Program Name</h2>
            <p className="leading-relaxed">
              Family Calendar Assistant
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Program Description</h2>
            <p className="leading-relaxed">
              Family Calendar Assistant is a private family calendar service
              that allows authorized family members to create and manage
              calendar events and receive SMS text message reminders about
              upcoming events. By opting in to this service, you consent to
              receive automated SMS text messages related to your calendar
              event reminders.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              Message Frequency
            </h2>
            <p className="leading-relaxed">
              Message frequency varies based on the number of events you
              create and the reminder preferences you select. You may receive
              multiple reminders per event depending on your chosen reminder
              schedule (e.g., 1 hour before, 1 day before, 1 week before).
              Typically, you can expect to receive between 1 and 20 messages
              per month, depending on your calendar activity.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              Message and Data Rates
            </h2>
            <p className="leading-relaxed">
              Message and data rates may apply. Any charges incurred for text
              messages are your responsibility and are determined by your
              mobile carrier and your wireless plan. Please contact your
              mobile carrier for pricing details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Opt-Out Instructions</h2>
            <p className="leading-relaxed">
              You can opt out of receiving SMS messages at any time. To stop
              receiving messages, reply <strong>STOP</strong> to any text
              message you receive from Family Calendar Assistant. After
              sending STOP, you will receive a one-time confirmation message
              acknowledging your opt-out request. You will no longer receive
              any further SMS messages from the Service unless you opt back in.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              Support and Help
            </h2>
            <p className="leading-relaxed">
              If you need assistance or have questions about the messaging
              program, reply <strong>HELP</strong> to any text message
              received from Family Calendar Assistant. You will receive a
              response with support information. You may also contact us via
              email at:
            </p>
            <p className="leading-relaxed mt-2">
              <strong>Email:</strong> support@aksentis.com
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Eligibility</h2>
            <p className="leading-relaxed">
              This service is intended for use by authorized family members
              only. You must be the account holder or have the account
              holder&apos;s permission to subscribe a phone number to this
              service. You must be 18 years of age or older, or have parental
              consent, to use this service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              Privacy
            </h2>
            <p className="leading-relaxed">
              Your privacy is important to us. Please review our{" "}
              <a
                href="/privacy"
                className="text-primary underline hover:text-primary/80"
              >
                Privacy Policy
              </a>{" "}
              for details on how we collect, use, and protect your
              information. We do not sell, share, or distribute your personal
              information to third parties for marketing purposes.
              Mobile phone numbers will not be shared with third parties for
              promotional or marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              Carriers Supported
            </h2>
            <p className="leading-relaxed">
              This service is compatible with all major US mobile carriers
              including AT&amp;T, Verizon, T-Mobile, Sprint, and others.
              Carriers are not liable for delayed or undelivered messages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              Changes to Terms
            </h2>
            <p className="leading-relaxed">
              We reserve the right to modify these terms at any time. Any
              changes will be reflected on this page with an updated
              effective date. Continued use of the Service after changes
              constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              Contact Information
            </h2>
            <p className="leading-relaxed">
              For any questions regarding these terms, please contact us:
            </p>
            <ul className="list-none space-y-1 mt-2">
              <li>
                <strong>SMS:</strong> Reply <strong>HELP</strong> to any
                message from the Service
              </li>
              <li>
                <strong>Email:</strong> support@aksentis.com
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

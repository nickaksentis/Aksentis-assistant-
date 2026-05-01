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
              Opt-In / Consent
            </h2>
            <p className="leading-relaxed">
              End users are manually added to the system by a family
              administrator through a private admin panel. Upon being added,
              the member must log in to the portal, select SMS as their
              messaging channel, and complete the required consent checkboxes
              as shown below. The end user then receives an activation text
              message and must reply <strong>YES</strong> to confirm and
              activate their account. Only activated members receive messages.
              No messages are sent to unregistered or unactivated numbers.
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

            <p className="leading-relaxed mt-3">
              <strong>Opt-in keyword:</strong> YES
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
              You can opt out of receiving SMS messages at any time by replying
              with any of the following keywords to any message received from
              Family Calendar Assistant:
            </p>
            <p className="leading-relaxed mt-3">
              <strong>Opt-out keywords:</strong> STOP, STOPALL, UNSUBSCRIBE,
              CANCEL, END, QUIT, OPTOUT, REVOKE
            </p>
            <p className="leading-relaxed mt-3">
              After sending an opt-out keyword, you will receive a one-time
              confirmation message: &quot;You have successfully been unsubscribed.
              You will not receive any more messages from this number. Reply
              START to resubscribe.&quot;
            </p>
            <p className="leading-relaxed mt-3">
              You will no longer receive any further SMS messages from the
              Service unless you opt back in by replying <strong>START</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              Support and Help
            </h2>
            <p className="leading-relaxed">
              If you need assistance or have questions about the messaging
              program, reply with any of the following keywords to any text
              message received from Family Calendar Assistant:
            </p>
            <p className="leading-relaxed mt-3">
              <strong>Help keywords:</strong> HELP, INFO
            </p>
            <p className="leading-relaxed mt-3">
              You will receive a response: &quot;Reply STOP to unsubscribe.
              Msg&amp;Data Rates May Apply.&quot;
            </p>
            <p className="leading-relaxed mt-3">
              You may also contact us via email at:
            </p>
            <p className="leading-relaxed mt-2">
              <strong>Email:</strong> support@aksentis.com
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              Sample Messages
            </h2>
            <p className="leading-relaxed mb-3">
              Below are examples of messages you may receive from Family
              Calendar Assistant:
            </p>
            <ul className="list-disc pl-6 space-y-3">
              <li>
                <strong>Activation:</strong> &quot;Welcome to Aksentis Family
                Calendar! Reply YES to activate your account and start
                receiving event reminders. Message and data rates may apply.
                Enter STOP to unsubscribe.&quot;
              </li>
              <li>
                <strong>Event Reminder:</strong> &quot;Reminder: &apos;Dentist
                Appointment&apos; is tomorrow, Tue Apr 15 at 2:00 PM at Bradenton
                Family Dentistry. Leave by 1:30 PM to arrive on time!&quot;
              </li>
              <li>
                <strong>Event Confirmation:</strong> &quot;Got it! I&apos;ve added
                &apos;Soccer Practice&apos; on Sat Apr 19 at 9:00 AM at Lakewood Ranch
                Park. I&apos;ll send reminders to Nick and Maria.&quot;
              </li>
              <li>
                <strong>Help Response:</strong> &quot;Reply STOP to unsubscribe.
                Msg&amp;Data Rates May Apply.&quot;
              </li>
              <li>
                <strong>Opt-Out Confirmation:</strong> &quot;You have successfully
                been unsubscribed. You will not receive any more messages
                from this number. Reply START to resubscribe.&quot;
              </li>
            </ul>
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

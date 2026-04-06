import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  reminders,
  events,
  familyMembers,
  eventAttendees,
  smsLog,
} from "@/lib/db/schema";
import { eq, lte, and } from "drizzle-orm";
import { generateReminderMessage } from "@/lib/ai/generate-reminder";
import { sendSMS } from "@/lib/sms/twilio";
import { format, parseISO } from "date-fns";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const isLocal = process.env.NODE_ENV === "development";
  if (!isLocal && !authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();

  const dueReminders = await db
    .select()
    .from(reminders)
    .where(
      and(eq(reminders.status, "pending"), lte(reminders.scheduledAt, now))
    );

  if (dueReminders.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  let processed = 0;
  let failed = 0;

  for (const reminder of dueReminders) {
    try {
      const event = await db.query.events.findFirst({
        where: eq(events.id, reminder.eventId),
      });
      if (!event) {
        await db
          .update(reminders)
          .set({ status: "failed" })
          .where(eq(reminders.id, reminder.id));
        continue;
      }

      // Determine recipients
      let recipientIds: number[] = [];
      if (reminder.sendTo === "creator") {
        recipientIds = [event.createdBy];
      } else if (reminder.sendTo === "attendees") {
        const attendees = await db
          .select({ memberId: eventAttendees.memberId })
          .from(eventAttendees)
          .where(eq(eventAttendees.eventId, event.id));
        recipientIds = attendees.map((a) => a.memberId);
        if (recipientIds.length === 0) recipientIds = [event.createdBy];
      } else {
        const allMembers = await db
          .select({ id: familyMembers.id })
          .from(familyMembers);
        recipientIds = allMembers.map((m) => m.id);
      }

      // Get recipient details and filter to active members only
      const recipients = (
        await Promise.all(
          recipientIds.map((id) =>
            db.query.familyMembers.findFirst({
              where: eq(familyMembers.id, id),
            })
          )
        )
      ).filter((r) => r?.isActive);

      for (const recipient of recipients) {
        if (!recipient?.phone) continue;

        const messageBody =
          reminder.messageBody ||
          (await generateReminderMessage({
            recipientName: recipient.name,
            eventName: event.name,
            eventDate: format(
              parseISO(event.date),
              "EEEE, MMMM d 'at' h:mm a"
            ),
            eventLocation: event.location,
          }));

        try {
          const twilioSid = await sendSMS(recipient.phone, messageBody);

          await db.insert(smsLog).values({
            reminderId: reminder.id,
            memberId: recipient.id,
            phone: recipient.phone,
            messageBody,
            twilioSid,
            direction: "outbound",
            status: "sent",
          });
        } catch (smsErr) {
          console.error(`Failed to send SMS to ${recipient.phone}:`, smsErr);
          await db.insert(smsLog).values({
            reminderId: reminder.id,
            memberId: recipient.id,
            phone: recipient.phone,
            messageBody,
            direction: "outbound",
            status: "failed",
          });
        }
      }

      await db
        .update(reminders)
        .set({
          status: "sent",
          sentAt: new Date().toISOString(),
          messageBody:
            reminder.messageBody || "Generated and sent to recipients",
        })
        .where(eq(reminders.id, reminder.id));
      processed++;
    } catch (err) {
      console.error(`Failed to process reminder ${reminder.id}:`, err);
      await db
        .update(reminders)
        .set({ status: "failed" })
        .where(eq(reminders.id, reminder.id));
      failed++;
    }
  }

  return NextResponse.json({ processed, failed, total: dueReminders.length });
}

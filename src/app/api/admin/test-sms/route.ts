import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { familyMembers, smsLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { sendSMS } from "@/lib/sms/twilio";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { memberId } = await req.json();
  if (!memberId) {
    return NextResponse.json({ error: "Member ID required" }, { status: 400 });
  }

  const member = await db.query.familyMembers.findFirst({
    where: eq(familyMembers.id, memberId),
  });

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const testMsg = `Hi ${member.name}! This is a test message from your Family Calendar Assistant. If you received this, SMS is working correctly for your account.`;

  try {
    const sid = await sendSMS(member.phone, testMsg);

    await db.insert(smsLog).values({
      memberId: member.id,
      phone: member.phone,
      messageBody: testMsg,
      twilioSid: sid,
      direction: "outbound",
      status: "sent",
    });

    return NextResponse.json({
      success: true,
      message: `Test SMS sent to ${member.phone}`,
      twilioSid: sid,
    });
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : "Unknown error";

    await db.insert(smsLog).values({
      memberId: member.id,
      phone: member.phone,
      messageBody: `[TEST FAILED] ${testMsg}`,
      direction: "outbound",
      status: "failed",
    });

    return NextResponse.json(
      { error: `SMS failed: ${errorMsg}` },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { familyMembers, smsLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { sendMessage, type Channel } from "@/lib/messaging/send";
import { getTemplate, interpolate } from "@/lib/messaging/templates";

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

  const channel = (member.preferredChannel as Channel) || undefined;
  const channelLabel = channel === "whatsapp" ? "WhatsApp" : "SMS";
  const testTpl = await getTemplate("tpl_test_message");
  const testMsg = interpolate(testTpl, { Name: member.name, Channel: channelLabel });

  try {
    const result = await sendMessage(member.phone, testMsg, channel);

    await db.insert(smsLog).values({
      memberId: member.id,
      phone: member.phone,
      messageBody: testMsg,
      twilioSid: result.sid,
      direction: "outbound",
      status: "sent",
      channel: result.channel,
    });

    return NextResponse.json({
      success: true,
      message: `Test ${result.channel === "whatsapp" ? "WhatsApp" : "SMS"} sent to ${member.phone}`,
      twilioSid: result.sid,
      channel: result.channel,
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
      channel: channel || undefined,
    });

    return NextResponse.json(
      { error: `Message failed: ${errorMsg}` },
      { status: 500 }
    );
  }
}

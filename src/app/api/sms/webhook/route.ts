import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { smsLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Twilio status callback for outbound SMS
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const messageSid = formData.get("MessageSid") as string;
  const messageStatus = formData.get("MessageStatus") as string;

  if (messageSid && messageStatus) {
    await db
      .update(smsLog)
      .set({ status: messageStatus })
      .where(eq(smsLog.twilioSid, messageSid));
  }

  return new NextResponse("OK", { status: 200 });
}

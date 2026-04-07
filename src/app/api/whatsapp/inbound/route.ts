import { NextRequest, NextResponse } from "next/server";
import { handleInboundMessage } from "@/lib/messaging/handle-inbound";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const rawFrom = formData.get("From") as string;
  const body = formData.get("Body") as string;
  const messageSid = formData.get("MessageSid") as string;

  // Strip "whatsapp:" prefix from phone number for member lookup
  const from = rawFrom?.replace(/^whatsapp:/, "") || "";

  if (!from || !body) {
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Invalid message received.</Message></Response>',
      { headers: { "Content-Type": "text/xml" } }
    );
  }

  const twiml = await handleInboundMessage(from, body, messageSid, "whatsapp");
  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}

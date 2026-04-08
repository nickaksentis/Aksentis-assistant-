import twilio from "twilio";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function getClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials not configured");
  }
  return twilio(accountSid, authToken);
}

export type Channel = "sms" | "whatsapp";

export async function getDefaultChannel(): Promise<Channel> {
  try {
    const row = await db.query.siteSettings.findFirst({
      where: eq(siteSettings.key, "defaultChannel"),
    });
    if (row?.value === "whatsapp") return "whatsapp";
  } catch {
    // fallback
  }
  return "sms";
}

export async function sendSMS(to: string, body: string): Promise<string> {
  const client = getClient();
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!from) {
    throw new Error("TWILIO_PHONE_NUMBER not configured");
  }
  const message = await client.messages.create({ to, from, body });
  return message.sid;
}

export async function sendWhatsApp(to: string, body: string): Promise<string> {
  const client = getClient();
  const from = process.env.TWILIO_WHATSAPP_NUMBER;
  if (!from) {
    throw new Error("TWILIO_WHATSAPP_NUMBER not configured");
  }
  const message = await client.messages.create({
    to: `whatsapp:${to}`,
    from: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
    body,
  });
  return message.sid;
}

export async function sendMessage(
  phone: string,
  body: string,
  channel?: Channel | null
): Promise<{ sid: string; channel: Channel }> {
  const resolvedChannel = channel || (await getDefaultChannel());
  if (resolvedChannel === "whatsapp") {
    const sid = await sendWhatsApp(phone, body);
    return { sid, channel: "whatsapp" };
  }
  const sid = await sendSMS(phone, body);
  return { sid, channel: "sms" };
}

export function generateTwimlResponse(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(body)}</Message></Response>`;
}

export function generateEmptyTwimlResponse(): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

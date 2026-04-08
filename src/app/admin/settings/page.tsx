"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern (New York)" },
  { value: "America/Chicago", label: "Central (Chicago)" },
  { value: "America/Denver", label: "Mountain (Denver)" },
  { value: "America/Los_Angeles", label: "Pacific (Los Angeles)" },
  { value: "America/Anchorage", label: "Alaska (Anchorage)" },
  { value: "Pacific/Honolulu", label: "Hawaii (Honolulu)" },
  { value: "America/Phoenix", label: "Arizona (Phoenix, no DST)" },
  { value: "America/Puerto_Rico", label: "Atlantic (Puerto Rico)" },
  { value: "Europe/London", label: "UK (London)" },
  { value: "Europe/Paris", label: "Central Europe (Paris)" },
  { value: "Europe/Berlin", label: "Central Europe (Berlin)" },
  { value: "Asia/Tokyo", label: "Japan (Tokyo)" },
  { value: "Asia/Shanghai", label: "China (Shanghai)" },
  { value: "Asia/Kolkata", label: "India (Kolkata)" },
  { value: "Australia/Sydney", label: "Australia (Sydney)" },
];

// Template metadata for the UI
const TEMPLATE_FIELDS = [
  {
    key: "tpl_event_created",
    label: "Event Created (App)",
    description: "Sent to the creator when they create an event in the app",
    variables: ["EventName", "Date", "Location"],
  },
  {
    key: "tpl_event_created_inbound",
    label: "Event Created (SMS/WhatsApp)",
    description: "Sent back when someone creates an event via text message",
    variables: ["EventName", "Date", "Location", "ReminderTimes"],
  },
  {
    key: "tpl_travel_reminder",
    label: "Travel Departure Reminder",
    description: "Stored on the reminder — sent when it's time to leave for an event",
    variables: ["TravelTime", "Location", "EventName", "Date"],
  },
  {
    key: "tpl_member_activation",
    label: "Member Activation",
    description: "Sent when a new member is added to invite them to activate",
    variables: ["Name"],
  },
  {
    key: "tpl_activation_success",
    label: "Activation Success",
    description: "Sent when a member replies YES to activate their account",
    variables: [],
  },
  {
    key: "tpl_inactive_prompt",
    label: "Inactive Account Prompt",
    description: "Sent when an inactive member tries to use the system",
    variables: [],
  },
  {
    key: "tpl_unregistered",
    label: "Unregistered Number",
    description: "Sent when an unknown phone number texts the system",
    variables: [],
  },
  {
    key: "tpl_parse_failure",
    label: "Could Not Understand",
    description: "Sent when the AI can't parse a message into an event",
    variables: [],
  },
  {
    key: "tpl_error",
    label: "Error Message",
    description: "Sent when something goes wrong processing a message",
    variables: [],
  },
  {
    key: "tpl_test_message",
    label: "Test Message",
    description: "Sent from the admin panel when testing a member's messaging",
    variables: ["Name", "Channel"],
  },
];

const AI_TONE_FIELDS = [
  {
    key: "ai_reminder_prompt",
    label: "Reminder AI Tone",
    description: "Instructions given to the AI when generating reminder messages. Controls tone, length, and style.",
  },
  {
    key: "ai_parse_prompt",
    label: "Event Parser AI Identity",
    description: "The identity/role description given to the AI when parsing inbound messages into events.",
  },
  {
    key: "ai_conversation_prompt",
    label: "Conversational AI Prompt",
    description: "The full system prompt for the conversational SMS/WhatsApp assistant. Controls personality, capabilities, and response format.",
  },
];

const VARIABLE_CHEATSHEET = [
  { code: "[Name]", description: "Recipient's name (e.g. Nick)" },
  { code: "[EventName]", description: "Event title (e.g. Soccer Practice)" },
  { code: "[Date]", description: "Formatted event date and time (e.g. Tue Apr 8 at 4:00 PM)" },
  { code: "[Location]", description: "Event location or venue name" },
  { code: "[Channel]", description: "Messaging channel — SMS or WhatsApp" },
  { code: "[TravelTime]", description: "Estimated travel duration (e.g. 25 mins)" },
  { code: "[ReminderTimes]", description: "Reminder preset labels (e.g. 1d, 1h before)" },
];

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // General settings
  const [form, setForm] = useState<Record<string, string>>({
    siteName: "Family Calendar",
    siteSlogan: "Keep everyone on the same page",
    defaultTimezone: "America/New_York",
    defaultChannel: "sms",
  });

  // Collapsible sections
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAiTone, setShowAiTone] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        setForm((prev) => ({ ...prev, ...data }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);

    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to save");
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-lg flex items-center gap-3 px-4 py-3">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">General Settings</h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* General Settings */}
            <div className="rounded-xl border bg-card p-5 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="siteName">Website Name</Label>
                <Input
                  id="siteName"
                  value={form.siteName || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, siteName: e.target.value }))
                  }
                  placeholder="Family Calendar"
                />
                <p className="text-xs text-muted-foreground">
                  Displayed on the home page and login screen
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteSlogan">Slogan</Label>
                <Input
                  id="siteSlogan"
                  value={form.siteSlogan || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, siteSlogan: e.target.value }))
                  }
                  placeholder="Keep everyone on the same page"
                />
                <p className="text-xs text-muted-foreground">
                  Subtitle shown below the website name
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultTimezone">Default Time Zone</Label>
                <select
                  id="defaultTimezone"
                  value={form.defaultTimezone || "America/New_York"}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      defaultTimezone: e.target.value,
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Default timezone for new members
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultChannel">Default Messaging Channel</Label>
                <select
                  id="defaultChannel"
                  value={form.defaultChannel || "sms"}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      defaultChannel: e.target.value,
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="sms">SMS (Twilio)</option>
                  <option value="whatsapp">WhatsApp (Twilio)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Used when a member has no channel preference set
                </p>
              </div>
            </div>

            {/* Message Templates */}
            <div className="rounded-xl border bg-card overflow-hidden">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <div>
                  <h2 className="text-sm font-semibold">Message Templates</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Customize outgoing message text
                  </p>
                </div>
                {showTemplates ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {showTemplates && (
                <div className="border-t px-5 pb-5 space-y-5">
                  {TEMPLATE_FIELDS.map((tpl) => (
                    <div key={tpl.key} className="space-y-1.5 pt-4 first:pt-2">
                      <Label htmlFor={tpl.key} className="text-sm">
                        {tpl.label}
                      </Label>
                      <Textarea
                        id={tpl.key}
                        value={form[tpl.key] || ""}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, [tpl.key]: e.target.value }))
                        }
                        rows={2}
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        {tpl.description}
                      </p>
                      {tpl.variables.length > 0 && (
                        <p className="text-xs text-blue-400">
                          Variables: {tpl.variables.map((v) => `[${v}]`).join(" ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Tone Settings */}
            <div className="rounded-xl border bg-card overflow-hidden">
              <button
                onClick={() => setShowAiTone(!showAiTone)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <div>
                  <h2 className="text-sm font-semibold">AI Tone & Personality</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Control how the AI writes messages
                  </p>
                </div>
                {showAiTone ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {showAiTone && (
                <div className="border-t px-5 pb-5 space-y-5">
                  {AI_TONE_FIELDS.map((field) => (
                    <div key={field.key} className="space-y-1.5 pt-4 first:pt-2">
                      <Label htmlFor={field.key} className="text-sm">
                        {field.label}
                      </Label>
                      <Textarea
                        id={field.key}
                        value={form[field.key] || ""}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, [field.key]: e.target.value }))
                        }
                        rows={3}
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        {field.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Variable Cheat Sheet */}
            <div className="rounded-xl border bg-card overflow-hidden">
              <button
                onClick={() => setShowCheatSheet(!showCheatSheet)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <div>
                  <h2 className="text-sm font-semibold">Variable Cheat Sheet</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Codes you can use in message templates
                  </p>
                </div>
                {showCheatSheet ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {showCheatSheet && (
                <div className="border-t">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground">
                          Code
                        </th>
                        <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {VARIABLE_CHEATSHEET.map((item) => (
                        <tr key={item.code} className="border-b last:border-b-0">
                          <td className="px-5 py-2.5">
                            <code className="text-xs bg-accent px-1.5 py-0.5 rounded font-mono text-blue-400">
                              {item.code}
                            </code>
                          </td>
                          <td className="px-5 py-2.5 text-xs text-muted-foreground">
                            {item.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button
              onClick={handleSave}
              className="w-full"
              size="lg"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Saved!
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LocationSearch } from "@/components/location-search";
import { FamilyMemberSelect } from "@/components/family-member-select";
import { TimeSelect } from "@/components/time-select";
import { REMINDER_PRESETS } from "@/types";
import { ArrowLeft, Loader2 } from "lucide-react";

interface EventData {
  id: number;
  name: string;
  date: string;
  location?: string | null;
  placeId?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  description?: string | null;
  createdBy: number;
  attendees?: { member: { id: number; name: string } }[];
  reminders?: { scheduledAt: string; sendTo: string; status: string }[];
}

export default function EditEventPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <EditEventContent />
    </Suspense>
  );
}

function snapTo15Min(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const snapped = Math.round(m / 15) * 15;
  const finalM = snapped === 60 ? 0 : snapped;
  const finalH = snapped === 60 ? (h + 1) % 24 : h;
  return `${finalH.toString().padStart(2, "0")}:${finalM.toString().padStart(2, "0")}`;
}

function EditEventContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("id");
  const returnTo = searchParams.get("from") || "/events";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    date: "",
    location: "",
    placeId: "",
    latitude: "",
    longitude: "",
    description: "",
    attendees: [] as number[],
    reminderPresets: [] as string[],
    reminderRecipients: "creator",
  });

  const [datePart, setDatePart] = useState("");
  const [timePart, setTimePart] = useState("");

  function updateDateTime(newDate: string, newTime: string) {
    setDatePart(newDate);
    setTimePart(newTime);
    const combined = newDate && newTime ? `${newDate}T${newTime}` : "";
    setForm((prev) => ({ ...prev, date: combined }));
  }

  useEffect(() => {
    if (!eventId) {
      setError("No event ID");
      setLoading(false);
      return;
    }

    // Fetch event and user's timezone in parallel
    Promise.all([
      fetch(`/api/events?id=${eventId}`).then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()).catch(() => ({})),
    ])
      .then(([eventData, meData, settings]) => {
        const data = eventData as EventData | EventData[];
        const event = Array.isArray(data)
          ? data.find((e) => e.id === Number(eventId))
          : data;
        if (!event) {
          setError("Event not found");
          setLoading(false);
          return;
        }

        // Convert UTC date to user's local timezone
        const userTz =
          meData?.timezone ||
          settings?.defaultTimezone ||
          "America/New_York";
        let dateLocal = event.date;
        try {
          // Use Intl to convert UTC to user's local time
          const utcDate = new Date(dateLocal);
          if (!isNaN(utcDate.getTime())) {
            const fmt = new Intl.DateTimeFormat("en-CA", {
              timeZone: userTz,
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
            const parts = fmt.formatToParts(utcDate);
            const get = (t: string) =>
              parts.find((p) => p.type === t)?.value || "";
            dateLocal = `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
          }
        } catch {
          if (dateLocal && dateLocal.includes("T")) {
            dateLocal = dateLocal.substring(0, 16);
          }
        }

        const dp = dateLocal ? dateLocal.substring(0, 10) : "";
        const tp = dateLocal ? dateLocal.substring(11, 16) : "";
        const snappedTime = tp ? snapTo15Min(tp) : "";
        setDatePart(dp);
        setTimePart(snappedTime);

        setForm({
          name: event.name,
          date: dp && snappedTime ? `${dp}T${snappedTime}` : dateLocal,
          location: event.location || "",
          placeId: event.placeId || "",
          latitude: event.latitude || "",
          longitude: event.longitude || "",
          description: event.description || "",
          attendees: event.attendees?.map((a) => a.member.id) || [],
          reminderPresets: [],
          reminderRecipients: event.reminders?.[0]?.sendTo || "creator",
        });
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load event");
        setLoading(false);
      });
  }, [eventId]);

  function updateField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleReminder(preset: string) {
    setForm((prev) => ({
      ...prev,
      reminderPresets: prev.reminderPresets.includes(preset)
        ? prev.reminderPresets.filter((p) => p !== preset)
        : [...prev.reminderPresets, preset],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.date) {
      setError("Event name and date are required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Number(eventId), ...form }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update event");
      }

      setSuccess(true);
      setTimeout(() => router.push(returnTo), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center py-12">
          <div className="text-4xl mb-3">&#10003;</div>
          <h2 className="text-xl font-semibold">Event Updated!</h2>
          <p className="text-muted-foreground mt-1">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-lg flex items-center gap-3 px-4 py-3">
          <Link href={returnTo}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Edit Event</h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Event Name *</Label>
            <Input
              id="name"
              placeholder="e.g. Soccer Practice"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Date & Time *</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                value={datePart}
                onChange={(e) => updateDateTime(e.target.value, timePart)}
              />
              <TimeSelect
                value={timePart}
                onChange={(val) => updateDateTime(datePart, val)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <LocationSearch
              value={form.location}
              onChange={(data) =>
                setForm((prev) => ({
                  ...prev,
                  location: data.location,
                  placeId: data.placeId,
                  latitude: data.latitude || "",
                  longitude: data.longitude || "",
                }))
              }
              onClear={() =>
                setForm((prev) => ({
                  ...prev,
                  location: "",
                  placeId: "",
                  latitude: "",
                  longitude: "",
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional details about the event..."
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Attendees</Label>
            <FamilyMemberSelect
              selected={form.attendees}
              onChange={(ids) => updateField("attendees", ids)}
            />
          </div>

          <div className="space-y-3">
            <Label>Update Reminders</Label>
            <p className="text-xs text-muted-foreground">
              Select new reminder times (replaces existing reminders)
            </p>
            <div className="flex flex-wrap gap-2">
              {REMINDER_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => toggleReminder(preset.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors border ${
                    form.reminderPresets.includes(preset.value)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-input hover:bg-accent"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Send Reminders To</Label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: "creator", label: "Just me" },
                  { value: "attendees", label: "Attendees" },
                  { value: "all", label: "Whole family" },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateField("reminderRecipients", option.value)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors border ${
                    form.reminderRecipients === option.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-input hover:bg-accent"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

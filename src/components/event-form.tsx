"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LocationSearch } from "@/components/location-search";
import { FamilyMemberSelect } from "@/components/family-member-select";
import { REMINDER_PRESETS } from "@/types";
import { TimeSelect } from "@/components/time-select";
import { Loader2 } from "lucide-react";

interface EventFormData {
  name: string;
  date: string;
  location: string;
  placeId: string;
  latitude: string;
  longitude: string;
  description: string;
  attendees: number[];
  reminderPresets: string[];
  reminderRecipients: string;
}

interface EventFormProps {
  initialData?: Partial<EventFormData>;
}

export function EventForm({ initialData }: EventFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Split initial date into date and time parts
  const initDate = initialData?.date || "";
  const initDatePart = initDate ? initDate.substring(0, 10) : "";
  const initTimePart = initDate ? initDate.substring(11, 16) : "";
  const [datePart, setDatePart] = useState(initDatePart);
  const [timePart, setTimePart] = useState(initTimePart);

  function updateDateTime(newDate: string, newTime: string) {
    setDatePart(newDate);
    setTimePart(newTime);
    if (newDate && newTime) {
      updateField("date", `${newDate}T${newTime}`);
    } else {
      updateField("date", "");
    }
  }

  const [form, setForm] = useState<EventFormData>({
    name: initialData?.name || "",
    date: initDate,
    location: initialData?.location || "",
    placeId: initialData?.placeId || "",
    latitude: initialData?.latitude || "",
    longitude: initialData?.longitude || "",
    description: initialData?.description || "",
    attendees: initialData?.attendees || [],
    reminderPresets: initialData?.reminderPresets || ["1d"],
    reminderRecipients: initialData?.reminderRecipients || "creator",
  });

  function updateField<K extends keyof EventFormData>(
    key: K,
    value: EventFormData[K]
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

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create event");
      }

      setSuccess(true);
      setTimeout(() => router.push("/events"), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">✓</div>
        <h2 className="text-xl font-semibold">Event Created!</h2>
        <p className="text-muted-foreground mt-1">Redirecting to events...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Event Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Event Name *</Label>
        <Input
          id="name"
          placeholder="e.g. Soccer Practice"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
        />
      </div>

      {/* Date & Time */}
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

      {/* Location */}
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

      {/* Description */}
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

      {/* Attendees */}
      <div className="space-y-2">
        <Label>Attendees</Label>
        <FamilyMemberSelect
          selected={form.attendees}
          onChange={(ids) => updateField("attendees", ids)}
        />
      </div>

      {/* Reminder Presets */}
      <div className="space-y-3">
        <Label>Reminders</Label>
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

      {/* Reminder Recipients */}
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

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {/* Submit */}
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Event...
          </>
        ) : (
          "Create Event"
        )}
      </Button>
    </form>
  );
}

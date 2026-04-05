"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { EventForm } from "@/components/event-form";
import { SpeechToEvent } from "@/components/speech-to-event";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ParsedEvent {
  name: string;
  date: string | null;
  endDate: string | null;
  location: string | null;
  description: string | null;
  attendees: string[];
  reminderPresets: string[];
}

export default function AddEventPage() {
  const [prefill, setPrefill] = useState<Partial<{
    name: string;
    date: string;
    endDate: string;
    location: string;
    description: string;
    reminderPresets: string[];
  }> | null>(null);

  const [members, setMembers] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/members")
      .then((res) => res.json())
      .then(setMembers)
      .catch(() => {});
  }, []);

  function handleParsed(data: ParsedEvent) {
    // Match attendee names to member IDs
    const attendeeIds = data.attendees
      ?.map((name) => {
        const member = members.find(
          (m) => m.name.toLowerCase() === name.toLowerCase()
        );
        return member?.id;
      })
      .filter(Boolean) as number[];

    setPrefill({
      name: data.name || "",
      date: data.date || "",
      endDate: data.endDate || "",
      location: data.location || "",
      description: data.description || "",
      reminderPresets: data.reminderPresets || ["1d"],
    });

    // We'll pass attendees through the prefill too
    if (attendeeIds.length > 0) {
      setPrefill((prev) => prev ? { ...prev, attendees: attendeeIds } as typeof prev : prev);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-lg flex items-center gap-3 px-4 py-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Add Event</h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-6">
        {/* AI Voice Input */}
        <div className="mb-6">
          <SpeechToEvent onParsed={handleParsed} />
        </div>

        {/* Manual Event Form */}
        <EventForm key={JSON.stringify(prefill)} initialData={prefill || undefined} />
      </div>
    </div>
  );
}

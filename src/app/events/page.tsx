"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CalendarView } from "@/components/calendar-view";
import { EventList } from "@/components/event-list";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";

interface EventData {
  id: number;
  name: string;
  date: string;
  endDate?: string | null;
  location?: string | null;
  description?: string | null;
  createdBy: number;
  attendees?: { member: { id: number; name: string } }[];
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | undefined>();

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.memberId) setCurrentUserId(data.memberId);
      })
      .catch(() => {});
  }, []);

  const eventDates = events.map((e) => e.date);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-lg flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">Events</h1>
          </div>
          <Link href="/add-event">
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-lg w-full flex-1 flex flex-col">
        <div className="px-4 py-4 border-b">
          <CalendarView
            eventDates={eventDates}
            selectedDate={selectedDate}
            onSelectDate={(date) =>
              setSelectedDate(
                selectedDate && date.getTime() === selectedDate.getTime()
                  ? null
                  : date
              )
            }
          />
          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="mt-2 text-xs text-primary hover:underline"
            >
              Clear filter — show all events
            </button>
          )}
        </div>

        <div className="flex-1 px-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <EventList
              events={events}
              selectedDate={selectedDate}
              currentUserId={currentUserId}
            />
          )}
        </div>
      </div>
    </div>
  );
}

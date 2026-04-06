"use client";

import { useMemo } from "react";
import { format, parseISO, isSameDay } from "date-fns";
import { EventCard } from "@/components/event-card";

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

interface EventListProps {
  events: EventData[];
  selectedDate: Date | null;
  currentUserId?: number;
}

export function EventList({ events, selectedDate, currentUserId }: EventListProps) {
  const filteredEvents = useMemo(() => {
    if (!selectedDate) return events;
    return events.filter((e) => isSameDay(parseISO(e.date), selectedDate));
  }, [events, selectedDate]);

  const groupedEvents = useMemo(() => {
    const groups: Record<string, EventData[]> = {};
    filteredEvents.forEach((event) => {
      const key = format(parseISO(event.date), "yyyy-MM-dd");
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredEvents]);

  if (filteredEvents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {selectedDate
          ? `No events on ${format(selectedDate, "MMMM d, yyyy")}`
          : "No events yet. Add your first event!"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedEvents.map(([dateKey, dayEvents]) => (
        <div key={dateKey}>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">
            {format(parseISO(dateKey), "EEEE, MMMM d")}
          </h3>
          <div className="space-y-2">
            {dayEvents
              .sort(
                (a, b) =>
                  new Date(a.date).getTime() - new Date(b.date).getTime()
              )
              .map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  currentUserId={currentUserId}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

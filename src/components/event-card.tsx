"use client";

import { format, parseISO } from "date-fns";
import { MapPin, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface EventCardProps {
  event: {
    id: number;
    name: string;
    date: string;
    location?: string | null;
    description?: string | null;
    createdBy: number;
    attendees?: { member: { id: number; name: string } }[];
  };
}

export function EventCard({ event }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);
  const eventDate = parseISO(event.date);

  return (
    <button
      type="button"
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.99] overflow-hidden"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate">{event.name}</h3>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {format(eventDate, "EEE, MMM d 'at' h:mm a")}
            </span>
          </div>
          {event.location && (
            <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>
        <div className="ml-2 shrink-0 text-muted-foreground">
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t space-y-2">
          {event.description && (
            <p className="text-sm text-muted-foreground">
              {event.description}
            </p>
          )}
          {event.attendees && event.attendees.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {event.attendees.map((a) => (
                <span
                  key={a.member.id}
                  className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium"
                >
                  {a.member.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </button>
  );
}

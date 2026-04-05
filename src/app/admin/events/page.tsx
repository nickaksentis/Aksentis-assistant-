"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Trash2, Search, Bell, BellOff } from "lucide-react";
import { format, parseISO } from "date-fns";

interface EventData {
  id: number;
  name: string;
  date: string;
  endDate?: string | null;
  location?: string | null;
  description?: string | null;
  creator?: { name: string } | null;
  attendees?: { member: { name: string } }[];
  reminders?: { id: number; status: string; scheduledAt: string }[];
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadEvents() {
    const res = await fetch("/api/admin/events");
    if (res.ok) {
      setEvents(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Delete this event?")) return;
    await fetch("/api/events", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadEvents();
  }

  const filtered = events.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.location?.toLowerCase().includes(search.toLowerCase()) ||
      e.creator?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-2xl flex items-center gap-3 px-4 py-3">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">All Events</h1>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {search ? "No matching events." : "No events yet."}
          </p>
        ) : (
          filtered.map((event) => {
            const pendingReminders =
              event.reminders?.filter((r) => r.status === "pending").length ||
              0;
            const sentReminders =
              event.reminders?.filter((r) => r.status === "sent").length || 0;

            return (
              <div
                key={event.id}
                className="rounded-xl border bg-card p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{event.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(event.date), "EEE, MMM d 'at' h:mm a")}
                    </p>
                    {event.location && (
                      <p className="text-sm text-muted-foreground truncate">
                        {event.location}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(event.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>by {event.creator?.name || "Unknown"}</span>
                  {event.attendees && event.attendees.length > 0 && (
                    <span>
                      {event.attendees.map((a) => a.member.name).join(", ")}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    {pendingReminders > 0 ? (
                      <>
                        <Bell className="h-3 w-3" />
                        {pendingReminders} pending
                      </>
                    ) : sentReminders > 0 ? (
                      <>
                        <BellOff className="h-3 w-3" />
                        {sentReminders} sent
                      </>
                    ) : null}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

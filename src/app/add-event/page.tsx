"use client";

import Link from "next/link";
import { EventForm } from "@/components/event-form";
import { ArrowLeft, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AddEventPage() {
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
        {/* AI Voice Button - placeholder for Phase 4 */}
        <Button
          variant="outline"
          className="w-full mb-6 py-6 text-base gap-2 border-dashed border-2"
          disabled
        >
          <Mic className="h-5 w-5" />
          Add via AI (coming soon)
        </Button>

        {/* Manual Event Form */}
        <EventForm />
      </div>
    </div>
  );
}

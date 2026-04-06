"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Calendar, BarChart3, FileText } from "lucide-react";
import { CURRENT_VERSION } from "@/lib/revision-log";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-lg flex items-center gap-3 px-4 py-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold">Admin</h1>
            <p className="text-xs text-muted-foreground">v{CURRENT_VERSION}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
        <Link href="/admin/members" className="block">
          <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Manage Members</h2>
              <p className="text-sm text-muted-foreground">
                Add, edit, or remove family members
              </p>
            </div>
          </div>
        </Link>

        <Link href="/admin/events" className="block">
          <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Manage Events</h2>
              <p className="text-sm text-muted-foreground">
                View, edit, or delete all events
              </p>
            </div>
          </div>
        </Link>

        <Link href="/admin/usage" className="block">
          <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Usage & Logs</h2>
              <p className="text-sm text-muted-foreground">
                SMS log, delivery status, spam tracking
              </p>
            </div>
          </div>
        </Link>

        <Link href="/admin/revisions" className="block">
          <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Revision Log</h2>
              <p className="text-sm text-muted-foreground">
                Version history and changelog
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

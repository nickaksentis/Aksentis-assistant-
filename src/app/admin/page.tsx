"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Users,
  Calendar,
  BarChart3,
  FileText,
  Database,
  Loader2,
  CheckCircle,
  XCircle,
  Settings,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { CURRENT_VERSION } from "@/lib/revision-log";

export default function AdminPage() {
  const [migrating, setMigrating] = useState(false);
  const [migrationsNeeded, setMigrationsNeeded] = useState(false);
  const [migrateResult, setMigrateResult] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/migrate")
      .then((res) => res.json())
      .then((data) => setMigrationsNeeded(data.needed === true))
      .catch(() => setMigrationsNeeded(true));
  }, []);

  async function runMigrations() {
    setMigrating(true);
    setMigrateResult(null);
    try {
      const res = await fetch("/api/migrate", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMigrateResult({
          ok: true,
          msg: `Done — ${data.results?.length || 0} migrations checked.`,
        });
        setMigrationsNeeded(false);
      } else {
        setMigrateResult({ ok: false, msg: data.error || "Migration failed" });
      }
    } catch {
      setMigrateResult({ ok: false, msg: "Network error" });
    }
    setMigrating(false);
  }

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
        <Link href="/admin/settings" className="block">
          <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">General Settings</h2>
              <p className="text-sm text-muted-foreground">
                Site name, slogan, default timezone
              </p>
            </div>
          </div>
        </Link>

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

        <Link href="/admin/locations" className="block">
          <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Saved Locations</h2>
              <p className="text-sm text-muted-foreground">
                Manage saved places and addresses
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
                SMS log, activity log, delivery status
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

        {/* Run Migrations */}
        <button
          onClick={runMigrations}
          disabled={migrating}
          className={`w-full flex items-center gap-4 rounded-xl border p-5 shadow-sm hover:shadow-md transition-all text-left ${
            migrationsNeeded
              ? "bg-red-500/10 border-red-500/30"
              : "bg-card"
          }`}
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              migrationsNeeded ? "bg-red-500/15" : "bg-primary/10"
            }`}
          >
            {migrating ? (
              <Loader2 className={`h-5 w-5 animate-spin ${migrationsNeeded ? "text-red-400" : "text-primary"}`} />
            ) : migrationsNeeded ? (
              <AlertCircle className="h-5 w-5 text-red-400" />
            ) : (
              <Database className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold">
              {migrationsNeeded ? "Migrations Needed" : "Run Migrations"}
            </h2>
            <p className={`text-sm ${migrationsNeeded ? "text-red-400/80" : "text-muted-foreground"}`}>
              {migrationsNeeded
                ? "Database update required for v" + CURRENT_VERSION
                : "Database is up to date"}
            </p>
            {migrateResult && (
              <div
                className={`mt-1 flex items-center gap-1.5 text-xs ${migrateResult.ok ? "text-green-400" : "text-red-400"}`}
              >
                {migrateResult.ok ? (
                  <CheckCircle className="h-3.5 w-3.5" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                {migrateResult.msg}
              </div>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}

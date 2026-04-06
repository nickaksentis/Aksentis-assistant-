"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";

const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern (New York)" },
  { value: "America/Chicago", label: "Central (Chicago)" },
  { value: "America/Denver", label: "Mountain (Denver)" },
  { value: "America/Los_Angeles", label: "Pacific (Los Angeles)" },
  { value: "America/Anchorage", label: "Alaska (Anchorage)" },
  { value: "Pacific/Honolulu", label: "Hawaii (Honolulu)" },
  { value: "America/Phoenix", label: "Arizona (Phoenix, no DST)" },
  { value: "America/Puerto_Rico", label: "Atlantic (Puerto Rico)" },
  { value: "Europe/London", label: "UK (London)" },
  { value: "Europe/Paris", label: "Central Europe (Paris)" },
  { value: "Europe/Berlin", label: "Central Europe (Berlin)" },
  { value: "Asia/Tokyo", label: "Japan (Tokyo)" },
  { value: "Asia/Shanghai", label: "China (Shanghai)" },
  { value: "Asia/Kolkata", label: "India (Kolkata)" },
  { value: "Australia/Sydney", label: "Australia (Sydney)" },
];

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    siteName: "Family Calendar",
    siteSlogan: "Keep everyone on the same page",
    defaultTimezone: "America/New_York",
  });

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        setForm({
          siteName: data.siteName || "Family Calendar",
          siteSlogan: data.siteSlogan || "Keep everyone on the same page",
          defaultTimezone: data.defaultTimezone || "America/New_York",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);

    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to save");
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-lg flex items-center gap-3 px-4 py-3">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">General Settings</h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="rounded-xl border bg-card p-5 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="siteName">Website Name</Label>
                <Input
                  id="siteName"
                  value={form.siteName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, siteName: e.target.value }))
                  }
                  placeholder="Family Calendar"
                />
                <p className="text-xs text-muted-foreground">
                  Displayed on the home page and login screen
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteSlogan">Slogan</Label>
                <Input
                  id="siteSlogan"
                  value={form.siteSlogan}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, siteSlogan: e.target.value }))
                  }
                  placeholder="Keep everyone on the same page"
                />
                <p className="text-xs text-muted-foreground">
                  Subtitle shown below the website name
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultTimezone">Default Time Zone</Label>
                <select
                  id="defaultTimezone"
                  value={form.defaultTimezone}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      defaultTimezone: e.target.value,
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Default timezone for new members
                </p>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button
              onClick={handleSave}
              className="w-full"
              size="lg"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Saved!
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

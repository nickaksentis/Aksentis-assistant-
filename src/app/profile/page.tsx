"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check, Loader2, MapPin } from "lucide-react";
import { LocationSearch } from "@/components/location-search";

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

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [defaultChannel, setDefaultChannel] = useState("sms");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    pin: "",
    homeAddress: "",
    homePlaceId: "",
    homeLat: "",
    homeLng: "",
    timezone: "America/New_York",
    preferredChannel: "",
    consentMessages: false,
    consentPrivacy: false,
    consentTerms: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeResult, setGeocodeResult] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([profile, settings]) => {
      if (settings.defaultChannel) setDefaultChannel(settings.defaultChannel);
      const channel = profile.preferredChannel || "";
      const isSms = (channel || settings.defaultChannel || "sms") === "sms";
      setForm({
        name: profile.name || "",
        phone: profile.phone || "",
        pin: "",
        homeAddress: profile.homeAddress || "",
        homePlaceId: "",
        homeLat: profile.homeLat || "",
        homeLng: profile.homeLng || "",
        timezone: profile.timezone || settings.defaultTimezone || "America/New_York",
        preferredChannel: channel,
        consentMessages: isSms,
        consentPrivacy: isSms,
        consentTerms: isSms,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function isSmsEffective() {
    return (form.preferredChannel || defaultChannel) === "sms";
  }

  async function testGeocode() {
    if (!form.homeAddress.trim()) return;
    setGeocoding(true);
    setGeocodeResult(null);
    try {
      const res = await fetch("/api/admin/geocode-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: form.homeAddress }),
      });
      const data = await res.json();
      if (data.status === "OK" && data.lat && data.lng) {
        setForm((f) => ({ ...f, homeLat: data.lat, homeLng: data.lng }));
        setGeocodeResult({ msg: `Found: ${data.formattedAddress || `${data.lat}, ${data.lng}`}`, ok: true });
      } else {
        setGeocodeResult({ msg: `${data.status}: ${data.error || "No results"}`, ok: false });
      }
    } catch {
      setGeocodeResult({ msg: "Network error", ok: false });
    }
    setGeocoding(false);
  }

  async function handleSave() {
    setError("");
    setSuccess("");
    if (isSmsEffective()) {
      if (!form.consentMessages) { setError("You must consent to receiving text messages to use SMS."); return; }
      if (!form.consentPrivacy) { setError("You must agree to the Privacy Policy to use SMS."); return; }
      if (!form.consentTerms) { setError("You must agree to the Terms of Service to use SMS."); return; }
    }
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess("Profile updated successfully.");
      setForm((f) => ({ ...f, pin: "" }));
    } else {
      setError(data.error || "Failed to update profile");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
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
          <h1 className="text-lg font-semibold">My Profile</h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          {success && <p className="text-sm text-green-400 text-center">{success}</p>}

          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label>Phone (E.164)</Label>
            <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+10000000000" />
          </div>

          <div className="space-y-2">
            <Label>New Password (leave blank to keep)</Label>
            <Input type="password" value={form.pin} onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))} placeholder="Min 6 chars, 1 number" />
            <p className="text-xs text-muted-foreground">At least 6 characters with 1 number</p>
          </div>

          <div className="space-y-2">
            <Label>Home Address</Label>
            <LocationSearch
              value={form.homeAddress}
              onChange={(data) =>
                setForm((f) => ({ ...f, homeAddress: data.location, homePlaceId: data.placeId || "", homeLat: "", homeLng: "" }))
              }
              onClear={() =>
                setForm((f) => ({ ...f, homeAddress: "", homePlaceId: "", homeLat: "", homeLng: "" }))
              }
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Coordinates</Label>
              <Button type="button" size="sm" variant="outline" className="h-7 gap-1 text-xs" disabled={geocoding || !form.homeAddress.trim()} onClick={testGeocode}>
                {geocoding ? <Loader2 className="h-3 w-3 animate-spin" /> : <MapPin className="h-3 w-3" />}
                Geocode
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input value={form.homeLat} onChange={(e) => setForm((f) => ({ ...f, homeLat: e.target.value }))} placeholder="Latitude" className="text-xs" />
              <Input value={form.homeLng} onChange={(e) => setForm((f) => ({ ...f, homeLng: e.target.value }))} placeholder="Longitude" className="text-xs" />
            </div>
            {geocodeResult && (
              <p className={`text-xs ${geocodeResult.ok ? "text-green-400" : "text-red-400"}`}>{geocodeResult.msg}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Time Zone</Label>
            <select
              value={form.timezone}
              onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Messaging Channel</Label>
            <select
              value={form.preferredChannel}
              onChange={(e) => setForm((f) => ({ ...f, preferredChannel: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Use Default ({defaultChannel === "whatsapp" ? "WhatsApp" : "SMS"})</option>
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
            </select>

            <div className="mt-3 space-y-2">
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={form.consentMessages} onChange={(e) => setForm((f) => ({ ...f, consentMessages: e.target.checked }))} className="mt-0.5" />
                <span className="leading-snug">
                  I consent to receive non-marketing text messages from Family Calendar regarding event details. Message frequency varies, message and data rates may apply. Reply HELP for assistance, reply STOP to opt out.
                </span>
              </label>
              {isSmsEffective() && !form.consentMessages && (
                <p className="text-xs text-destructive ml-5">Required for SMS</p>
              )}

              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={form.consentPrivacy} onChange={(e) => setForm((f) => ({ ...f, consentPrivacy: e.target.checked }))} className="mt-0.5" />
                <span>
                  I agree to the Family Calendar{" "}
                  <a href="/privacy" target="_blank" className="text-primary underline hover:text-primary/80">Privacy Policy</a>
                </span>
              </label>
              {isSmsEffective() && !form.consentPrivacy && (
                <p className="text-xs text-destructive ml-5">Required for SMS</p>
              )}

              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={form.consentTerms} onChange={(e) => setForm((f) => ({ ...f, consentTerms: e.target.checked }))} className="mt-0.5" />
                <span>
                  I agree to the Family Calendar{" "}
                  <a href="/terms" target="_blank" className="text-primary underline hover:text-primary/80">Terms of Service</a>
                </span>
              </label>
              {isSmsEffective() && !form.consentTerms && (
                <p className="text-xs text-destructive ml-5">Required for SMS</p>
              )}
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full gap-1">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save Profile
          </Button>
        </div>
      </div>
    </div>
  );
}

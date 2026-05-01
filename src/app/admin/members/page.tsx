"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Pencil, Trash2, X, Check, Send, Loader2, MapPin } from "lucide-react";
import { LocationSearch } from "@/components/location-search";

interface Member {
  id: number;
  name: string;
  phone: string;
  pin: string;
  isAdmin: boolean;
  isActive: boolean;
  homeAddress: string | null;
  homeLat: string | null;
  homeLng: string | null;
  timezone: string | null;
  preferredChannel: string | null;
  canManageLocations: boolean;
  canManageEvents: boolean;
  canManageMembers: boolean;
}

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

export default function AdminMembersPage() {
  const router = useRouter();
  const [callerIsAdmin, setCallerIsAdmin] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [defaultTz, setDefaultTz] = useState("America/New_York");
  const [defaultChannel, setDefaultChannel] = useState("sms");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    pin: "",
    isAdmin: false,
    homeAddress: "",
    homePlaceId: "",
    homeLat: "",
    homeLng: "",
    timezone: "America/New_York",
    preferredChannel: "",
    consentMessages: false,
    consentPrivacy: false,
    consentTerms: false,
    canManageLocations: false,
    canManageEvents: false,
    canManageMembers: false,
  });
  const [error, setError] = useState("");
  const [testingSmsFor, setTestingSmsFor] = useState<number | null>(null);
  const [smsResult, setSmsResult] = useState<{ id: number; msg: string; ok: boolean } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeResult, setGeocodeResult] = useState<{ msg: string; ok: boolean } | null>(null);
  const [saveGeoStatus, setSaveGeoStatus] = useState<string | null>(null);

  async function loadMembers() {
    const res = await fetch("/api/admin/members");
    if (res.ok) {
      setMembers(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.isLoggedIn || (!data.isAdmin && !data.canManageMembers)) {
          router.push("/");
          return;
        }
        setCallerIsAdmin(data.isAdmin);
      })
      .catch(() => router.push("/"));
    loadMembers();
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.defaultTimezone) {
          setDefaultTz(data.defaultTimezone);
          setForm((f) => ({ ...f, timezone: data.defaultTimezone }));
        }
        if (data.defaultChannel) {
          setDefaultChannel(data.defaultChannel);
        }
      })
      .catch(() => {});
  }, [router]);

  async function testGeocode() {
    if (!form.homeAddress.trim()) {
      setGeocodeResult({ msg: "Enter a home address first", ok: false });
      return;
    }
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
        setGeocodeResult({
          msg: `Found: ${data.formattedAddress || `${data.lat}, ${data.lng}`}`,
          ok: true,
        });
      } else {
        setGeocodeResult({
          msg: `${data.status}: ${data.error || "No results"}`,
          ok: false,
        });
      }
    } catch {
      setGeocodeResult({ msg: "Network error", ok: false });
    }
    setGeocoding(false);
  }

  function isSmsEffective() {
    const ch = form.preferredChannel || defaultChannel;
    return ch === "sms";
  }

  function validateConsent(): string | null {
    if (!isSmsEffective()) return null;
    if (!form.consentMessages) return "You must consent to receiving text messages to use SMS.";
    if (!form.consentPrivacy) return "You must agree to the Privacy Policy to use SMS.";
    if (!form.consentTerms) return "You must agree to the Terms of Service to use SMS.";
    return null;
  }

  async function handleAdd() {
    setError("");
    setSaveGeoStatus(null);
    const consentError = validateConsent();
    if (consentError) { setError(consentError); return; }
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      if (data.geocodeStatus && data.geocodeStatus !== "skipped" && data.geocodeStatus !== "manual") {
        setSaveGeoStatus(data.geocodeStatus);
      }
      setShowAdd(false);
      setForm({ name: "", phone: "", pin: "", isAdmin: false, homeAddress: "", homePlaceId: "", homeLat: "", homeLng: "", timezone: defaultTz, preferredChannel: "", consentMessages: false, consentPrivacy: false, consentTerms: false, canManageLocations: false, canManageEvents: false, canManageMembers: false });
      loadMembers();
    } else {
      setError(data.error || "Failed to add member");
    }
  }

  async function handleUpdate(id: number) {
    setError("");
    setSaveGeoStatus(null);
    const consentError = validateConsent();
    if (consentError) { setError(consentError); return; }
    const res = await fetch("/api/members", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...form }),
    });
    const data = await res.json();
    if (res.ok) {
      if (data.geocodeStatus && data.geocodeStatus !== "skipped" && data.geocodeStatus !== "manual") {
        setSaveGeoStatus(data.geocodeStatus);
      }
      setEditingId(null);
      setForm({ name: "", phone: "", pin: "", isAdmin: false, homeAddress: "", homePlaceId: "", homeLat: "", homeLng: "", timezone: defaultTz, preferredChannel: "", consentMessages: false, consentPrivacy: false, consentTerms: false, canManageLocations: false, canManageEvents: false, canManageMembers: false });
      loadMembers();
    } else {
      setError(data.error || "Failed to update member");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Remove this family member?")) return;
    await fetch("/api/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadMembers();
  }

  async function sendTestSms(member: Member) {
    setTestingSmsFor(member.id);
    setSmsResult(null);
    try {
      const res = await fetch("/api/admin/test-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setSmsResult({ id: member.id, msg: `Sent to ${member.phone}`, ok: true });
      } else {
        setSmsResult({ id: member.id, msg: data.error || "Failed", ok: false });
      }
    } catch {
      setSmsResult({ id: member.id, msg: "Network error", ok: false });
    }
    setTestingSmsFor(null);
  }

  function startEdit(member: Member) {
    setEditingId(member.id);
    const channel = member.preferredChannel || "";
    setForm({
      name: member.name,
      phone: member.phone,
      pin: "",
      isAdmin: isPermanentAdmin(member.name) ? true : member.isAdmin,
      homeAddress: member.homeAddress || "",
      homePlaceId: "",
      homeLat: member.homeLat || "",
      homeLng: member.homeLng || "",
      timezone: member.timezone || defaultTz,
      preferredChannel: channel,
      consentMessages: channel === "sms" || (!channel && defaultChannel === "sms"),
      consentPrivacy: channel === "sms" || (!channel && defaultChannel === "sms"),
      consentTerms: channel === "sms" || (!channel && defaultChannel === "sms"),
      canManageLocations: member.canManageLocations,
      canManageEvents: member.canManageEvents,
      canManageMembers: member.canManageMembers,
    });
    setShowAdd(false);
  }

  const PERMANENT_ADMIN_NAME = "Nick";

  function isPermanentAdmin(name: string) {
    return name.toLowerCase().trim() === PERMANENT_ADMIN_NAME.toLowerCase();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-lg flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href={callerIsAdmin ? "/admin" : "/"}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">Family Members</h1>
          </div>
          <Button
            size="sm"
            className="gap-1"
            onClick={() => {
              setShowAdd(true);
              setEditingId(null);
              setForm({ name: "", phone: "", pin: "", isAdmin: false, homeAddress: "", homePlaceId: "", homeLat: "", homeLng: "", timezone: defaultTz, preferredChannel: "", consentMessages: false, consentPrivacy: false, consentTerms: false, canManageLocations: false, canManageEvents: false, canManageMembers: false });
            }}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
        {saveGeoStatus && (
          <p className={`text-xs text-center ${saveGeoStatus === "success" ? "text-green-400" : "text-yellow-400"}`}>
            Geocode: {saveGeoStatus}
          </p>
        )}

        {(showAdd || editingId !== null) && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h3 className="font-semibold">
              {editingId ? "Edit Member" : "Add Member"}
            </h3>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Name"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone (E.164)</Label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="+10000000000"
              />
            </div>
            <div className="space-y-2">
              <Label>
                {editingId
                  ? "New Password (leave blank to keep)"
                  : "Password"}
              </Label>
              <Input
                type="password"
                value={form.pin}
                onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))}
                placeholder="Min 6 chars, 1 number"
              />
              <p className="text-xs text-muted-foreground">
                At least 6 characters with 1 number
              </p>
            </div>
            <div className="space-y-2">
              <Label>Home Address</Label>
              <LocationSearch
                value={form.homeAddress}
                onChange={(data) =>
                  setForm((f) => ({
                    ...f,
                    homeAddress: data.location,
                    homePlaceId: data.placeId || "",
                    homeLat: "",
                    homeLng: "",
                  }))
                }
                onClear={() =>
                  setForm((f) => ({
                    ...f,
                    homeAddress: "",
                    homePlaceId: "",
                    homeLat: "",
                    homeLng: "",
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Coordinates</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-xs"
                  disabled={geocoding || !form.homeAddress.trim()}
                  onClick={testGeocode}
                >
                  {geocoding ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <MapPin className="h-3 w-3" />
                  )}
                  Geocode
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  value={form.homeLat}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, homeLat: e.target.value }))
                  }
                  placeholder="Latitude"
                  className="text-xs"
                />
                <Input
                  value={form.homeLng}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, homeLng: e.target.value }))
                  }
                  placeholder="Longitude"
                  className="text-xs"
                />
              </div>
              {geocodeResult && (
                <p className={`text-xs ${geocodeResult.ok ? "text-green-400" : "text-red-400"}`}>
                  {geocodeResult.msg}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Time Zone</Label>
              <select
                value={form.timezone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, timezone: e.target.value }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Messaging Channel</Label>
              <select
                value={form.preferredChannel}
                onChange={(e) =>
                  setForm((f) => ({ ...f, preferredChannel: e.target.value }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Use Default ({defaultChannel === "whatsapp" ? "WhatsApp" : "SMS"})</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
              <div className="mt-3 space-y-2">
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.consentMessages}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, consentMessages: e.target.checked }))
                    }
                    className="mt-0.5"
                  />
                  <span className="leading-snug">
                    I consent to receive non-marketing text messages from Family
                    Calendar regarding event details. Message frequency varies,
                    message and data rates may apply. Reply HELP for assistance,
                    reply STOP to opt out.
                  </span>
                </label>
                {isSmsEffective() && !form.consentMessages && (
                  <p className="text-xs text-destructive ml-5">Required for SMS</p>
                )}

                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.consentPrivacy}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, consentPrivacy: e.target.checked }))
                    }
                    className="mt-0.5"
                  />
                  <span>
                    I agree to the Family Calendar{" "}
                    <a href="/privacy" target="_blank" className="text-primary underline hover:text-primary/80">
                      Privacy Policy
                    </a>
                  </span>
                </label>
                {isSmsEffective() && !form.consentPrivacy && (
                  <p className="text-xs text-destructive ml-5">Required for SMS</p>
                )}

                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.consentTerms}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, consentTerms: e.target.checked }))
                    }
                    className="mt-0.5"
                  />
                  <span>
                    I agree to the Family Calendar{" "}
                    <a href="/terms" target="_blank" className="text-primary underline hover:text-primary/80">
                      Terms of Service
                    </a>
                  </span>
                </label>
                {isSmsEffective() && !form.consentTerms && (
                  <p className="text-xs text-destructive ml-5">Required for SMS</p>
                )}
              </div>
            </div>
            {callerIsAdmin && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isAdmin}
                  disabled={isPermanentAdmin(form.name)}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isAdmin: e.target.checked }))
                  }
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className={isPermanentAdmin(form.name) ? "text-muted-foreground" : ""}>
                  Admin
                  {isPermanentAdmin(form.name) && (
                    <span className="text-xs text-muted-foreground ml-1">(permanent)</span>
                  )}
                </span>
              </label>
            )}
            {callerIsAdmin && !form.isAdmin && (
              <div className="rounded-lg border border-border/50 p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Page Access</p>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.canManageLocations}
                    onChange={(e) => setForm((f) => ({ ...f, canManageLocations: e.target.checked }))}
                  />
                  Saved Locations
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.canManageEvents}
                    onChange={(e) => setForm((f) => ({ ...f, canManageEvents: e.target.checked }))}
                  />
                  Manage Events
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.canManageMembers}
                    onChange={(e) => setForm((f) => ({ ...f, canManageMembers: e.target.checked }))}
                  />
                  Manage Members
                </label>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() =>
                  editingId ? handleUpdate(editingId) : handleAdd()
                }
                className="gap-1"
              >
                <Check className="h-3 w-3" />
                {editingId ? "Save" : "Add"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowAdd(false);
                  setEditingId(null);
                  setError("");
                }}
                className="gap-1"
              >
                <X className="h-3 w-3" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : members.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No family members yet.
          </p>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-xl border bg-card p-4"
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{member.name}</span>
                  {member.isAdmin && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      member.isActive
                        ? "bg-green-500/15 text-green-400"
                        : "bg-yellow-500/15 text-yellow-400"
                    }`}
                  >
                    {member.isActive ? "Active" : "Pending"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm text-muted-foreground">{member.phone}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    (member.preferredChannel || defaultChannel) === "whatsapp"
                      ? "bg-green-500/15 text-green-400"
                      : "bg-blue-500/15 text-blue-400"
                  }`}>
                    {(member.preferredChannel || defaultChannel) === "whatsapp" ? "WhatsApp" : "SMS"}
                  </span>
                </div>
                {member.homeAddress && (
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {member.homeAddress}
                  </p>
                )}
                {member.homeLat && member.homeLng && (
                  <p className="text-[10px] text-muted-foreground/60">
                    {member.homeLat}, {member.homeLng}
                  </p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  title="Send Test SMS"
                  disabled={testingSmsFor === member.id}
                  onClick={() => sendTestSms(member)}
                >
                  {testingSmsFor === member.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 text-primary" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => startEdit(member)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(member.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              {smsResult?.id === member.id && (
                <p
                  className={`text-xs mt-1 ${smsResult.ok ? "text-green-400" : "text-red-400"}`}
                >
                  {smsResult.msg}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

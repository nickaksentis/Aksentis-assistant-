"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldAlert,
  Loader2,
  Pencil,
  PlusCircle,
  Clock,
  Trash2,
  Settings,
  User,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";

interface SmsLogEntry {
  id: number;
  phone: string;
  messageBody: string;
  twilioSid: string | null;
  direction: string;
  status: string;
  channel: string | null;
  createdAt: string;
  memberId: number | null;
  memberName: string | null;
}

interface Counts {
  total: number;
  inbound: number;
  outbound: number;
  spam: number;
  failed: number;
}

interface ActivityEntry {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  memberId: number | null;
  memberName: string | null;
  changes: string | null;
  createdAt: string;
}

interface ReminderEntry {
  id: number;
  eventId: number;
  eventName: string;
  eventDate: string;
  scheduledAt: string;
  sendTo: string;
  sendToNames: string;
  status: string;
  sentAt: string | null;
  messageBody: string | null;
  channel: string | null;
}

interface ReminderCounts {
  scheduled: number;
  sent: number;
  failed: number;
}

export default function AdminUsagePage() {
  const router = useRouter();
  const [tab, setTab] = useState<"sms" | "activity" | "reminders">("sms");
  const [logs, setLogs] = useState<SmsLogEntry[]>([]);
  const [counts, setCounts] = useState<Counts>({
    total: 0,
    inbound: 0,
    outbound: 0,
    spam: 0,
    failed: 0,
  });
  const [activityLogs, setActivityLogs] = useState<ActivityEntry[]>([]);
  const [reminderLogs, setReminderLogs] = useState<ReminderEntry[]>([]);
  const [reminderCounts, setReminderCounts] = useState<ReminderCounts>({
    scheduled: 0,
    sent: 0,
    failed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [reminderFilter, setReminderFilter] = useState<string>("all");

  // Pagination
  const [pageSize, setPageSize] = useState(25);
  const [smsPage, setSmsPage] = useState(0);
  const [smsTotal, setSmsTotal] = useState(0);
  const [activityPage, setActivityPage] = useState(0);
  const [activityTotal, setActivityTotal] = useState(0);
  const [reminderPage, setReminderPage] = useState(0);
  const [reminderTotal, setReminderTotal] = useState(0);

  async function loadLogs(direction?: string, page = 0, limit = pageSize) {
    setLoading(true);
    const params = new URLSearchParams();
    if (direction && direction !== "all") {
      if (direction === "spam") {
        params.set("status", "spam_blocked");
      } else {
        params.set("direction", direction);
      }
    }
    params.set("limit", String(limit));
    params.set("offset", String(page * limit));
    const res = await fetch(`/api/admin/usage?${params}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setCounts(data.counts);
      setSmsTotal(data.total || 0);
    }
    setLoading(false);
  }

  async function loadActivity(page = 0, limit = pageSize) {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("offset", String(page * limit));
    const res = await fetch(`/api/admin/activity?${params}`);
    if (res.ok) {
      const data = await res.json();
      setActivityLogs(data.logs);
      setActivityTotal(data.total || 0);
    }
    setLoading(false);
  }

  async function loadReminders(statusFilter?: string, page = 0, limit = pageSize) {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== "all") {
      params.set("status", statusFilter === "scheduled" ? "pending" : statusFilter);
    }
    params.set("limit", String(limit));
    params.set("offset", String(page * limit));
    const res = await fetch(`/api/admin/reminders?${params}`);
    if (res.ok) {
      const data = await res.json();
      setReminderLogs(data.logs);
      setReminderCounts(data.counts);
      setReminderTotal(data.total || 0);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (tab === "sms") {
      loadLogs(filter, smsPage, pageSize);
    } else if (tab === "activity") {
      loadActivity(activityPage, pageSize);
    } else {
      loadReminders(reminderFilter, reminderPage, pageSize);
    }
  }, [filter, tab, reminderFilter, smsPage, activityPage, reminderPage, pageSize]);

  function getStatusColor(status: string) {
    switch (status) {
      case "sent":
      case "delivered":
        return "text-green-400";
      case "failed":
      case "undelivered":
        return "text-red-400";
      case "spam_blocked":
        return "text-orange-400";
      case "inactive_blocked":
        return "text-yellow-400";
      default:
        return "text-muted-foreground";
    }
  }

  function renderChanges(changesStr: string | null) {
    if (!changesStr) return null;
    try {
      const changes = JSON.parse(changesStr) as Record<
        string,
        { old: unknown; new: unknown }
      >;
      return (
        <div className="space-y-1 mt-1">
          {Object.entries(changes).map(([field, vals]) => (
            <div key={field} className="text-xs">
              <span className="font-medium text-foreground capitalize">
                {field}:
              </span>{" "}
              <span className="text-red-400 line-through">
                {String(vals.old || "(empty)")}
              </span>{" "}
              &rarr;{" "}
              <span className="text-green-400">
                {String(vals.new || "(empty)")}
              </span>
            </div>
          ))}
        </div>
      );
    } catch {
      return null;
    }
  }

  function handlePageSizeChange(newSize: number) {
    setPageSize(newSize);
    setSmsPage(0);
    setActivityPage(0);
    setReminderPage(0);
  }

  function PageSizeDropdown() {
    return (
      <select
        value={pageSize}
        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
        className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs font-medium"
      >
        <option value={25}>25</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </select>
    );
  }

  function Pagination({
    page,
    total,
    onPageChange,
  }: {
    page: number;
    total: number;
    onPageChange: (p: number) => void;
  }) {
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-center gap-3 pt-4">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="rounded-lg border border-input p-1.5 disabled:opacity-30 hover:bg-accent transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs text-muted-foreground">
          Page {page + 1} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="rounded-lg border border-input p-1.5 disabled:opacity-30 hover:bg-accent transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
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
          <h1 className="text-lg font-semibold">Usage & Logs</h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-6 space-y-6">
        {/* Tab Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab("sms")}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors border ${
              tab === "sms"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-input hover:bg-accent"
            }`}
          >
            Message Logs
          </button>
          <button
            onClick={() => setTab("activity")}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors border ${
              tab === "activity"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-input hover:bg-accent"
            }`}
          >
            Activity
          </button>
          <button
            onClick={() => setTab("reminders")}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors border ${
              tab === "reminders"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-input hover:bg-accent"
            }`}
          >
            Reminders
          </button>
        </div>

        {tab === "reminders" ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border bg-card p-4 text-center">
                <p className="text-2xl font-bold">{reminderCounts.scheduled}</p>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </div>
              <div className="rounded-xl border bg-card p-4 text-center">
                <p className="text-2xl font-bold">{reminderCounts.sent}</p>
                <p className="text-xs text-muted-foreground">Sent</p>
              </div>
              <div className="rounded-xl border bg-card p-4 text-center">
                <p className="text-2xl font-bold">{reminderCounts.failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap gap-2 flex-1">
                {["all", "scheduled", "sent"].map((f) => (
                  <button
                    key={f}
                    onClick={() => { setReminderFilter(f); setReminderPage(0); }}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors border ${
                      reminderFilter === f
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-input hover:bg-accent"
                    }`}
                  >
                    {f === "all" ? "All" : f === "scheduled" ? "Scheduled" : "Sent"}
                  </button>
                ))}
              </div>
              <PageSizeDropdown />
            </div>

            {/* Reminder List */}
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : reminderLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No reminders found.
              </p>
            ) : (
              <div className="space-y-2">
                {reminderLogs.map((reminder) => {
                  // Calculate human-readable offset
                  let offsetLabel = "";
                  if (reminder.eventDate && reminder.scheduledAt) {
                    const diffMs =
                      new Date(reminder.eventDate).getTime() -
                      new Date(reminder.scheduledAt).getTime();
                    const diffMin = Math.round(diffMs / (60 * 1000));
                    if (diffMin >= 43200) offsetLabel = `${Math.round(diffMin / 43200)} month${Math.round(diffMin / 43200) > 1 ? "s" : ""} before`;
                    else if (diffMin >= 10080) offsetLabel = `${Math.round(diffMin / 10080)} week${Math.round(diffMin / 10080) > 1 ? "s" : ""} before`;
                    else if (diffMin >= 1440) offsetLabel = `${Math.round(diffMin / 1440)} day${Math.round(diffMin / 1440) > 1 ? "s" : ""} before`;
                    else if (diffMin >= 60) offsetLabel = `${Math.round(diffMin / 60)} hour${Math.round(diffMin / 60) > 1 ? "s" : ""} before`;
                    else if (diffMin > 0) offsetLabel = `${diffMin} min before`;
                    else offsetLabel = "Travel time reminder";
                  }

                  return (
                    <div
                      key={reminder.id}
                      className="rounded-xl border bg-card p-3 space-y-1 overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Clock className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                          <span className="text-sm font-medium truncate">
                            {reminder.eventName}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-medium shrink-0 ${
                            reminder.status === "pending"
                              ? "text-blue-400"
                              : reminder.status === "sent"
                                ? "text-green-400"
                                : "text-red-400"
                          }`}
                        >
                          {reminder.status === "pending" ? "scheduled" : reminder.status}
                        </span>
                      </div>
                      {offsetLabel && (
                        <p className="text-xs text-muted-foreground">
                          Reminder: {offsetLabel}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Fires:{" "}
                        {format(parseISO(reminder.scheduledAt), "MMM d, h:mm a")}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span>
                            Send to: {reminder.sendToNames || reminder.sendTo}
                          </span>
                          {reminder.channel && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                reminder.channel === "whatsapp"
                                  ? "bg-green-500/15 text-green-400"
                                  : "bg-blue-500/15 text-blue-400"
                              }`}
                            >
                              {reminder.channel === "whatsapp" ? "WhatsApp" : "SMS"}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            router.push(
                              `/edit-event?id=${reminder.eventId}&from=/admin/usage`
                            )
                          }
                          className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          title="Edit event"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {reminder.messageBody && (
                        <p className="text-xs text-muted-foreground/60 whitespace-pre-wrap break-words">
                          {reminder.messageBody}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <Pagination page={reminderPage} total={reminderTotal} onPageChange={setReminderPage} />
          </>
        ) : tab === "sms" ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border bg-card p-4 text-center">
                <p className="text-2xl font-bold">{counts.outbound || 0}</p>
                <p className="text-xs text-muted-foreground">Sent</p>
              </div>
              <div className="rounded-xl border bg-card p-4 text-center">
                <p className="text-2xl font-bold">{counts.inbound || 0}</p>
                <p className="text-xs text-muted-foreground">Received</p>
              </div>
              <div className="rounded-xl border bg-card p-4 text-center">
                <p className="text-2xl font-bold">{counts.spam || 0}</p>
                <p className="text-xs text-muted-foreground">Spam Blocked</p>
              </div>
              <div className="rounded-xl border bg-card p-4 text-center">
                <p className="text-2xl font-bold">{counts.failed || 0}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap gap-2 flex-1">
                {["all", "outbound", "inbound", "spam"].map((f) => (
                  <button
                    key={f}
                    onClick={() => { setFilter(f); setSmsPage(0); }}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors border ${
                      filter === f
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-input hover:bg-accent"
                    }`}
                  >
                    {f === "all"
                      ? "All"
                      : f === "outbound"
                        ? "Sent"
                        : f === "inbound"
                          ? "Received"
                          : "Spam"}
                  </button>
                ))}
              </div>
              <PageSizeDropdown />
            </div>

            {/* SMS Log List */}
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No message logs found.
              </p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl border bg-card p-3 space-y-1 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {log.status === "spam_blocked" ||
                        log.status === "inactive_blocked" ? (
                          <ShieldAlert className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                        ) : log.direction === "outbound" ? (
                          <ArrowUpRight className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                        ) : (
                          <ArrowDownLeft className="h-3.5 w-3.5 text-green-400 shrink-0" />
                        )}
                        <span className="text-sm font-medium truncate">
                          {log.memberName || log.phone}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-medium shrink-0 ${getStatusColor(log.status)}`}
                      >
                        {log.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                      {log.messageBody}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span>{log.phone}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          log.channel === "whatsapp"
                            ? "bg-green-500/15 text-green-400"
                            : "bg-blue-500/15 text-blue-400"
                        }`}>
                          {log.channel === "whatsapp" ? "WhatsApp" : "SMS"}
                        </span>
                      </div>
                      <span>
                        {format(parseISO(log.createdAt), "MMM d, h:mm a")}
                      </span>
                    </div>
                    {log.twilioSid && (
                      <p className="text-xs text-muted-foreground/60 truncate">
                        SID: {log.twilioSid}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            <Pagination page={smsPage} total={smsTotal} onPageChange={setSmsPage} />
          </>
        ) : (
          /* Activity Log Tab */
          <>
            <div className="flex justify-end">
              <PageSizeDropdown />
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : activityLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No activity yet.
              </p>
            ) : (
              <div className="space-y-2">
                {activityLogs.map((entry) => {
                  // Determine icon, label, and whether an edit link makes sense
                  let Icon = Pencil;
                  let iconColor = "text-blue-400";
                  let actionLabel = entry.action;
                  let editLink: string | null = null;

                  switch (entry.action) {
                    case "event_created":
                      Icon = PlusCircle; iconColor = "text-green-400";
                      actionLabel = "created an event";
                      editLink = `/edit-event?id=${entry.entityId}&from=/admin/usage`;
                      break;
                    case "event_updated":
                      Icon = Pencil; iconColor = "text-blue-400";
                      actionLabel = "edited an event";
                      editLink = `/edit-event?id=${entry.entityId}&from=/admin/usage`;
                      break;
                    case "event_deleted":
                      Icon = Trash2; iconColor = "text-red-400";
                      actionLabel = "deleted an event";
                      break;
                    case "settings_updated":
                      Icon = Settings; iconColor = "text-purple-400";
                      actionLabel = "updated settings";
                      break;
                    case "member_created":
                      Icon = PlusCircle; iconColor = "text-green-400";
                      actionLabel = "added a member";
                      break;
                    case "member_updated":
                      Icon = User; iconColor = "text-blue-400";
                      actionLabel = "updated a member profile";
                      break;
                    case "member_deleted":
                      Icon = Trash2; iconColor = "text-red-400";
                      actionLabel = "removed a member";
                      break;
                    case "location_created":
                      Icon = MapPin; iconColor = "text-green-400";
                      actionLabel = "added a location";
                      break;
                    case "location_updated":
                      Icon = MapPin; iconColor = "text-blue-400";
                      actionLabel = "updated a location";
                      break;
                    case "location_deleted":
                      Icon = Trash2; iconColor = "text-red-400";
                      actionLabel = "deleted a location";
                      break;
                  }

                  // Extract entity name from changes if available
                  let entityName = "";
                  try {
                    if (entry.changes) {
                      const c = JSON.parse(entry.changes);
                      if (c.name && typeof c.name === "string") entityName = c.name;
                      else if (c.name?.new) entityName = String(c.name.new);
                    }
                  } catch { /* ignore */ }

                  return (
                    <div
                      key={entry.id}
                      className="rounded-xl border bg-card p-3 space-y-1 overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className={`h-3.5 w-3.5 ${iconColor} shrink-0`} />
                          <span className="text-sm font-medium truncate">
                            {entry.memberName || "System"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {actionLabel}
                          </span>
                        </div>
                        {editLink && (
                          <button
                            onClick={() => router.push(editLink!)}
                            className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      {entityName && (
                        <p className="text-xs font-medium text-foreground/80">
                          {entityName}
                        </p>
                      )}
                      {(entry.action.endsWith("_updated") || entry.action === "settings_updated") &&
                        renderChanges(entry.changes)}
                      <div className="text-xs text-muted-foreground">
                        {format(parseISO(entry.createdAt), "MMM d, h:mm a")}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Pagination page={activityPage} total={activityTotal} onPageChange={setActivityPage} />
          </>
        )}
      </div>
    </div>
  );
}

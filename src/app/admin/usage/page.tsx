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
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface SmsLogEntry {
  id: number;
  phone: string;
  messageBody: string;
  twilioSid: string | null;
  direction: string;
  status: string;
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

export default function AdminUsagePage() {
  const [logs, setLogs] = useState<SmsLogEntry[]>([]);
  const [counts, setCounts] = useState<Counts>({
    total: 0,
    inbound: 0,
    outbound: 0,
    spam: 0,
    failed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  async function loadLogs(direction?: string) {
    setLoading(true);
    const params = new URLSearchParams();
    if (direction && direction !== "all") {
      if (direction === "spam") {
        params.set("status", "spam_blocked");
      } else {
        params.set("direction", direction);
      }
    }
    const res = await fetch(`/api/admin/usage?${params}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setCounts(data.counts);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadLogs(filter);
  }, [filter]);

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
        <div className="flex flex-wrap gap-2">
          {["all", "outbound", "inbound", "spam"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
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

        {/* Log List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No SMS logs found.
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
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {log.messageBody}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{log.phone}</span>
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
      </div>
    </div>
  );
}

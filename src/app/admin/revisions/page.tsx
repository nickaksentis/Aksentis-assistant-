"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { REVISION_LOG, CURRENT_VERSION } from "@/lib/revision-log";

export default function AdminRevisionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-lg flex items-center gap-3 px-4 py-3">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold">Revision Log</h1>
            <p className="text-xs text-muted-foreground">
              Current: v{CURRENT_VERSION}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-6 space-y-6">
        {[...REVISION_LOG].reverse().map((entry) => (
          <div key={entry.version} className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-primary">
                v{entry.version}
              </span>
              <span className="text-xs text-muted-foreground">
                {entry.date}
              </span>
            </div>
            <ul className="space-y-1.5">
              {entry.changes.map((change, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-primary shrink-0">-</span>
                  {change}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus, CalendarDays, Settings, LogOut } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [siteName, setSiteName] = useState("Family Calendar");
  const [siteSlogan, setSiteSlogan] = useState("Keep everyone on the same page");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.siteName) setSiteName(data.siteName);
        if (data.siteSlogan) setSiteSlogan(data.siteSlogan);
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="mb-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CalendarDays className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{siteName}</h1>
        <p className="mt-2 text-muted-foreground">{siteSlogan}</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <Link href="/add-event" className="block">
          <button className="w-full flex items-center justify-center gap-3 rounded-xl bg-primary px-6 py-5 text-lg font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl active:scale-[0.98]">
            <CalendarPlus className="h-6 w-6" />
            Add Event
          </button>
        </Link>

        <Link href="/events" className="block">
          <button className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-primary/20 bg-card px-6 py-5 text-lg font-semibold text-foreground shadow-sm transition-all hover:border-primary/40 hover:bg-accent hover:shadow-md active:scale-[0.98]">
            <CalendarDays className="h-6 w-6 text-primary" />
            View Events
          </button>
        </Link>
      </div>

      <div className="mt-8 flex items-center gap-4">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings className="h-4 w-4" />
          Admin
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Log out
        </button>
      </div>

      <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground/60">
        <Link href="/privacy" className="hover:text-muted-foreground transition-colors">
          Privacy Policy
        </Link>
        <span>&middot;</span>
        <Link href="/terms" className="hover:text-muted-foreground transition-colors">
          Terms & Conditions
        </Link>
      </div>
    </div>
  );
}

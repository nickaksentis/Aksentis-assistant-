"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import Link from "next/link";

interface Member {
  id: number;
  name: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [siteName, setSiteName] = useState("Family Calendar");

  useEffect(() => {
    fetch("/api/members")
      .then((res) => res.json())
      .then(setMembers)
      .catch(() => setError("Failed to load family members"));
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.siteName) setSiteName(data.siteName);
      })
      .catch(() => {});
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMember) {
      setError("Please select a family member");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: selectedMember, pin: password }),
    });

    if (res.ok) {
      router.push("/");
    } else {
      const data = await res.json();
      setError(data.error || "Login failed");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <CalendarDays className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{siteName}</CardTitle>
          <CardDescription>
            Select your name and enter your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label>Who are you?</Label>
              <div className="grid grid-cols-2 gap-2">
                {members.map((member) => (
                  <Button
                    key={member.id}
                    type="button"
                    variant={
                      selectedMember === member.id ? "default" : "outline"
                    }
                    className="w-full"
                    onClick={() => {
                      setSelectedMember(member.id);
                      setError("");
                    }}
                  >
                    {member.name}
                  </Button>
                ))}
              </div>
              {members.length === 0 && !error && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Loading...
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!selectedMember || !password || loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>

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

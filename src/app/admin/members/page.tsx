"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Pencil, Trash2, X, Check, Send, Loader2 } from "lucide-react";

interface Member {
  id: number;
  name: string;
  phone: string;
  pin: string;
  isAdmin: boolean;
  isActive: boolean;
  homeAddress: string | null;
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    pin: "",
    isAdmin: false,
    homeAddress: "",
  });
  const [error, setError] = useState("");
  const [testingSmsFor, setTestingSmsFor] = useState<number | null>(null);
  const [smsResult, setSmsResult] = useState<{ id: number; msg: string; ok: boolean } | null>(null);

  async function loadMembers() {
    const res = await fetch("/api/admin/members");
    if (res.ok) {
      setMembers(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => {
    loadMembers();
  }, []);

  async function handleAdd() {
    setError("");
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowAdd(false);
      setForm({ name: "", phone: "", pin: "", isAdmin: false, homeAddress: "" });
      loadMembers();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to add member");
    }
  }

  async function handleUpdate(id: number) {
    setError("");
    const res = await fetch("/api/members", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...form }),
    });
    if (res.ok) {
      setEditingId(null);
      setForm({ name: "", phone: "", pin: "", isAdmin: false, homeAddress: "" });
      loadMembers();
    } else {
      const data = await res.json();
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
    setForm({
      name: member.name,
      phone: member.phone,
      pin: "",
      isAdmin: member.isAdmin,
      homeAddress: member.homeAddress || "",
    });
    setShowAdd(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-lg flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/admin">
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
              setForm({ name: "", phone: "", pin: "", isAdmin: false, homeAddress: "" });
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
              <Input
                value={form.homeAddress}
                onChange={(e) =>
                  setForm((f) => ({ ...f, homeAddress: e.target.value }))
                }
                placeholder="123 Main St, City, State"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isAdmin}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isAdmin: e.target.checked }))
                }
              />
              Admin
            </label>
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
                <p className="text-sm text-muted-foreground">{member.phone}</p>
                {member.homeAddress && (
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {member.homeAddress}
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

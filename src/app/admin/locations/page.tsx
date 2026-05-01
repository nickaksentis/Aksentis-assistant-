"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationSearch } from "@/components/location-search";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  MapPin,
  Loader2,
} from "lucide-react";

interface SavedLocation {
  id: number;
  name: string;
  address: string;
  placeId: string | null;
  latitude: string | null;
  longitude: string | null;
  locationType: string;
}

const LOCATION_TYPES = [
  { value: "other", label: "Other" },
  { value: "restaurant", label: "Restaurant" },
  { value: "doctors_office", label: "Doctors Office" },
  { value: "retail", label: "Retail" },
  { value: "house", label: "House" },
];

export default function AdminLocationsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    placeId: "",
    latitude: "",
    longitude: "",
    locationType: "other",
  });
  const [error, setError] = useState("");

  async function loadLocations() {
    const res = await fetch("/api/admin/locations");
    if (res.ok) {
      setLocations(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.isLoggedIn || (!data.isAdmin && !data.canManageLocations)) {
          router.push("/");
          return;
        }
        setIsAdmin(data.isAdmin);
      })
      .catch(() => router.push("/"));
    loadLocations();
  }, [router]);

  async function handleAdd() {
    setError("");
    if (!form.name.trim() || !form.address.trim()) {
      setError("Name and address are required");
      return;
    }
    const res = await fetch("/api/admin/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowAdd(false);
      setForm({ name: "", address: "", placeId: "", latitude: "", longitude: "", locationType: "other" });
      loadLocations();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to add location");
    }
  }

  async function handleUpdate(id: number) {
    setError("");
    const res = await fetch("/api/admin/locations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: form.name, address: form.address, locationType: form.locationType }),
    });
    if (res.ok) {
      setEditingId(null);
      setForm({ name: "", address: "", placeId: "", latitude: "", longitude: "", locationType: "other" });
      loadLocations();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to update");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this location?")) return;
    await fetch("/api/admin/locations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadLocations();
  }

  function startEdit(loc: SavedLocation) {
    setEditingId(loc.id);
    setForm({
      name: loc.name,
      address: loc.address,
      placeId: loc.placeId || "",
      latitude: loc.latitude || "",
      longitude: loc.longitude || "",
      locationType: loc.locationType || "other",
    });
    setShowAdd(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-lg flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href={isAdmin ? "/admin" : "/"}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">Saved Locations</h1>
          </div>
          <Button
            size="sm"
            className="gap-1"
            onClick={() => {
              setShowAdd(true);
              setEditingId(null);
              setForm({ name: "", address: "", placeId: "", latitude: "", longitude: "", locationType: "other" });
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

        {/* Add / Edit Form */}
        {(showAdd || editingId !== null) && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h3 className="font-semibold">
              {editingId ? "Edit Location" : "Add Location"}
            </h3>

            {!editingId && (
              <div className="space-y-2">
                <Label>Search Location</Label>
                <LocationSearch
                  value={form.address}
                  onChange={(data) =>
                    setForm((f) => ({
                      ...f,
                      name: f.name || data.location.split(",")[0].trim(),
                      address: data.location,
                      placeId: data.placeId,
                      latitude: data.latitude || "",
                      longitude: data.longitude || "",
                    }))
                  }
                  onClear={() =>
                    setForm((f) => ({
                      ...f,
                      address: "",
                      placeId: "",
                      latitude: "",
                      longitude: "",
                    }))
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Soccer Field"
              />
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
                placeholder="123 Main St, City, State"
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <select
                value={form.locationType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, locationType: e.target.value }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {LOCATION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

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

        {/* Location List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : locations.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No saved locations yet.
          </p>
        ) : (
          locations.map((loc) => (
            <div
              key={loc.id}
              className="flex items-center justify-between rounded-xl border bg-card p-4"
            >
              <div className="flex items-start gap-3 min-w-0">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{loc.name}</p>
                    {loc.locationType && loc.locationType !== "other" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary shrink-0">
                        {loc.locationType.replace("_", " ")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {loc.address}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => startEdit(loc)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(loc.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

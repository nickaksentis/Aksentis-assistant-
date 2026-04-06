"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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

export default function AdminLocationsPage() {
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
    loadLocations();
  }, []);

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
      setForm({ name: "", address: "", placeId: "", latitude: "", longitude: "" });
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
      body: JSON.stringify({ id, name: form.name, address: form.address }),
    });
    if (res.ok) {
      setEditingId(null);
      setForm({ name: "", address: "", placeId: "", latitude: "", longitude: "" });
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
            <h1 className="text-lg font-semibold">Saved Locations</h1>
          </div>
          <Button
            size="sm"
            className="gap-1"
            onClick={() => {
              setShowAdd(true);
              setEditingId(null);
              setForm({ name: "", address: "", placeId: "", latitude: "", longitude: "" });
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
                  <p className="font-medium truncate">{loc.name}</p>
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

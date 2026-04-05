"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";

interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

interface LocationData {
  location: string;
  placeId: string;
  latitude?: string;
  longitude?: string;
}

interface LocationSearchProps {
  value: string;
  onChange: (data: LocationData) => void;
  onClear: () => void;
}

export function LocationSearch({
  value,
  onChange,
  onClear,
}: LocationSearchProps) {
  const [query, setQuery] = useState(value);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInputChange(val: string) {
    setQuery(val);
    if (!val.trim()) {
      setPredictions([]);
      setShowDropdown(false);
      onClear();
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/places?q=${encodeURIComponent(val)}`
        );
        if (res.ok) {
          const data = await res.json();
          setPredictions(data.predictions || []);
          setShowDropdown(true);
        }
      } catch {
        // silently fail
      }
      setLoading(false);
    }, 300);
  }

  function handleSelect(prediction: PlacePrediction) {
    setQuery(prediction.description);
    setShowDropdown(false);
    setPredictions([]);
    onChange({
      location: prediction.description,
      placeId: prediction.placeId,
    });
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for a location..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => predictions.length > 0 && setShowDropdown(true)}
          className="pl-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {showDropdown && predictions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          {predictions.map((p) => (
            <button
              key={p.placeId}
              type="button"
              className="flex w-full flex-col px-3 py-2 text-left hover:bg-accent transition-colors first:rounded-t-md last:rounded-b-md"
              onClick={() => handleSelect(p)}
            >
              <span className="text-sm font-medium">{p.mainText}</span>
              <span className="text-xs text-muted-foreground">
                {p.secondaryText}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

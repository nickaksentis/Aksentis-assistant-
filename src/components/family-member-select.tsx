"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Member {
  id: number;
  name: string;
}

interface FamilyMemberSelectProps {
  selected: number[];
  onChange: (ids: number[]) => void;
}

export function FamilyMemberSelect({
  selected,
  onChange,
}: FamilyMemberSelectProps) {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    fetch("/api/members")
      .then((res) => res.json())
      .then(setMembers)
      .catch(() => {});
  }, []);

  function toggle(id: number) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {members.map((member) => (
        <button
          key={member.id}
          type="button"
          onClick={() => toggle(member.id)}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium transition-colors border",
            selected.includes(member.id)
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-foreground border-input hover:bg-accent"
          )}
        >
          {member.name}
        </button>
      ))}
      {members.length === 0 && (
        <span className="text-sm text-muted-foreground">Loading members...</span>
      )}
    </div>
  );
}

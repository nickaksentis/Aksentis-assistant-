"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarViewProps {
  eventDates: string[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

export function CalendarView({
  eventDates,
  selectedDate,
  onSelectDate,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const eventDateSet = useMemo(() => {
    const set = new Set<string>();
    eventDates.forEach((d) => {
      set.add(format(parseISO(d), "yyyy-MM-dd"));
    });
    return set;
  }, [eventDates]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-base font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const hasEvent = eventDateSet.has(dateStr);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(day)}
              className={`relative flex flex-col items-center justify-center py-2 text-sm transition-colors rounded-lg ${
                !isCurrentMonth
                  ? "text-muted-foreground/40"
                  : isSelected
                    ? "bg-primary text-primary-foreground font-semibold"
                    : isToday(day)
                      ? "bg-accent font-semibold"
                      : "hover:bg-accent"
              }`}
            >
              {format(day, "d")}
              {hasEvent && (
                <div
                  className={`absolute bottom-0.5 h-1 w-1 rounded-full ${
                    isSelected ? "bg-primary-foreground" : "bg-primary"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

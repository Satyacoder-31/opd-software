"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  faCalendarDays,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  clinicTodayDate,
  parseLocalDateInput,
  toDateInputValue,
} from "@/lib/date-utils";
import { cn } from "@/lib/utils";

function shiftDate(value: string, days: number): string {
  const date = parseLocalDateInput(value) ?? clinicTodayDate();
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

export function AppointmentsDatePicker({ date }: { date: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const selectedDate = parseLocalDateInput(date) ?? undefined;
  const today = toDateInputValue(clinicTodayDate());
  const isToday = date === today;

  const displayLabel = selectedDate
    ? selectedDate.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : date;

  function goTo(next: string) {
    if (next === date) return;
    setOpen(false);
    startTransition(() => {
      router.push(`/appointments?date=${encodeURIComponent(next)}`);
    });
  }

  return (
    <section
      aria-label="Appointment date"
      aria-busy={pending || undefined}
      className="border-y border-border bg-card"
    >
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 px-4 py-3 sm:px-6 md:px-8",
          pending && "opacity-70"
        )}
      >
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label="Previous day"
            disabled={pending}
            onClick={() => goTo(shiftDate(date, -1))}
            className="min-h-10 px-2.5"
          >
            <Icon icon={faChevronLeft} className="size-3.5" aria-hidden />
          </Button>

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={pending}
                  aria-label="Choose appointment date"
                  className="min-h-10 min-w-44 justify-start font-normal"
                >
                  <Icon icon={faCalendarDays} data-icon="inline-start" />
                  <span className="tabular-nums">{displayLabel}</span>
                </Button>
              }
            />
            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                defaultMonth={selectedDate}
                onSelect={(next) => {
                  if (!next) return;
                  goTo(toDateInputValue(next));
                }}
              />
            </PopoverContent>
          </Popover>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label="Next day"
            disabled={pending}
            onClick={() => goTo(shiftDate(date, 1))}
            className="min-h-10 px-2.5"
          >
            <Icon icon={faChevronRight} className="size-3.5" aria-hidden />
          </Button>
        </div>

        <Button
          type="button"
          variant={isToday ? "primary" : "ghost"}
          size="sm"
          disabled={pending || isToday}
          onClick={() => goTo(today)}
          className="min-h-10"
        >
          Today
        </Button>
      </div>
    </section>
  );
}

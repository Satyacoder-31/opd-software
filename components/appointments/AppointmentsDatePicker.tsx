"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldLabel } from "@/components/ui/shadcn/field";
import { parseLocalDateInput, toDateInputValue } from "@/lib/date-utils";

export function AppointmentsDatePicker({ date }: { date: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const selectedDate = parseLocalDateInput(date) ?? undefined;

  return (
    <section
      aria-label="Appointment date"
      aria-busy={pending || undefined}
      className="border-y border-border bg-card"
    >
      <div className="px-6 py-5 md:px-8">
        <Field className="w-fit">
          <FieldLabel>Date</FieldLabel>
          <Calendar
            mode="single"
            selected={selectedDate}
            defaultMonth={selectedDate}
            onSelect={(next) => {
              if (!next) return;
              const value = toDateInputValue(next);
              if (value === date) return;
              startTransition(() => {
                router.push(`/appointments?date=${encodeURIComponent(value)}`);
              });
            }}
            className={pending ? "pointer-events-none opacity-60" : undefined}
          />
        </Field>
      </div>
    </section>
  );
}

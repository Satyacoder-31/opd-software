"use client";

import { useId, useMemo, useState } from "react";
import { faCalendarDays } from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/shadcn/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/shadcn/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { parseLocalDateInput, toDateInputValue } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

type ScheduleDateFieldProps = {
  label: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Inclusive lower bound (Date or yyyy-mm-dd). Defaults to today. */
  minDate?: Date | string;
  /** Inclusive upper bound (Date or yyyy-mm-dd). Defaults to 90 days ahead. */
  maxDate?: Date | string;
};

function resolveBound(value: Date | string | undefined): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }
  return parseLocalDateInput(value) ?? undefined;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDisplayDate(value: string): string | null {
  const date = parseLocalDateInput(value);
  if (!date) return null;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Near-term schedule date picker — month label + prev/next navigation
 * (no year dropdowns). Use DateField for date of birth instead.
 */
export function ScheduleDateField({
  label,
  name,
  value,
  onChange,
  error,
  placeholder = "Select date",
  disabled,
  className,
  minDate,
  maxDate,
}: ScheduleDateFieldProps) {
  const [open, setOpen] = useState(false);
  const reactId = useId();
  const inputId = `${label.toLowerCase().replace(/\s+/g, "-")}-${reactId}`;
  const selectedDate = useMemo(
    () => parseLocalDateInput(value) ?? undefined,
    [value],
  );
  const displayValue = formatDisplayDate(value);

  const today = useMemo(() => startOfDay(new Date()), []);
  const min = useMemo(() => {
    const bound = resolveBound(minDate);
    return bound ? startOfDay(bound) : today;
  }, [minDate, today]);
  const max = useMemo(() => {
    const bound = resolveBound(maxDate);
    if (bound) return startOfDay(bound);
    const d = new Date(today);
    d.setDate(d.getDate() + 90);
    return d;
  }, [maxDate, today]);

  return (
    <Field
      data-invalid={!!error || undefined}
      data-disabled={disabled || undefined}
      className={className}
    >
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          render={
            <Button
              type="button"
              variant="outline"
              id={inputId}
              aria-invalid={!!error || undefined}
              aria-describedby={error ? `${inputId}-error` : undefined}
              className={cn(
                "h-11 w-full justify-start rounded-sm font-normal",
                !displayValue && "text-muted-foreground",
              )}
            >
              <Icon icon={faCalendarDays} data-icon="inline-start" />
              {displayValue ?? placeholder}
            </Button>
          }
        />
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            defaultMonth={selectedDate ?? min}
            captionLayout="label"
            startMonth={min}
            endMonth={max}
            disabled={[{ before: min }, { after: max }]}
            onSelect={(date) => {
              onChange(date ? toDateInputValue(date) : "");
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      <input type="hidden" name={name} value={value} disabled={disabled} />
      {error ? <FieldError id={`${inputId}-error`}>{error}</FieldError> : null}
    </Field>
  );
}

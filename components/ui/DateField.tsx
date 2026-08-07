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

type DateFieldProps = {
  label: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

function formatDisplayDate(value: string): string | null {
  const date = parseLocalDateInput(value);
  if (!date) return null;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Date of birth picker — year/month dropdowns for wide past range. */
export function DateField({
  label,
  name,
  value,
  onChange,
  error,
  placeholder = "Select date",
  disabled,
  className,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const reactId = useId();
  const inputId = `${label.toLowerCase().replace(/\s+/g, "-")}-${reactId}`;
  const selectedDate = useMemo(
    () => parseLocalDateInput(value) ?? undefined,
    [value],
  );
  const displayValue = formatDisplayDate(value);
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const startMonth = useMemo(
    () => new Date(today.getFullYear() - 150, 0),
    [today],
  );

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
            defaultMonth={selectedDate ?? today}
            captionLayout="dropdown"
            startMonth={startMonth}
            endMonth={today}
            disabled={{ after: today }}
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

"use client";

import { NumberWheel } from "@/components/ui/NumberWheel";
import { Field, FieldError, FieldLabel } from "@/components/ui/shadcn/field";
import { cn } from "@/lib/utils";

const MIN_AGE = 0;
const MAX_AGE = 150;
/** Visual starting position when age is unset. */
const DEFAULT_AGE = 35;

type AgeFieldProps = {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
};

export function AgeField({
  name = "age",
  value,
  onChange,
  error,
  disabled,
}: AgeFieldProps) {
  const hasValue = value.trim() !== "";
  const numericValue = hasValue
    ? Math.min(MAX_AGE, Math.max(MIN_AGE, Number(value) || DEFAULT_AGE))
    : DEFAULT_AGE;

  return (
    <Field
      data-invalid={!!error || undefined}
      data-disabled={disabled || undefined}
      className={cn(disabled && "opacity-60")}
    >
      <FieldLabel>Age (if DOB unknown)</FieldLabel>
      <NumberWheel
        min={MIN_AGE}
        max={MAX_AGE}
        value={numericValue}
        onChange={(next) => onChange(String(next))}
        disabled={disabled}
        suffix="y"
        aria-label="Age in years"
      />
      {!hasValue && !disabled ? (
        <p className="text-xs text-muted-foreground">
          Scroll sideways to pick age
        </p>
      ) : null}
      <input type="hidden" name={name} value={value} disabled={disabled} />
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}

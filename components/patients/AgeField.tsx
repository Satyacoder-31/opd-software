"use client";

import { NumberWheel } from "@/components/ui/NumberWheel";
import { Field, FieldError, FieldLabel } from "@/components/ui/shadcn/field";
import { cn } from "@/lib/utils";

const MIN_AGE = 0;
const MAX_AGE = 150;

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
    ? Math.min(MAX_AGE, Math.max(MIN_AGE, Number(value) || MIN_AGE))
    : null;

  return (
    <Field
      data-invalid={!!error || undefined}
      data-disabled={disabled || undefined}
      className={cn(disabled && "opacity-60")}
    >
      <FieldLabel className="mb-2">Age (if DOB unknown)</FieldLabel>
      <NumberWheel
        min={MIN_AGE}
        max={MAX_AGE}
        value={numericValue}
        onChange={(next) => onChange(String(next))}
        disabled={disabled}
        suffix="yrs"
        className="mx-auto w-full max-w-28"
      />
      {!hasValue ? (
        <p className="text-center text-xs text-muted-foreground">
          Scroll to pick age
        </p>
      ) : null}
      <input type="hidden" name={name} value={value} disabled={disabled} />
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}

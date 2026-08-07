"use client";

import {
  Field,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/shadcn/field";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/shadcn/radio-group";
import { cn } from "@/lib/utils";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

type GenderFieldProps = {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
};

export function GenderField({
  name = "gender",
  value,
  onChange,
  error,
  disabled,
  className,
}: GenderFieldProps) {
  const errorId = "gender-error";

  return (
    <Field
      data-invalid={!!error || undefined}
      data-disabled={disabled || undefined}
      className={className}
    >
      <FieldSet className="gap-2.5">
        <FieldLegend variant="label">Gender</FieldLegend>
        <RadioGroup
          name={name}
          value={value || undefined}
          disabled={disabled}
          onValueChange={(next) => onChange(next ?? "")}
          className="flex flex-wrap gap-x-5 gap-y-2"
          aria-invalid={!!error || undefined}
          aria-describedby={error ? errorId : undefined}
        >
          {GENDER_OPTIONS.map((option) => {
            const id = `gender-${option.value}`;
            return (
              <Field
                key={option.value}
                orientation="horizontal"
                className="w-auto items-center gap-2"
              >
                <RadioGroupItem
                  id={id}
                  value={option.value}
                  aria-invalid={!!error || undefined}
                />
                <FieldLabel
                  htmlFor={id}
                  className={cn(
                    "font-normal text-ink",
                    disabled && "pointer-events-none opacity-50"
                  )}
                >
                  {option.label}
                </FieldLabel>
              </Field>
            );
          })}
        </RadioGroup>
      </FieldSet>
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </Field>
  );
}

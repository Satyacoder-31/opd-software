"use client";

import {
  Select as SelectRoot,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import { Field, FieldError, FieldLabel } from "@/components/ui/shadcn/field";
import { cn } from "@/lib/utils";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

const CLEAR_VALUE = "__clear__";

const GENDER_ITEMS = [
  { value: CLEAR_VALUE, label: "Select…" },
  ...GENDER_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  })),
];

const GENDER_TRIGGER_CLASS = "h-11 w-full px-3.5";
const GENDER_OPTION_CLASS = "py-2.5 pl-3 pr-9";

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
  const inputId = "gender";

  return (
    <Field
      data-invalid={!!error || undefined}
      data-disabled={disabled || undefined}
      className={className}
    >
      <FieldLabel htmlFor={inputId}>Gender</FieldLabel>
      <SelectRoot
        name={name}
        value={value || null}
        disabled={disabled}
        items={GENDER_ITEMS}
        onValueChange={(nextValue) => {
          onChange(
            nextValue === CLEAR_VALUE || nextValue == null ? "" : nextValue
          );
        }}
      >
        <SelectTrigger
          id={inputId}
          className={cn(GENDER_TRIGGER_CLASS)}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
        >
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent align="start" className="p-1.5">
          <SelectGroup className="p-0">
            <SelectItem value={CLEAR_VALUE} className={GENDER_OPTION_CLASS}>
              Select…
            </SelectItem>
            {GENDER_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className={GENDER_OPTION_CLASS}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </SelectRoot>
      {error ? <FieldError id={`${inputId}-error`}>{error}</FieldError> : null}
    </Field>
  );
}

"use client";

import {
  Select as SelectRoot,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/shadcn/field";
import { cn } from "@/lib/utils";

type SelectProps = {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
};

export function Select({
  label,
  options,
  error,
  name,
  value = "",
  onChange,
  className,
  id,
  disabled,
  required,
}: SelectProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <Field data-invalid={!!error || undefined}>
      <FieldLabel htmlFor={selectId}>{label}</FieldLabel>
      <SelectRoot
        name={name}
        value={value || null}
        disabled={disabled}
        required={required}
        onValueChange={(nextValue) => {
          onChange?.({
            target: { name: name ?? "", value: nextValue ?? "" },
          } as React.ChangeEvent<HTMLSelectElement>);
        }}
      >
        <SelectTrigger
          id={selectId}
          className={cn("h-11 w-full", className)}
          aria-invalid={!!error || undefined}
        >
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options
              .filter((opt) => opt.value !== "")
              .map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
          </SelectGroup>
        </SelectContent>
      </SelectRoot>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}

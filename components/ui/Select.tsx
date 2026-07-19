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
  optionClassName?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
};

const CLEAR_VALUE = "__clear__";

export function Select({
  label,
  options,
  error,
  name,
  value = "",
  onChange,
  className,
  optionClassName,
  id,
  disabled,
  required,
  allowClear = true,
  clearLabel = "Select…",
}: SelectProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const hasEmptyOption = options.some((opt) => opt.value === "");
  const showClear = allowClear && (hasEmptyOption || !required);

  return (
    <Field data-invalid={!!error || undefined}>
      <FieldLabel htmlFor={selectId}>{label}</FieldLabel>
      <SelectRoot
        name={name}
        value={value || null}
        disabled={disabled}
        required={required}
        onValueChange={(nextValue) => {
          const resolved =
            nextValue === CLEAR_VALUE || nextValue == null ? "" : nextValue;
          onChange?.({
            target: { name: name ?? "", value: resolved },
          } as React.ChangeEvent<HTMLSelectElement>);
        }}
      >
        <SelectTrigger
          id={selectId}
          className={cn("h-11 w-full", className)}
          aria-invalid={!!error || undefined}
        >
          <SelectValue placeholder={clearLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {showClear && (
              <SelectItem value={CLEAR_VALUE} className={optionClassName}>
                {options.find((opt) => opt.value === "")?.label ?? clearLabel}
              </SelectItem>
            )}
            {options
              .filter((opt) => opt.value !== "")
              .map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className={optionClassName}
                >
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

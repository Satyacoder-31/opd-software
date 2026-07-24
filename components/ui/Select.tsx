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
  /** Visually hide the label while keeping it available to assistive tech. */
  hideLabel?: boolean;
};

const CLEAR_VALUE = "__clear__";
const SELECT_TRIGGER_CLASS =
  "h-11 min-h-11 w-full px-3.5 py-2.5 data-[size=default]:h-11";
const SELECT_OPTION_CLASS = "py-2.5 pl-3 pr-9";

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
  hideLabel = false,
}: SelectProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const hasEmptyOption = options.some((opt) => opt.value === "");
  const showClear = allowClear && (hasEmptyOption || !required);
  const clearOptionLabel =
    options.find((opt) => opt.value === "")?.label ?? clearLabel;
  // Base UI Select.Value shows the raw value unless `items` maps value → label.
  const items = [
    ...(showClear ? [{ value: CLEAR_VALUE, label: clearOptionLabel }] : []),
    ...options
      .filter((opt) => opt.value !== "")
      .map((opt) => ({ value: opt.value, label: opt.label })),
  ];

  return (
    <Field data-invalid={!!error || undefined}>
      <FieldLabel htmlFor={selectId} className={hideLabel ? "sr-only" : undefined}>
        {label}
      </FieldLabel>
      <SelectRoot
        name={name}
        value={value || null}
        disabled={disabled}
        required={required}
        items={items}
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
          className={cn(SELECT_TRIGGER_CLASS, className)}
          aria-invalid={!!error || undefined}
        >
          <SelectValue placeholder={clearLabel} />
        </SelectTrigger>
        <SelectContent align="start" className="p-1.5">
          <SelectGroup className="p-0">
            {showClear && (
              <SelectItem
                value={CLEAR_VALUE}
                className={cn(SELECT_OPTION_CLASS, optionClassName)}
              >
                {clearOptionLabel}
              </SelectItem>
            )}
            {options
              .filter((opt) => opt.value !== "")
              .map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className={cn(SELECT_OPTION_CLASS, optionClassName)}
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

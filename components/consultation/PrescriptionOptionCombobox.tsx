"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Field, FieldLabel } from "@/components/ui/shadcn/field";
import { Input } from "@/components/ui/shadcn/input";
import { cn } from "@/lib/utils";

type PrescriptionOptionComboboxProps = {
  label: string;
  name: string;
  value: string;
  options: readonly string[];
  placeholder: string;
  className?: string;
  onChange: (value: string) => void;
};

export function PrescriptionOptionCombobox({
  label,
  name,
  value,
  options,
  placeholder,
  className,
  onChange,
}: PrescriptionOptionComboboxProps) {
  const generatedId = useId();
  const inputId = `${generatedId}-input`;
  const listboxId = `${generatedId}-listbox`;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const matches = useMemo(() => {
    const query = value.trim().toLocaleLowerCase();
    if (!query) return options;
    return options.filter((option) =>
      option.toLocaleLowerCase().includes(query)
    );
  }, [options, value]);

  useEffect(() => {
    setActiveIndex(0);
  }, [value]);

  function selectOption(option: string) {
    onChange(option);
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) =>
        matches.length ? (current + 1) % matches.length : 0
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) =>
        matches.length
          ? (current - 1 + matches.length) % matches.length
          : 0
      );
      return;
    }

    if (event.key === "Enter" && open && matches[activeIndex]) {
      event.preventDefault();
      selectOption(matches[activeIndex]);
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const activeOptionId =
    open && matches[activeIndex]
      ? `${listboxId}-option-${activeIndex}`
      : undefined;

  return (
    <Field className={className}>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <div className={cn("relative", open && "z-50")}>
        <Input
          id={inputId}
          name={name}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          className="h-11"
        />

        {open && (
          <div
            id={listboxId}
            role="listbox"
            aria-label={`${label} suggestions`}
            className="absolute inset-x-0 top-[calc(100%+0.25rem)] z-50 max-h-72 overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg"
          >
            {matches.length > 0 ? (
              matches.map((option, index) => (
                <button
                  key={option}
                  id={`${listboxId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  tabIndex={-1}
                  className={cn(
                    "flex w-full rounded-md px-3 py-2 text-left text-sm",
                    index === activeIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                  onPointerDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option)}
                >
                  {option}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                No match — your entry will be saved as entered.
              </p>
            )}
          </div>
        )}
      </div>
    </Field>
  );
}

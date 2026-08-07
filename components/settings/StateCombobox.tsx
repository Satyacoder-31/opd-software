"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Field, FieldLabel } from "@/components/ui/shadcn/field";
import { Input } from "@/components/ui/shadcn/input";
import { INDIAN_STATES } from "@/lib/indian-states";
import { cn } from "@/lib/utils";

type StateComboboxProps = {
  label?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  error?: string;
};

export function StateCombobox({
  label = "State",
  name = "state",
  value,
  onChange,
  placeholder = "Search state…",
  className,
  required,
  error,
}: StateComboboxProps) {
  const generatedId = useId();
  const inputId = `${generatedId}-input`;
  const listboxId = `${generatedId}-listbox`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const options = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    if (!q) return [...INDIAN_STATES];
    return INDIAN_STATES.filter((s) => s.toLocaleLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function selectState(state: string) {
    onChange(state);
    setQuery(state);
    setOpen(false);
  }

  function clearState() {
    onChange("");
    setQuery("");
    setOpen(false);
  }

  function handleBlur() {
    setQuery(value);
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) =>
        options.length ? (current + 1) % options.length : 0,
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) =>
        options.length ? (current - 1 + options.length) % options.length : 0,
      );
      return;
    }
    if (event.key === "Enter" && open && options[activeIndex]) {
      event.preventDefault();
      selectState(options[activeIndex]);
      return;
    }
    if (event.key === "Escape") {
      setQuery(value);
      setOpen(false);
    }
  }

  const activeOptionId =
    open && options[activeIndex]
      ? `${listboxId}-option-${activeIndex}`
      : undefined;

  return (
    <Field data-invalid={!!error || undefined}>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <div className={cn("relative", open && "z-50")}>
        <input type="hidden" name={name} value={value} />
        <Input
          id={inputId}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          aria-required={required}
          aria-invalid={!!error || undefined}
          className={cn("h-11", className)}
        />

        {open ? (
          <div
            id={listboxId}
            role="listbox"
            aria-label="State suggestions"
            className="absolute inset-x-0 top-[calc(100%+0.25rem)] z-50 max-h-72 overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg"
          >
            {value ? (
              <button
                type="button"
                tabIndex={-1}
                className="flex w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                onPointerDown={(event) => event.preventDefault()}
                onClick={clearState}
              >
                Clear state
              </button>
            ) : null}
            {options.length > 0 ? (
              options.map((state, index) => (
                <button
                  key={state}
                  id={`${listboxId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={state === value || index === activeIndex}
                  tabIndex={-1}
                  className={cn(
                    "flex w-full rounded-md px-3 py-2 text-left text-sm",
                    index === activeIndex || state === value
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent hover:text-accent-foreground",
                  )}
                  onPointerDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectState(state)}
                >
                  {state}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                No states match.
              </p>
            )}
          </div>
        ) : null}
      </div>
      {error ? (
        <p className="mt-1 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </Field>
  );
}

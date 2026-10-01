"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import { Field, FieldLabel } from "@/components/ui/shadcn/field";
import { Input } from "@/components/ui/shadcn/input";
import { cn } from "@/lib/utils";

type ClinicalDropdownInputProps = {
  label: string;
  name: string;
  value: string;
  options: readonly string[];
  placeholder?: string;
  className?: string;
  onChange: (value: string) => void;
};

export function ClinicalDropdownInput({
  label,
  name,
  value,
  options,
  placeholder,
  className,
  onChange,
}: ClinicalDropdownInputProps) {
  const generatedId = useId();
  const inputId = `${generatedId}-input`;
  const listboxId = `${generatedId}-listbox`;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) =>
      option.toLowerCase().includes(query)
    );
  }, [options, value]);

  useEffect(() => {
    setActiveIndex(0);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      <div className="flex items-center justify-between pb-1">
        <FieldLabel htmlFor={inputId} className="text-xs font-semibold text-ink sm:text-xs">
          {label}
        </FieldLabel>
        {value.trim().length > 0 && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs font-medium text-muted-foreground hover:text-danger transition-colors px-1"
            title={`Clear ${label}`}
          >
            Clear
          </button>
        )}
      </div>

      <div ref={containerRef} className={cn("relative", open && "z-50")}>
        <div className="relative">
          <Input
            id={inputId}
            name={name}
            value={value}
            onChange={(event) => {
              onChange(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-activedescendant={activeOptionId}
            className="h-10 pr-8 text-sm"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setOpen((prev) => !prev)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink transition-colors"
            aria-label="Toggle options"
          >
            <Icon icon={open ? faChevronUp : faChevronDown} className="size-3" />
          </button>
        </div>

        {open && (
          <div
            id={listboxId}
            role="listbox"
            aria-label={`${label} recommendations`}
            className="absolute inset-x-0 top-[calc(100%+0.25rem)] z-50 max-h-56 overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-xl ring-1 ring-border"
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
                    "flex w-full rounded-md px-3 py-1.5 text-left text-xs sm:text-sm transition-colors",
                    index === activeIndex
                      ? "bg-accent text-accent-foreground font-medium"
                      : "hover:bg-accent/70 hover:text-accent-foreground"
                  )}
                  onPointerDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option)}
                >
                  {option}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                No match — your text will be saved as entered.
              </p>
            )}
          </div>
        )}
      </div>
    </Field>
  );
}

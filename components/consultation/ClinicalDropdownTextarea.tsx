"use client";

import { useId, useMemo, useRef, useState, useEffect } from "react";
import {
  faChevronDown,
  faChevronUp,
  faMagnifyingGlass,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Icon } from "@/components/ui/Icon";
import { Field, FieldLabel } from "@/components/ui/shadcn/field";
import { Textarea as ShadcnTextarea } from "@/components/ui/shadcn/textarea";
import { cn } from "@/lib/utils";

type ClinicalDropdownTextareaProps = {
  label: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  rows?: number;
  className?: string;
  icon?: IconDefinition;
};

export function ClinicalDropdownTextarea({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  rows = 2,
  className,
  icon,
}: ClinicalDropdownTextareaProps) {
  const generatedId = useId();
  const textareaId = `${generatedId}-textarea`;
  const [open, setOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

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

  const filteredOptions = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.toLowerCase().includes(q));
  }, [options, filterQuery]);

  function handleSelect(option: string, mode: "append" | "replace" = "append") {
    if (!value.trim() || mode === "replace") {
      onChange(option);
    } else {
      const trimmed = value.trim();
      if (trimmed.endsWith(",") || trimmed.endsWith(";") || trimmed.endsWith(".")) {
        onChange(`${trimmed} ${option}`);
      } else if (trimmed.includes("\n") || option.length > 50) {
        onChange(`${trimmed}\n• ${option}`);
      } else {
        onChange(`${trimmed}, ${option}`);
      }
    }
    setOpen(false);
    setFilterQuery("");
  }

  return (
    <Field className={className}>
      {/* Header bar: Icon + Label on left, Clear button + Dropdown Menu on right */}
      <div className="flex items-center justify-between gap-2 pb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {icon && (
            <Icon
              icon={icon}
              className="size-3.5 text-muted-foreground shrink-0"
              aria-hidden
            />
          )}
          <FieldLabel
            htmlFor={textareaId}
            className="text-xs font-semibold text-ink sm:text-xs"
          >
            {label}
          </FieldLabel>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Apollo EMR-style Clear button */}
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

          {/* Clean Dropdown Menu trigger */}
          {options.length > 0 && (
            <div className="relative" ref={containerRef}>
              <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-ink transition-colors",
                  "hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
                  open && "border-primary ring-1 ring-primary bg-primary/5 text-primary"
                )}
                aria-expanded={open}
              >
                <span>Select recommendation</span>
                <Icon
                  icon={open ? faChevronUp : faChevronDown}
                  className="size-2.5 text-muted-foreground"
                />
              </button>

              {/* Floating Dropdown Menu Panel */}
              {open && (
                <div
                  className="absolute right-0 top-[calc(100%+0.25rem)] z-50 w-72 sm:w-96 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-xl ring-1 ring-border"
                  role="region"
                  aria-label={`${label} recommendations`}
                >
                  {/* Search input in dropdown */}
                  <div className="relative mb-2">
                    <Icon
                      icon={faMagnifyingGlass}
                      className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      type="text"
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      placeholder={`Search ${label.toLowerCase()}…`}
                      className="h-7 w-full rounded border border-border bg-card pl-7 pr-6 text-xs text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                    />
                    {filterQuery && (
                      <button
                        type="button"
                        onClick={() => setFilterQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink"
                      >
                        <Icon icon={faXmark} className="size-2.5" />
                      </button>
                    )}
                  </div>

                  {/* Scrollable recommendations list */}
                  <ul className="max-h-56 space-y-0.5 overflow-y-auto pr-0.5">
                    {filteredOptions.length > 0 ? (
                      filteredOptions.map((opt, idx) => (
                        <li key={idx}>
                          <button
                            type="button"
                            onClick={() => handleSelect(opt, "append")}
                            className="flex w-full items-start justify-between rounded px-2 py-1.5 text-left text-xs text-ink hover:bg-accent hover:text-accent-foreground transition-colors group"
                          >
                            <span className="line-clamp-2 leading-relaxed">{opt}</span>
                            <span className="ml-2 shrink-0 text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                              + Insert
                            </span>
                          </button>
                        </li>
                      ))
                    ) : (
                      <li className="px-2 py-3 text-center text-xs text-muted-foreground">
                        No match found.
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Clean, undisturbed textarea without bottom pills */}
      <ShadcnTextarea
        id={textareaId}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="min-h-14 text-sm leading-relaxed"
      />
    </Field>
  );
}

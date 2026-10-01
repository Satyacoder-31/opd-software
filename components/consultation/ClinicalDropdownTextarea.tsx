"use client";

import { useId, useMemo, useRef, useState, useEffect } from "react";
import {
  faChevronDown,
  faChevronUp,
  faLightbulb,
  faMagnifyingGlass,
  faPlus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
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
  chipsCount?: number;
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
  chipsCount = 3,
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

  const quickChips = useMemo(() => {
    return options.slice(0, chipsCount);
  }, [options, chipsCount]);

  function handleSelectOption(option: string, mode: "replace" | "append" = "append") {
    if (!value.trim() || mode === "replace") {
      onChange(option);
    } else {
      // Clean append logic
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
  }

  return (
    <Field className={className}>
      <div className="flex flex-wrap items-center justify-between gap-1">
        <FieldLabel htmlFor={textareaId}>{label}</FieldLabel>

        {options.length > 0 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors",
                open
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/10 text-primary hover:bg-primary/15"
              )}
              aria-expanded={open}
            >
              <Icon icon={faLightbulb} className="size-2.5" />
              <span>Recommendations ({options.length})</span>
              <Icon
                icon={open ? faChevronUp : faChevronDown}
                className="size-2.5"
              />
            </button>
          </div>
        )}
      </div>

      <div ref={containerRef} className="relative">
        <ShadcnTextarea
          id={textareaId}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="min-h-14 text-sm"
        />

        {/* Dropdown Recommendations Modal / Floating Panel */}
        {open && (
          <div
            className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-50 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-xl ring-1 ring-border"
            role="region"
            aria-label={`${label} recommendations`}
          >
            {/* Search filter in dropdown */}
            <div className="relative mb-2">
              <Icon
                icon={faMagnifyingGlass}
                className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()} recommendations…`}
                className="h-7 w-full rounded-md border border-border bg-card pl-7 pr-6 text-xs text-ink placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
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

            {/* Recommendations scrollable list */}
            <ul className="max-h-56 space-y-1 overflow-y-auto pr-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => (
                  <li
                    key={idx}
                    className="group flex items-start justify-between gap-2 rounded-md p-1.5 text-xs transition-colors hover:bg-accent"
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectOption(opt, "append")}
                      className="min-w-0 flex-1 text-left text-ink group-hover:text-accent-foreground"
                      title="Click to insert into notes"
                    >
                      {opt}
                    </button>
                    <div className="flex shrink-0 items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => handleSelectOption(opt, "replace")}
                        className="rounded px-1 py-0.5 text-[10px] text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        title="Replace entire field with this"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectOption(opt, "append")}
                        className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20"
                        title="Add to text"
                      >
                        + Insert
                      </button>
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-2 py-3 text-center text-xs text-muted-foreground">
                  No recommendations matching “{filterQuery}”.
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Quick 1-click suggestion pills beneath textarea */}
      {quickChips.length > 0 && (
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-muted-foreground">
            Quick:
          </span>
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectOption(chip, "append")}
              className="inline-flex max-w-[280px] items-center gap-1 truncate rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
              title={`Click to insert: "${chip}"`}
            >
              <Icon icon={faPlus} className="size-2 text-primary" />
              <span className="truncate">{chip}</span>
            </button>
          ))}
        </div>
      )}
    </Field>
  );
}

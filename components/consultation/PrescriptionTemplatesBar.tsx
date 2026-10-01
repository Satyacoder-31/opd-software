"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  faBookmark,
  faChevronDown,
  faChevronUp,
  faMagnifyingGlass,
  faPlus,
  faShieldHalved,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export type PrescriptionTemplateItem = {
  id: string;
  name: string;
  category?: string;
  illness?: string;
  description?: string;
  isBuiltIn?: boolean;
  medicineCount?: number;
};

type PrescriptionQuickTemplatesProps = {
  templates: PrescriptionTemplateItem[];
  onApply: (templateId: string, mode: "replace" | "append") => void;
  onDelete?: (templateId: string) => void;
  deleting?: boolean;
};

/** Top-of-tab picker with search & disease protocol categorization */
export function PrescriptionQuickTemplates({
  templates,
  onApply,
  onDelete,
  deleting = false,
}: PrescriptionQuickTemplatesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dropdownFiltered = useMemo(() => {
    const q = dropdownSearch.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.illness && t.illness.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q))
    );
  }, [templates, dropdownSearch]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const t of templates) {
      if (t.category) cats.add(t.category);
    }
    return Array.from(cats);
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return templates.filter((tpl) => {
      // Category filter
      if (selectedCategory === "builtin" && !tpl.isBuiltIn) return false;
      if (selectedCategory === "custom" && tpl.isBuiltIn) return false;
      if (
        selectedCategory !== "all" &&
        selectedCategory !== "builtin" &&
        selectedCategory !== "custom" &&
        tpl.category !== selectedCategory
      ) {
        return false;
      }

      // Search query
      if (!q) return true;
      return (
        tpl.name.toLowerCase().includes(q) ||
        (tpl.illness && tpl.illness.toLowerCase().includes(q)) ||
        (tpl.description && tpl.description.toLowerCase().includes(q)) ||
        (tpl.category && tpl.category.toLowerCase().includes(q))
      );
    });
  }, [templates, searchQuery, selectedCategory]);

  if (templates.length === 0) return null;

  return (
    <section
      aria-label="Prescription templates"
      className="border-b border-border bg-surface-muted/40 transition-colors"
    >
      {/* Header bar: Icon + Title on left, Clean Dropdown Menu on right */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 md:px-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
            aria-hidden
          >
            <Icon icon={faBookmark} className="size-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink sm:text-sm">
                Illness Protocols & Quick Regimens
              </h3>
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.2 text-[11px] font-medium text-muted-foreground">
                {templates.length}
              </span>
            </div>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Select standard condition regimens (e.g. Flu, Back Pain, GERD) and edit dosages as needed.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Clean Dropdown Menu Trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-ink transition-colors",
                "hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
                dropdownOpen && "border-primary ring-1 ring-primary bg-primary/5 text-primary"
              )}
              aria-expanded={dropdownOpen}
            >
              <span>Select standard regimen</span>
              <Icon
                icon={dropdownOpen ? faChevronUp : faChevronDown}
                className="size-2.5 text-muted-foreground"
              />
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 top-[calc(100%+0.25rem)] z-50 w-80 sm:w-96 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-xl ring-1 ring-border"
                role="region"
                aria-label="Prescription regimens"
              >
                <div className="relative mb-2">
                  <Icon
                    icon={faMagnifyingGlass}
                    className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="text"
                    value={dropdownSearch}
                    onChange={(e) => setDropdownSearch(e.target.value)}
                    placeholder="Search regimens (flu, back pain, OA)…"
                    className="h-7 w-full rounded border border-border bg-card pl-7 pr-6 text-xs text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                  />
                  {dropdownSearch && (
                    <button
                      type="button"
                      onClick={() => setDropdownSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink"
                    >
                      <Icon icon={faXmark} className="size-2.5" />
                    </button>
                  )}
                </div>

                <ul className="max-h-60 space-y-1 overflow-y-auto pr-0.5">
                  {dropdownFiltered.length > 0 ? (
                    dropdownFiltered.map((tpl) => (
                      <li
                        key={tpl.id}
                        className="group flex items-center justify-between gap-2 rounded-md p-1.5 text-xs transition-colors hover:bg-accent"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 font-medium text-ink group-hover:text-accent-foreground">
                            {tpl.isBuiltIn && (
                              <Icon
                                icon={faShieldHalved}
                                className="size-2.5 shrink-0 text-primary/70"
                              />
                            )}
                            <span className="truncate">{tpl.name}</span>
                          </div>
                          {tpl.illness && (
                            <span className="line-clamp-1 text-[11px] text-muted-foreground">
                              {tpl.illness} · {tpl.medicineCount ?? 0} meds
                            </span>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              onApply(tpl.id, "replace");
                              setDropdownOpen(false);
                            }}
                            className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20"
                            title="Load into prescription (replaces draft)"
                          >
                            Load
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onApply(tpl.id, "append");
                              setDropdownOpen(false);
                            }}
                            className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-ink"
                            title="Append medicines to prescription"
                          >
                            + Add
                          </button>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="px-2 py-3 text-center text-xs text-muted-foreground">
                      No regimens matching “{dropdownSearch}”.
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen((prev) => !prev)}
            className="h-8 gap-1.5 px-2 text-xs font-medium text-muted-foreground hover:text-ink"
            aria-expanded={isOpen}
          >
            <span>{isOpen ? "Hide cards" : "Browse all"}</span>
            <Icon icon={isOpen ? faChevronUp : faChevronDown} className="size-2.5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {isOpen && (
        <div className="border-t border-border/60 px-3 py-3 md:px-4 space-y-2.5">
          {/* Search bar & filter pills */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative min-w-48 flex-1 sm:max-w-xs">
              <Icon
                icon={faMagnifyingGlass}
                className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search flu, OA, back pain, GERD…"
                className="h-8 w-full rounded-md border border-border bg-card pl-8 pr-7 text-xs text-ink placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink"
                  aria-label="Clear search"
                >
                  <Icon icon={faXmark} className="size-3" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                  selectedCategory === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-ink"
                )}
              >
                All ({templates.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory("builtin")}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                  selectedCategory === "builtin"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-ink"
                )}
              >
                Common Illnesses
              </button>
              {templates.some((t) => !t.isBuiltIn) && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory("custom")}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                    selectedCategory === "custom"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-ink"
                  )}
                >
                  Custom Templates
                </button>
              )}
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "hidden rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors sm:inline-block",
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-ink"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Templates list */}
          {filteredTemplates.length === 0 ? (
            <p className="py-2 text-center text-xs text-muted-foreground">
              No prescription regimens found matching “{searchQuery}”.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {filteredTemplates.map((template) => (
                <li key={template.id} className="max-w-full">
                  <div
                    className={cn(
                      "inline-flex max-w-full items-stretch overflow-hidden rounded-lg border border-border bg-card",
                      "transition-all hover:border-primary/40 hover:shadow-xs",
                      template.isBuiltIn && "bg-card/90"
                    )}
                  >
                    {/* Primary apply button (Loads into draft for editing) */}
                    <button
                      type="button"
                      onClick={() => onApply(template.id, "replace")}
                      title={
                        template.description
                          ? `${template.name} — ${template.description}`
                          : `Load ${template.name} into prescription`
                      }
                      className={cn(
                        "flex min-w-0 items-center gap-1.5 px-3 py-1.5 text-left text-xs font-medium text-ink sm:text-sm",
                        "hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                      )}
                    >
                      {template.isBuiltIn && (
                        <Icon
                          icon={faShieldHalved}
                          className="size-3 shrink-0 text-primary/70"
                          title="Standard clinical regimen"
                        />
                      )}
                      <span className="truncate">{template.name}</span>
                      {typeof template.medicineCount === "number" && (
                        <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                          · {template.medicineCount} {template.medicineCount === 1 ? "med" : "meds"}
                        </span>
                      )}
                    </button>

                    {/* Append button */}
                    <button
                      type="button"
                      aria-label={`Append template ${template.name}`}
                      title="Append medicines to existing prescription"
                      onClick={() => onApply(template.id, "append")}
                      className={cn(
                        "shrink-0 border-l border-border px-2 text-muted-foreground",
                        "hover:bg-primary/5 hover:text-primary",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                      )}
                    >
                      <Icon icon={faPlus} className="size-3" aria-hidden />
                    </button>

                    {/* Delete button (only for custom templates) */}
                    {!template.isBuiltIn && onDelete && (
                      <button
                        type="button"
                        aria-label={`Delete template ${template.name}`}
                        disabled={deleting}
                        onClick={() => onDelete(template.id)}
                        className={cn(
                          "shrink-0 border-l border-border px-2 text-muted-foreground",
                          "hover:bg-danger/5 hover:text-danger",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                          "disabled:opacity-50"
                        )}
                      >
                        <Icon icon={faTrash} className="size-3" aria-hidden />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

type PrescriptionSaveTemplateFormProps = {
  templateName: string;
  onTemplateNameChange: (value: string) => void;
  onSave: () => void;
  saving?: boolean;
  className?: string;
};

/** Persist the current prescription as a reusable template. */
export function PrescriptionSaveTemplateForm({
  templateName,
  onTemplateNameChange,
  onSave,
  saving = false,
  className,
}: PrescriptionSaveTemplateFormProps) {
  const canSave = templateName.trim().length > 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-end",
        className
      )}
    >
      <Input
        label="Save this prescription as a template"
        name="templateName"
        value={templateName}
        onChange={(event) => onTemplateNameChange(event.target.value)}
        placeholder="e.g. Adult upper respiratory infection"
        className="min-w-0 flex-1"
        onKeyDown={(event) => {
          if (event.key === "Enter" && canSave && !saving) {
            event.preventDefault();
            onSave();
          }
        }}
      />
      <Button
        type="button"
        variant="secondary"
        onClick={onSave}
        loading={saving}
        disabled={!canSave}
        className="shrink-0 sm:mb-0"
      >
        Save as template
      </Button>
    </div>
  );
}

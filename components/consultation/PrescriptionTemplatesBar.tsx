"use client";

import { useMemo, useState } from "react";
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
  const [isOpen, setIsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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
      {/* Header bar */}
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

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen((prev) => !prev)}
          className="h-8 gap-1.5 px-2.5 text-xs font-medium text-ink"
          aria-expanded={isOpen}
        >
          <span>{isOpen ? "Collapse regimens" : "Browse regimens"}</span>
          <Icon icon={isOpen ? faChevronUp : faChevronDown} className="size-3 text-muted-foreground" />
        </Button>
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

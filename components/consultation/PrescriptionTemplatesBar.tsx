"use client";

import {
  faBookmark,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export type PrescriptionTemplateItem = {
  id: string;
  name: string;
  medicineCount?: number;
};

type PrescriptionQuickTemplatesProps = {
  templates: PrescriptionTemplateItem[];
  onApply: (templateId: string, mode: "replace" | "append") => void;
  onDelete: (templateId: string) => void;
  deleting?: boolean;
};

/** Top-of-tab picker — only render when templates exist. */
export function PrescriptionQuickTemplates({
  templates,
  onApply,
  onDelete,
  deleting = false,
}: PrescriptionQuickTemplatesProps) {
  if (templates.length === 0) return null;

  return (
    <section
      aria-label="Prescription templates"
      className="border-b border-border bg-surface-muted/50 px-3 py-3 md:px-4"
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
          aria-hidden
        >
          <Icon icon={faBookmark} className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-ink">Quick templates</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Apply a saved regimen, or add its medicines to the current prescription.
          </p>
        </div>
      </div>

      <ul className="mt-3 flex flex-wrap gap-2">
        {templates.map((template) => (
          <li key={template.id}>
            <div
              className={cn(
                "inline-flex max-w-full items-stretch overflow-hidden rounded-lg border border-border bg-card",
                "transition-colors hover:border-primary/40"
              )}
            >
              <button
                type="button"
                onClick={() => onApply(template.id, "replace")}
                title="Replace current prescription"
                className={cn(
                  "min-w-0 truncate px-3 py-2 text-left text-sm font-medium text-ink",
                  "hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                )}
              >
                {template.name}
                {typeof template.medicineCount === "number" ? (
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    · {template.medicineCount}
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                aria-label={`Append template ${template.name}`}
                title="Append medicines"
                onClick={() => onApply(template.id, "append")}
                className={cn(
                  "shrink-0 border-l border-border px-2 text-muted-foreground",
                  "hover:bg-primary/5 hover:text-primary",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                )}
              >
                <Icon icon={faPlus} className="size-3.5" aria-hidden />
              </button>
              <button
                type="button"
                aria-label={`Delete template ${template.name}`}
                disabled={deleting}
                onClick={() => onDelete(template.id)}
                className={cn(
                  "shrink-0 border-l border-border px-2.5 text-muted-foreground",
                  "hover:bg-danger/5 hover:text-danger",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                  "disabled:opacity-50"
                )}
              >
                <Icon icon={faTrash} className="size-3.5" aria-hidden />
              </button>
            </div>
          </li>
        ))}
      </ul>
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

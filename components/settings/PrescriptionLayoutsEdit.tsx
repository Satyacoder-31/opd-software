"use client";

import { faCheck, faDownload } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  previewPrescriptionLayout,
  setPrescriptionLayout,
} from "@/actions/prescriptions";
import {
  LayoutMiniPreview,
  structureSummary,
} from "@/components/settings/PrescriptionLayoutPreview";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { usePendingAction } from "@/hooks/usePendingAction";
import {
  PRESCRIPTION_LAYOUTS,
  resolvePrescriptionLayout,
  type PrescriptionLayoutId,
} from "@/lib/prescription-layouts";
import { cn, downloadBase64Pdf } from "@/lib/utils";

type PrescriptionLayoutsEditProps = {
  currentLayout: string;
};

export function PrescriptionLayoutsEdit({
  currentLayout,
}: PrescriptionLayoutsEditProps) {
  const router = useRouter();
  const resolvedCurrent = resolvePrescriptionLayout(currentLayout).id;
  const [selected, setSelected] = useState<PrescriptionLayoutId>(resolvedCurrent);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const { isPending, run } = usePendingAction<"save" | `preview:${string}`>();
  const saving = isPending("save");

  function handleSelect(id: PrescriptionLayoutId) {
    if (id === selected || saving) return;
    const previous = selected;
    setSelected(id);
    setMessage(null);
    void run(async () => {
      const result = await setPrescriptionLayout(id);
      if (!result.success) {
        setSelected(previous);
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMessage({
        type: "success",
        text: `“${resolvePrescriptionLayout(id).name}” is now your clinic prescription layout.`,
      });
      router.push("/settings/prescriptions");
      router.refresh();
    }, "save");
  }

  function handlePreview(id: PrescriptionLayoutId) {
    setMessage(null);
    void run(async () => {
      const result = await previewPrescriptionLayout(id);
      if (!result.success) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      downloadBase64Pdf(result.data.pdfBase64, result.data.filename);
    }, `preview:${id}`);
  }

  return (
    <>
      {message ? (
        <Banner variant={message.type === "success" ? "success" : "error"}>
          {message.text}
        </Banner>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PRESCRIPTION_LAYOUTS.map((layout) => {
          const isSelected = selected === layout.id;
          const isActive = resolvedCurrent === layout.id;

          return (
            <div
              key={layout.id}
              className={cn(
                "flex flex-col overflow-hidden rounded-xl border bg-card text-left transition-shadow duration-150",
                isSelected
                  ? "border-primary shadow-md ring-1 ring-primary/30"
                  : "border-border",
                !isSelected && "hover:border-primary/40 hover:shadow-sm",
                saving && !isSelected && "opacity-60"
              )}
            >
              <button
                type="button"
                onClick={() => handleSelect(layout.id)}
                aria-pressed={isSelected}
                disabled={saving}
                className="group flex flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary disabled:cursor-wait"
              >
                <div className="bg-muted/40 p-3">
                  <LayoutMiniPreview layout={layout} />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-base font-semibold text-ink">
                          {layout.name}
                        </h2>
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            <Icon icon={faCheck} className="size-3" aria-hidden />
                            Active
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {layout.description}
                      </p>
                    </div>
                    <span
                      aria-hidden
                      className={cn(
                        "mt-1 inline-flex size-4 shrink-0 items-center justify-center rounded-full border",
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-border bg-transparent"
                      )}
                    >
                      {isSelected ? (
                        <Icon
                          icon={faCheck}
                          className="size-2.5 text-primary-foreground"
                        />
                      ) : null}
                    </span>
                  </div>

                  <div className="mt-1 space-y-1.5">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Print structure
                    </p>
                    <ul className="space-y-1">
                      {structureSummary(layout).map((line) => (
                        <li
                          key={line}
                          className="flex items-start gap-1.5 text-xs text-ink/80"
                        >
                          <span
                            className="mt-1.5 size-1 shrink-0 rounded-full"
                            style={{ backgroundColor: layout.colors.accent }}
                            aria-hidden
                          />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="pt-0.5 text-[11px] text-muted-foreground">
                      {layout.font === "Times-Roman" ? "Serif type" : "Sans type"}
                      {" · "}
                      theme tint on accent & fills
                    </p>
                  </div>
                </div>
              </button>

              <div className="px-4 pb-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="min-h-9 w-full sm:w-auto"
                  loading={isPending(`preview:${layout.id}`)}
                  onClick={() => handlePreview(layout.id)}
                >
                  <Icon icon={faDownload} data-icon="inline-start" />
                  Preview PDF
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

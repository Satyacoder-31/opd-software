"use client";

import { faCheck, faDownload } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { previewPrescriptionLayout } from "@/actions/prescriptions";
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
import { downloadBase64Pdf } from "@/lib/utils";

type PrescriptionLayoutsViewProps = {
  currentLayout: string;
};

export function PrescriptionLayoutsView({
  currentLayout,
}: PrescriptionLayoutsViewProps) {
  const resolvedCurrent = resolvePrescriptionLayout(currentLayout).id;
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const { isPending, run } = usePendingAction<`preview:${string}`>();
  const layouts = PRESCRIPTION_LAYOUTS.filter(
    (layout) => layout.id === resolvedCurrent
  );

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
        {layouts.map((layout) => (
          <div
            key={layout.id}
            className="flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition-shadow duration-150"
          >
            <div className="group flex flex-1 flex-col text-left">
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
                      <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        <Icon icon={faCheck} className="size-3" aria-hidden />
                        Active
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {layout.description}
                    </p>
                  </div>
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
            </div>

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
        ))}
      </div>
    </>
  );
}

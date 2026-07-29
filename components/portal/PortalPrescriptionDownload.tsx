"use client";

import { useState } from "react";
import { downloadPortalPrescription } from "@/actions/portal";
import { Button } from "@/components/ui/Button";

export function PortalPrescriptionDownload({
  consultationId,
}: {
  consultationId: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mt-3">
      {error ? <p className="mb-2 text-sm text-danger">{error}</p> : null}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        loading={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          const result = await downloadPortalPrescription(consultationId);
          setPending(false);
          if (!result.success) {
            setError(result.error);
            return;
          }
          const binary = atob(result.data.pdfBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
          const blob = new Blob([bytes], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = result.data.filename;
          anchor.click();
          URL.revokeObjectURL(url);
        }}
      >
        Download prescription PDF
      </Button>
    </div>
  );
}

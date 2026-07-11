"use client";

import { useState } from "react";
import Link from "next/link";
import { generatePrescriptionPdf } from "@/actions/prescriptions";
import { generateMedicalCertificatePdf } from "@/actions/consultations";
import { Button } from "@/components/ui/Button";
import { downloadBase64Pdf } from "@/lib/utils";
import { usePendingAction } from "@/hooks/usePendingAction";

type ConsultationDocumentActionsProps = {
  consultationId: string;
  hasPrescription: boolean;
  hasMedicalCertificate: boolean;
  showBillingLink?: boolean;
};

export function ConsultationDocumentActions({
  consultationId,
  hasPrescription,
  hasMedicalCertificate,
  showBillingLink = true,
}: ConsultationDocumentActionsProps) {
  const [error, setError] = useState<string | null>(null);
  const { isPending, run } = usePendingAction<"prescription" | "certificate">();

  function handlePrescriptionDownload() {
    setError(null);
    void run(async () => {
      const result = await generatePrescriptionPdf(consultationId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      downloadBase64Pdf(result.data.pdfBase64, result.data.filename);
    }, "prescription");
  }

  function handleCertificateDownload() {
    setError(null);
    void run(async () => {
      const result = await generateMedicalCertificatePdf(consultationId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      downloadBase64Pdf(result.data.pdfBase64, result.data.filename);
    }, "certificate");
  }

  if (!hasPrescription && !hasMedicalCertificate && !showBillingLink) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {hasPrescription && (
          <Button
            type="button"
            variant="secondary"
            onClick={handlePrescriptionDownload}
            loading={isPending("prescription")}
          >
            Download prescription
          </Button>
        )}
        {hasMedicalCertificate && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleCertificateDownload}
            loading={isPending("certificate")}
          >
            Download medical certificate
          </Button>
        )}
        {showBillingLink && (
          <Link href={`/billing/${consultationId}`}>
            <Button type="button" variant="secondary">
              Go to billing
            </Button>
          </Link>
        )}
      </div>
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

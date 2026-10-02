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
  const { isPending, run } = usePendingAction<
    "prescription" | "prescription-hi" | "certificate"
  >();

  function handlePrescriptionDownload(lang: "en" | "hi" = "en") {
    setError(null);
    const key = lang === "hi" ? "prescription-hi" : "prescription";
    void run(async () => {
      const result = await generatePrescriptionPdf(consultationId, lang);
      if (!result.success) {
        setError(result.error);
        return;
      }
      downloadBase64Pdf(result.data.pdfBase64, result.data.filename);
    }, key);
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
      <div className="flex flex-wrap items-center gap-2.5">
        {hasPrescription && (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handlePrescriptionDownload("en")}
              loading={isPending("prescription")}
              title="Download Prescription PDF (English)"
            >
              Download prescription
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handlePrescriptionDownload("hi")}
              loading={isPending("prescription-hi")}
              className="border-sky-300 text-sky-800 hover:bg-sky-50 font-medium"
              title="पर्चा डाउनलोड करें (Hindi Prescription PDF)"
            >
              पर्चा डाउनलोड (Hindi)
            </Button>
          </>
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

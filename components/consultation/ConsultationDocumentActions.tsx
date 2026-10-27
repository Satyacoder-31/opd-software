"use client";

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon as Icon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faFileContract,
  faDownload,
  faPrint,
} from "@fortawesome/free-solid-svg-icons";
import { generatePrescriptionPdf } from "@/actions/prescriptions";
import { generateMedicalCertificatePdf } from "@/actions/consultations";
import { Button } from "@/components/ui/Button";
import { downloadBase64Pdf } from "@/lib/utils";
import { usePendingAction } from "@/hooks/usePendingAction";
import { PrescriptionViewModal } from "@/components/consultation/PrescriptionViewModal";
import { PatientSummaryModal } from "@/components/consultation/PatientSummaryModal";

type ConsultationDocumentActionsProps = {
  consultationId: string;
  hasPrescription: boolean;
  hasMedicalCertificate: boolean;
  showBillingLink?: boolean;
  children?: React.ReactNode;
};

export function ConsultationDocumentActions({
  consultationId,
  hasPrescription,
  hasMedicalCertificate,
  showBillingLink = true,
  children,
}: ConsultationDocumentActionsProps) {
  const [error, setError] = useState<string | null>(null);
  const [isRxViewOpen, setIsRxViewOpen] = useState(false);
  const [isSummaryViewOpen, setIsSummaryViewOpen] = useState(false);
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

  if (!hasPrescription && !hasMedicalCertificate && !showBillingLink && !children) {
    return null;
  }

  return (
    <>
      {hasPrescription && (
        <>
          <Button
            type="button"
            variant="primary"
            onClick={() => setIsRxViewOpen(true)}
            className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5 shadow-xs"
            title="View full prescription on screen before printing or downloading"
          >
            <Icon icon={faEye} className="text-xs" />
            View prescription
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsSummaryViewOpen(true)}
            className="shrink-0 border-teal-300 text-teal-800 bg-teal-50/70 hover:bg-teal-100 font-semibold gap-1.5 shadow-2xs"
            title="View Apollo standard Outpatient Summary & Prescription"
          >
            <Icon icon={faFileContract} className="text-xs text-teal-600" />
            Outpatient summary
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handlePrescriptionDownload("en")}
            loading={isPending("prescription")}
            title="Download Prescription PDF (English)"
            className="shrink-0 gap-1.5"
          >
            <Icon icon={faDownload} className="text-xs text-slate-500" />
            Download Rx
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handlePrescriptionDownload("hi")}
            loading={isPending("prescription-hi")}
            className="shrink-0 border-sky-300 text-sky-800 hover:bg-sky-50 font-medium gap-1.5"
            title="Download Hindi Prescription PDF"
          >
            <Icon icon={faDownload} className="text-xs text-sky-600" />
            Download Rx (Hindi)
          </Button>
        </>
      )}
      {hasMedicalCertificate && (
        <Button
          type="button"
          variant="secondary"
          onClick={handleCertificateDownload}
          loading={isPending("certificate")}
          className="shrink-0"
        >
          Download medical certificate
        </Button>
      )}
      {showBillingLink && (
        <Link href={`/billing/${consultationId}`}>
          <Button type="button" variant="secondary" className="shrink-0">
            Go to billing
          </Button>
        </Link>
      )}
      {children}

      {/* Prescription Viewer Modal */}
      <PrescriptionViewModal
        consultationId={consultationId}
        isOpen={isRxViewOpen}
        onClose={() => setIsRxViewOpen(false)}
      />

      {/* Outpatient Summary Modal */}
      <PatientSummaryModal
        consultationId={consultationId}
        isOpen={isSummaryViewOpen}
        onClose={() => setIsSummaryViewOpen(false)}
      />
      {error && (
        <p className="w-full text-right text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

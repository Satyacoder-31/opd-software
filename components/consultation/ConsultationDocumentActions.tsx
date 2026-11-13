"use client";

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon as Icon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faFileContract,
  faPrint,
} from "@fortawesome/free-solid-svg-icons";
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
  const [rxModalLang, setRxModalLang] = useState<"en" | "hi">("en");
  const [rxAutoPrint, setRxAutoPrint] = useState(false);
  const [isSummaryViewOpen, setIsSummaryViewOpen] = useState(false);
  const { isPending, run } = usePendingAction<"certificate">();

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
            size="sm"
            onClick={() => {
              setRxModalLang("en");
              setRxAutoPrint(true);
              setIsRxViewOpen(true);
            }}
            className="shrink-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-800 text-white font-bold gap-1.5 shadow-xs cursor-pointer"
            title="Print Prescription (English)"
          >
            <Icon icon={faPrint} className="text-xs text-white" />
            Print Rx
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              setRxModalLang("en");
              setRxAutoPrint(false);
              setIsRxViewOpen(true);
            }}
            className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5 shadow-xs"
            title="View full prescription on screen (English)"
          >
            <Icon icon={faEye} className="text-xs" />
            View Rx (EN)
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setRxModalLang("hi");
              setRxAutoPrint(false);
              setIsRxViewOpen(true);
            }}
            className="shrink-0 border-indigo-300 text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 font-bold gap-1.5 shadow-2xs"
            title="पर्चा देखें (Hindi Prescription Preview)"
          >
            <Icon icon={faEye} className="text-xs text-indigo-600" />
            पर्चा देखें (Hindi)
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
        onClose={() => {
          setIsRxViewOpen(false);
          setRxAutoPrint(false);
        }}
        initialLang={rxModalLang}
        autoPrint={rxAutoPrint}
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

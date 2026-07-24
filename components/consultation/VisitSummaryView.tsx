import Link from "next/link";
import { ConsultationAttachments } from "@/components/consultation/ConsultationAttachments";
import { ConsultationDocumentActions } from "@/components/consultation/ConsultationDocumentActions";
import { ConsultationProfile } from "@/components/consultation/ConsultationProfile";
import { PatientContextRail } from "@/components/consultation/PatientContextRail";
import { PrescriptionProfile } from "@/components/consultation/PrescriptionProfile";
import { PatientSafetyBanner } from "@/components/patients/PatientSafetyBanner";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import { hasMedicalCertificateContent } from "@/lib/consultation-clinical";
import type { ConsultationClinicalData, Medicine } from "@/lib/types";

type VisitSummaryViewProps = {
  consultationId: string;
  patientId: string;
  patientName: string;
  uhid: string;
  episodeNo: string;
  patientPhone?: string | null;
  patientAge?: string | null;
  patientGender?: string | null;
  doctorName: string;
  clinical: ConsultationClinicalData;
  medicines: Medicine[];
  advice?: string | null;
  followUp?: string | null;
  patientAllergies?: string | null;
  patientChronicConditions?: string | null;
  amendmentReason?: string | null;
  amendedAt?: Date | null;
  canAmend?: boolean;
};

export function VisitSummaryView({
  consultationId,
  patientId,
  patientName,
  uhid,
  episodeNo,
  patientPhone,
  patientAge,
  patientGender,
  doctorName,
  clinical,
  medicines,
  advice,
  followUp,
  patientAllergies,
  patientChronicConditions,
  amendmentReason,
  amendedAt,
  canAmend = true,
}: VisitSummaryViewProps) {
  const hasPrescription = medicines.some((medicine) => medicine.name?.trim());
  const hasMedicalCertificate = hasMedicalCertificateContent(
    clinical.medicalCertificate
  );

  return (
    <PageShell>
      <div className="border-b border-border bg-card">
        <PageHeader
          className="pb-3 md:pb-3"
          title="Visit summary"
          backHref="/queue"
          backLabel="Back to queue"
          actions={
            <div className="flex flex-wrap gap-3">
              <ConsultationDocumentActions
                consultationId={consultationId}
                hasPrescription={hasPrescription}
                hasMedicalCertificate={hasMedicalCertificate}
                showBillingLink={false}
              />
              <Link href={`/billing/${consultationId}`}>
                <Button type="button" variant="secondary">
                  Go to billing
                </Button>
              </Link>
              {canAmend ? (
                <Link href={`/consultations/${consultationId}/amend`}>
                  <Button type="button" variant="secondary">
                    Amend consultation
                  </Button>
                </Link>
              ) : null}
            </div>
          }
        >
          {amendmentReason && amendedAt ? (
            <Banner variant="info">
              Last amended{" "}
              {new Date(amendedAt).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              : {amendmentReason}
            </Banner>
          ) : null}
        </PageHeader>

        <PatientContextRail
          className="px-6 pb-4 md:px-8"
          patientName={patientName}
          uhid={uhid}
          episodeNo={episodeNo}
          patientPhone={patientPhone}
          patientAge={patientAge}
          patientGender={patientGender}
          doctorName={doctorName}
          patientHref={`/patients/${patientId}`}
        />
      </div>

      {(patientAllergies?.trim() || patientChronicConditions?.trim()) ? (
        <div className="border-b border-border px-6 py-3 md:px-8">
          <PatientSafetyBanner
            allergies={patientAllergies}
            chronicConditions={patientChronicConditions}
          />
        </div>
      ) : null}

      <div className="min-w-0 divide-y divide-border border-b border-border bg-card">
        <ConsultationProfile {...clinical} />
        <Card title="Prescription" flush>
          <PrescriptionProfile
            medicines={medicines}
            advice={advice}
            followUp={followUp}
          />
        </Card>
        <ConsultationAttachments consultationId={consultationId} readOnly />
      </div>
    </PageShell>
  );
}

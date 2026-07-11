"use client";

import { useRouter } from "next/navigation";
import { ConsultationForm } from "@/components/consultation/ConsultationForm";
import { PrescriptionBuilder } from "@/components/consultation/PrescriptionBuilder";
import { ConsultationAttachments } from "@/components/consultation/ConsultationAttachments";
import { PatientSafetyBanner } from "@/components/patients/PatientSafetyBanner";
import { Card } from "@/components/ui/Card";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import type { ConsultationClinicalData, Medicine } from "@/lib/types";

type EditConsultationPageClientProps = {
  consultationId: string;
  patientName: string;
  patientMrn: string;
  doctorName: string;
  clinical: ConsultationClinicalData;
  medicines: Medicine[];
  advice?: string | null;
  followUp?: string | null;
  pageTitle?: string;
  backHref?: string;
  backLabel?: string;
  cancelHref?: string;
  patientAllergies?: string | null;
  patientChronicConditions?: string | null;
};

export function EditConsultationPageClient({
  consultationId,
  patientName,
  patientMrn,
  doctorName,
  clinical,
  medicines,
  advice,
  followUp,
  pageTitle = "Edit consultation",
  backHref,
  backLabel = "Back to consultation",
  cancelHref,
  patientAllergies,
  patientChronicConditions,
}: EditConsultationPageClientProps) {
  const router = useRouter();
  const resolvedBackHref = backHref ?? `/consultations/${consultationId}`;
  const resolvedCancelHref = cancelHref ?? `/consultations/${consultationId}`;

  return (
    <PageShell>
      <PageHeader
        title={pageTitle}
        description={`${patientName} · ${patientMrn} · Dr. ${doctorName}`}
        backHref={resolvedBackHref}
        backLabel={backLabel}
      >
        <PatientSafetyBanner
          allergies={patientAllergies}
          chronicConditions={patientChronicConditions}
        />
      </PageHeader>

      <Card title="Consultation" flush className="border-y border-border">
        <ConsultationForm
          consultationId={consultationId}
          initial={clinical}
          cancelHref={resolvedCancelHref}
          onSuccess={() => router.push(`/consultations/${consultationId}`)}
        />
      </Card>

      <Card title="Prescription" flush className="border-b border-border">
        <PrescriptionBuilder
          consultationId={consultationId}
          initialMedicines={medicines}
          initialAdvice={advice}
          initialFollowUp={followUp}
        />
      </Card>

      <Card title="Attachments" flush className="border-b border-border">
        <ConsultationAttachments consultationId={consultationId} />
      </Card>
    </PageShell>
  );
}

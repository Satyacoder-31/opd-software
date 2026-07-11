"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConsultationForm } from "@/components/consultation/ConsultationForm";
import { PrescriptionBuilder } from "@/components/consultation/PrescriptionBuilder";
import { PatientSafetyBanner } from "@/components/patients/PatientSafetyBanner";
import { Banner } from "@/components/ui/Banner";
import { Card } from "@/components/ui/Card";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import type { ConsultationClinicalData, Medicine } from "@/lib/types";

type AmendConsultationPageClientProps = {
  consultationId: string;
  patientName: string;
  patientMrn: string;
  doctorName: string;
  clinical: ConsultationClinicalData;
  medicines: Medicine[];
  advice?: string | null;
  followUp?: string | null;
  patientAllergies?: string | null;
  patientChronicConditions?: string | null;
};

export function AmendConsultationPageClient({
  consultationId,
  patientName,
  patientMrn,
  doctorName,
  clinical,
  medicines,
  advice,
  followUp,
  patientAllergies,
  patientChronicConditions,
}: AmendConsultationPageClientProps) {
  const router = useRouter();
  const [amendmentReason, setAmendmentReason] = useState("");

  return (
    <PageShell>
      <PageHeader
        title="Amend consultation"
        description={`${patientName} · ${patientMrn} · Dr. ${doctorName}`}
        backHref={`/consultations/${consultationId}`}
        backLabel="Back to consultation"
      >
        <Banner variant="info">
          This visit is finalized. Enter a reason, then save clinical notes
          and/or prescription changes. Each save is recorded in the audit log.
        </Banner>
        <PatientSafetyBanner
          allergies={patientAllergies}
          chronicConditions={patientChronicConditions}
        />
      </PageHeader>

      <Card title="Consultation" flush className="border-y border-border">
        <ConsultationForm
          consultationId={consultationId}
          initial={clinical}
          mode="amend"
          amendmentReason={amendmentReason}
          onAmendmentReasonChange={setAmendmentReason}
          cancelHref={`/consultations/${consultationId}`}
          onSuccess={() => router.push(`/consultations/${consultationId}`)}
        />
      </Card>

      <Card title="Prescription" flush className="border-b border-border">
        <PrescriptionBuilder
          consultationId={consultationId}
          initialMedicines={medicines}
          initialAdvice={advice}
          initialFollowUp={followUp}
          mode="amend"
          amendmentReason={amendmentReason}
        />
      </Card>
    </PageShell>
  );
}

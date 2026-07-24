"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConsultationForm } from "@/components/consultation/ConsultationForm";
import { PatientContextRail } from "@/components/consultation/PatientContextRail";
import { PrescriptionBuilder } from "@/components/consultation/PrescriptionBuilder";
import { PatientSafetyBanner } from "@/components/patients/PatientSafetyBanner";
import { Banner } from "@/components/ui/Banner";
import { Card } from "@/components/ui/Card";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import type { ConsultationClinicalData, Medicine } from "@/lib/types";

type AmendConsultationPageClientProps = {
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
};

export function AmendConsultationPageClient({
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
}: AmendConsultationPageClientProps) {
  const router = useRouter();
  const [amendmentReason, setAmendmentReason] = useState("");

  return (
    <PageShell>
      <div className="border-b border-border bg-card">
        <PageHeader
          className="pb-3 md:pb-3"
          title="Amend consultation"
          backHref={`/consultations/${consultationId}`}
          backLabel="Back to consultation"
        >
          <Banner variant="info">
            This visit is finalized. Enter a reason, then save clinical notes
            and/or prescription changes. Each save is recorded in the audit log.
          </Banner>
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
      <Card title="Consultation" flush className="border-b border-border">
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
          patientAllergies={patientAllergies}
        />
      </Card>
    </PageShell>
  );
}

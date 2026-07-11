import Link from "next/link";
import { notFound } from "next/navigation";
import { getConsultation } from "@/actions/consultations";
import { isConsultationEditable } from "@/lib/consultation-utils";
import {
  mergePatientAlertsIntoClinical,
  toConsultationClinicalData,
} from "@/lib/consultation-utils";
import { hasMedicalCertificateContent } from "@/lib/consultation-clinical";
import { ConsultationDocumentActions } from "@/components/consultation/ConsultationDocumentActions";
import { ConsultationAttachments } from "@/components/consultation/ConsultationAttachments";
import { ConsultationProfile } from "@/components/consultation/ConsultationProfile";
import { EditConsultationPageClient } from "@/components/consultation/EditConsultationPageClient";
import { PrescriptionProfile } from "@/components/consultation/PrescriptionProfile";
import { PatientSafetyBanner } from "@/components/patients/PatientSafetyBanner";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import type { Medicine } from "@/lib/types";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ConsultationPage({ params }: Props) {
  const { id } = await params;
  const consultation = await getConsultation(id);

  if (!consultation) notFound();

  const medicines = (consultation.prescription?.medicines as Medicine[]) ?? [];
  const editable = isConsultationEditable(consultation.appointment.status);
  const hasPrescription = medicines.some((medicine) => medicine.name?.trim());
  const clinical = mergePatientAlertsIntoClinical(
    toConsultationClinicalData(consultation),
    consultation.patient
  );
  const hasMedicalCertificate = hasMedicalCertificateContent(
    clinical.medicalCertificate
  );

  if (editable) {
    return (
      <EditConsultationPageClient
        consultationId={consultation.id}
        patientName={consultation.patient.name}
        patientMrn={consultation.patient.mrn}
        doctorName={consultation.doctor.name}
        clinical={clinical}
        medicines={medicines}
        advice={consultation.prescription?.advice}
        followUp={consultation.prescription?.followUp}
        pageTitle="Consultation"
        backHref="/queue"
        backLabel="Back to queue"
        cancelHref="/queue"
        patientAllergies={consultation.patient.allergies}
        patientChronicConditions={consultation.patient.chronicConditions}
      />
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Consultation"
        description={`${consultation.patient.name} · ${consultation.patient.mrn} · Dr. ${consultation.doctor.name}`}
        backHref="/queue"
        backLabel="Back to queue"
      >
        <div className="flex flex-wrap gap-3">
          <ConsultationDocumentActions
            consultationId={consultation.id}
            hasPrescription={hasPrescription}
            hasMedicalCertificate={hasMedicalCertificate}
            showBillingLink={false}
          />
          <Link href={`/billing/${consultation.id}`}>
            <Button type="button" variant="secondary">
              Go to billing
            </Button>
          </Link>
          {consultation.appointment.status === "done" && (
            <Link href={`/consultations/${consultation.id}/amend`}>
              <Button type="button" variant="secondary">
                Amend consultation
              </Button>
            </Link>
          )}
        </div>

        {consultation.amendmentReason && consultation.amendedAt && (
          <Banner variant="info">
            Last amended{" "}
            {new Date(consultation.amendedAt).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            : {consultation.amendmentReason}
          </Banner>
        )}

        <PatientSafetyBanner
          allergies={consultation.patient.allergies}
          chronicConditions={consultation.patient.chronicConditions}
        />
      </PageHeader>

      <Card title="Consultation" flush className="border-y border-border">
        <ConsultationProfile {...clinical} />
      </Card>

      <Card title="Prescription" flush className="border-b border-border">
        <PrescriptionProfile
          medicines={medicines}
          advice={consultation.prescription?.advice}
          followUp={consultation.prescription?.followUp}
        />
      </Card>

      <Card title="Attachments" flush className="border-b border-border">
        <ConsultationAttachments consultationId={consultation.id} readOnly />
      </Card>
    </PageShell>
  );
}

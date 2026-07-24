import { notFound } from "next/navigation";
import { getConsultation } from "@/actions/consultations";
import { ConsultationWorkspace } from "@/components/consultation/ConsultationWorkspace";
import { VisitSummaryView } from "@/components/consultation/VisitSummaryView";
import { formatPatientAge } from "@/lib/date-utils";
import { isConsultationEditable } from "@/lib/consultation-utils";
import {
  mergePatientAlertsIntoClinical,
  toConsultationClinicalData,
} from "@/lib/consultation-utils";
import { formatEpisodeNo, formatUhid } from "@/lib/visit-identifiers";
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
  const clinical = mergePatientAlertsIntoClinical(
    toConsultationClinicalData(consultation),
    consultation.patient
  );
  const patientAge = formatPatientAge(consultation.patient);
  const patientGender = consultation.patient.gender
    ? consultation.patient.gender.charAt(0).toUpperCase() +
      consultation.patient.gender.slice(1)
    : null;
  const uhid = formatUhid(consultation.patient.mrn);
  const episodeNo = formatEpisodeNo({
    queueDate: consultation.appointment.queueDate,
    tokenNumber: consultation.appointment.tokenNumber,
  });

  if (editable) {
    return (
      <ConsultationWorkspace
        consultationId={consultation.id}
        patientId={consultation.patient.id}
        patientName={consultation.patient.name}
        uhid={uhid}
        episodeNo={episodeNo}
        patientPhone={consultation.patient.phone}
        patientAge={patientAge}
        patientGender={patientGender}
        doctorName={consultation.doctor.name}
        clinical={clinical}
        medicines={medicines}
        advice={consultation.prescription?.advice}
        followUp={consultation.prescription?.followUp}
        patientAllergies={consultation.patient.allergies}
        patientChronicConditions={consultation.patient.chronicConditions}
      />
    );
  }

  return (
    <VisitSummaryView
      consultationId={consultation.id}
      patientId={consultation.patient.id}
      patientName={consultation.patient.name}
      uhid={uhid}
      episodeNo={episodeNo}
      patientPhone={consultation.patient.phone}
      patientAge={patientAge}
      patientGender={patientGender}
      doctorName={consultation.doctor.name}
      clinical={clinical}
      medicines={medicines}
      advice={consultation.prescription?.advice}
      followUp={consultation.prescription?.followUp}
      patientAllergies={consultation.patient.allergies}
      patientChronicConditions={consultation.patient.chronicConditions}
      amendmentReason={consultation.amendmentReason}
      amendedAt={consultation.amendedAt}
      canAmend={consultation.appointment.status === "done"}
    />
  );
}

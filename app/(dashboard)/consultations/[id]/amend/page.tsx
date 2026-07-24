import { notFound, redirect } from "next/navigation";
import { getConsultation } from "@/actions/consultations";
import { AmendConsultationPageClient } from "@/components/consultation/AmendConsultationPageClient";
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

export default async function AmendConsultationPage({ params }: Props) {
  const { id } = await params;
  const consultation = await getConsultation(id);

  if (!consultation) notFound();

  if (isConsultationEditable(consultation.appointment.status)) {
    redirect(`/consultations/${id}`);
  }

  if (consultation.appointment.status !== "done") {
    redirect(`/consultations/${id}`);
  }

  const medicines = (consultation.prescription?.medicines as Medicine[]) ?? [];
  const clinical = mergePatientAlertsIntoClinical(
    toConsultationClinicalData(consultation),
    consultation.patient
  );
  const patientAge = formatPatientAge(consultation.patient);
  const patientGender = consultation.patient.gender
    ? consultation.patient.gender.charAt(0).toUpperCase() +
      consultation.patient.gender.slice(1)
    : null;

  return (
    <AmendConsultationPageClient
      consultationId={consultation.id}
      patientId={consultation.patient.id}
      patientName={consultation.patient.name}
      uhid={formatUhid(consultation.patient.mrn)}
      episodeNo={formatEpisodeNo({
        queueDate: consultation.appointment.queueDate,
        tokenNumber: consultation.appointment.tokenNumber,
      })}
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

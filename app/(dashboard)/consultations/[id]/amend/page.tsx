import { notFound, redirect } from "next/navigation";
import { getConsultation } from "@/actions/consultations";
import { isConsultationEditable } from "@/lib/consultation-utils";
import {
  mergePatientAlertsIntoClinical,
  toConsultationClinicalData,
} from "@/lib/consultation-utils";
import { AmendConsultationPageClient } from "@/components/consultation/AmendConsultationPageClient";
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

  return (
    <AmendConsultationPageClient
      consultationId={consultation.id}
      patientName={consultation.patient.name}
      patientMrn={consultation.patient.mrn}
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

import { notFound, redirect } from "next/navigation";
import { getConsultation } from "@/actions/consultations";
import { isConsultationEditable } from "@/lib/consultation-utils";
import { toConsultationClinicalData } from "@/lib/consultation-utils";
import { EditConsultationPageClient } from "@/components/consultation/EditConsultationPageClient";
import type { Medicine } from "@/lib/types";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditConsultationPage({ params }: Props) {
  const { id } = await params;
  const consultation = await getConsultation(id);

  if (!consultation) notFound();

  if (!isConsultationEditable(consultation.appointment.status)) {
    redirect(`/consultations/${id}`);
  }

  const medicines = (consultation.prescription?.medicines as Medicine[]) ?? [];

  return (
    <EditConsultationPageClient
      consultationId={consultation.id}
      patientName={consultation.patient.name}
      patientMrn={consultation.patient.mrn}
      doctorName={consultation.doctor.name}
      clinical={toConsultationClinicalData(consultation)}
      medicines={medicines}
      advice={consultation.prescription?.advice}
      followUp={consultation.prescription?.followUp}
    />
  );
}

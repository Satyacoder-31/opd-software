"use client";

import { ConsultationWorkspace } from "@/components/consultation/ConsultationWorkspace";
import type { ConsultationClinicalData, Medicine } from "@/lib/types";

type EditConsultationPageClientProps = {
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

/** @deprecated Prefer ConsultationWorkspace via the main consultation route. */
export function EditConsultationPageClient(props: EditConsultationPageClientProps) {
  return <ConsultationWorkspace {...props} />;
}

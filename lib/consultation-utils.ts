import { AppointmentStatus, type Consultation } from "@prisma/client";
import type {
  ClinicalPresentation,
  ConsultationClinicalData,
  Examination,
  InvestigationResults,
  MedicalCertificate,
  PatientHistory,
  Vitals,
} from "@/lib/types";

export function isConsultationEditable(
  appointmentStatus: AppointmentStatus
): boolean {
  return appointmentStatus === AppointmentStatus.in_progress;
}

type ConsultationRecord = Pick<
  Consultation,
  | "chiefComplaint"
  | "diagnosis"
  | "notes"
  | "vitals"
  | "clinicalPresentation"
  | "patientHistory"
  | "examination"
  | "investigationResults"
  | "medicalCertificate"
>;

export function toConsultationClinicalData(
  consultation: ConsultationRecord
): ConsultationClinicalData {
  return {
    chiefComplaint: consultation.chiefComplaint ?? undefined,
    diagnosis: consultation.diagnosis ?? undefined,
    notes: consultation.notes ?? undefined,
    vitals: (consultation.vitals as Vitals | null) ?? undefined,
    clinicalPresentation:
      (consultation.clinicalPresentation as ClinicalPresentation | null) ??
      undefined,
    patientHistory:
      (consultation.patientHistory as PatientHistory | null) ?? undefined,
    examination:
      (consultation.examination as Examination | null) ?? undefined,
    investigationResults:
      (consultation.investigationResults as InvestigationResults | null) ??
      undefined,
    medicalCertificate:
      (consultation.medicalCertificate as MedicalCertificate | null) ??
      undefined,
  };
}

export function mergePatientAlertsIntoClinical(
  clinical: ConsultationClinicalData,
  patient: { allergies?: string | null; chronicConditions?: string | null }
): ConsultationClinicalData {
  const history = { ...(clinical.patientHistory ?? {}) };

  if (!history.allergies?.trim() && patient.allergies?.trim()) {
    history.allergies = patient.allergies.trim();
  }

  if (!history.pastMedical?.trim() && patient.chronicConditions?.trim()) {
    history.pastMedical = patient.chronicConditions.trim();
  }

  return {
    ...clinical,
    patientHistory: history,
  };
}

export function hasPatientSafetyAlerts(patient: {
  allergies?: string | null;
  chronicConditions?: string | null;
}): boolean {
  return Boolean(patient.allergies?.trim() || patient.chronicConditions?.trim());
}

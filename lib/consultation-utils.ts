import { AppointmentStatus, type Consultation } from "@prisma/client";
import { normalizeDrugName } from "@/lib/drug-catalog";
import type { DiagnosisCodeEntry } from "@/lib/icd-catalog";
import type {
  ClinicalPresentation,
  ConsultationClinicalData,
  Examination,
  InvestigationResults,
  MedicalCertificate,
  PatientHistory,
  ReferralLetter,
  Vitals,
} from "@/lib/types";

/** Free-text notes that mean “no allergy alert”, not a real sensitivity. */
const NON_ALLERGY_NOTES = new Set([
  "nkda",
  "nka",
  "nil",
  "none",
  "no known drug allergies",
  "no known allergies",
]);

/**
 * Returns trimmed allergy text only when it should surface as a safety alert.
 * Empty and NKDA-style notes return null.
 */
export function meaningfulAllergyText(
  allergies?: string | null
): string | null {
  const text = allergies?.trim();
  if (!text) return null;
  if (NON_ALLERGY_NOTES.has(normalizeDrugName(text))) return null;
  return text;
}

export function isConsultationEditable(
  appointmentStatus: AppointmentStatus
): boolean {
  return appointmentStatus === AppointmentStatus.in_progress;
}

type ConsultationRecord = Pick<
  Consultation,
  | "chiefComplaint"
  | "diagnosis"
  | "diagnosisCodes"
  | "referral"
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
    diagnosisCodes:
      (consultation.diagnosisCodes as DiagnosisCodeEntry[] | null) ?? undefined,
    referral: (consultation.referral as ReferralLetter | null) ?? undefined,
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
  return Boolean(
    meaningfulAllergyText(patient.allergies) ||
      patient.chronicConditions?.trim()
  );
}

import type { Role } from "@prisma/client";
import type { DiagnosisCodeEntry } from "@/lib/icd-catalog";

export type SessionUser = {
  userId: string;
  clinicId: string;
  role: Role;
  email: string;
  name: string;
};

export type Vitals = {
  bp?: string;
  pulse?: string;
  temp?: string;
  weight?: string;
  spo2?: string;
};

export type ClinicalPresentation = {
  historyOfPresentIllness?: string;
  onset?: string;
  duration?: string;
};

export type PatientHistory = {
  pastMedical?: string;
  pastSurgical?: string;
  allergies?: string;
  medications?: string;
  familyHistory?: string;
  socialHistory?: string;
};

export type Examination = {
  general?: string;
  cardiovascular?: string;
  respiratory?: string;
  abdomen?: string;
  neurological?: string;
  other?: string;
};

export type InvestigationResults = {
  labs?: string;
  imaging?: string;
  other?: string;
};

export type MedicalCertificate = {
  diagnosisForCertificate?: string;
  restFrom?: string;
  restTo?: string;
  fitnessStatus?: string;
  remarks?: string;
};

export type ReferralLetter = {
  toSpecialty?: string;
  toFacility?: string;
  reason?: string;
  notes?: string;
};

export type { DiagnosisCodeEntry };

export type ConsultationClinicalData = {
  chiefComplaint?: string;
  diagnosis?: string;
  diagnosisCodes?: DiagnosisCodeEntry[];
  referral?: ReferralLetter;
  notes?: string;
  vitals?: Vitals;
  clinicalPresentation?: ClinicalPresentation;
  patientHistory?: PatientHistory;
  examination?: Examination;
  investigationResults?: InvestigationResults;
  medicalCertificate?: MedicalCertificate;
};

export type Medicine = {
  name: string;
  dosage: string;
  /** Route of administration, e.g. Oral, Inhalation, Topical. */
  route?: string;
  frequency: string;
  duration: string;
  /** Dispense quantity (tablets/capsules/etc.), often estimated from freq × duration. */
  quantity?: string;
  instructions?: string;
};

export type PrescriptionMeta = {
  advice?: string;
  followUp?: string;
};

export type LineItem = {
  description: string;
  amount: number;
  hsnSac?: string;
};

export type FieldErrors = Record<string, string>;

export type VoidActionResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: FieldErrors };

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: FieldErrors };

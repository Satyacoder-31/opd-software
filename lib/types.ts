import type { Role } from "@prisma/client";

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

export type ConsultationClinicalData = {
  chiefComplaint?: string;
  diagnosis?: string;
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
  frequency: string;
  duration: string;
  instructions?: string;
};

export type PrescriptionMeta = {
  advice?: string;
  followUp?: string;
};

export type LineItem = {
  description: string;
  amount: number;
};

export type FieldErrors = Record<string, string>;

export type VoidActionResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: FieldErrors };

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: FieldErrors };

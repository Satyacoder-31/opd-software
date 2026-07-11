import { z } from "zod";
import type {
  ClinicalPresentation,
  Examination,
  InvestigationResults,
  MedicalCertificate,
  PatientHistory,
  Vitals,
} from "@/lib/types";

export const vitalsSchema = z.object({
  bp: z.string().optional(),
  pulse: z.string().optional(),
  temp: z.string().optional(),
  weight: z.string().optional(),
  spo2: z.string().optional(),
});

export const clinicalPresentationSchema = z.object({
  historyOfPresentIllness: z.string().optional(),
  onset: z.string().optional(),
  duration: z.string().optional(),
});

export const patientHistorySchema = z.object({
  pastMedical: z.string().optional(),
  pastSurgical: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
  familyHistory: z.string().optional(),
  socialHistory: z.string().optional(),
});

export const examinationSchema = z.object({
  general: z.string().optional(),
  cardiovascular: z.string().optional(),
  respiratory: z.string().optional(),
  abdomen: z.string().optional(),
  neurological: z.string().optional(),
  other: z.string().optional(),
});

export const investigationResultsSchema = z.object({
  labs: z.string().optional(),
  imaging: z.string().optional(),
  other: z.string().optional(),
});

export const medicalCertificateSchema = z.object({
  diagnosisForCertificate: z.string().optional(),
  restFrom: z.string().optional(),
  restTo: z.string().optional(),
  fitnessStatus: z.string().optional(),
  remarks: z.string().optional(),
});

export const consultationClinicalSchema = z.object({
  chiefComplaint: z.string().optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  vitals: vitalsSchema.optional(),
  clinicalPresentation: clinicalPresentationSchema.optional(),
  patientHistory: patientHistorySchema.optional(),
  examination: examinationSchema.optional(),
  investigationResults: investigationResultsSchema.optional(),
  medicalCertificate: medicalCertificateSchema.optional(),
});

export type ConsultationClinicalInput = z.infer<typeof consultationClinicalSchema>;

function countFilled(values: Array<string | undefined>): number {
  return values.filter((v) => v?.trim()).length;
}

function countFilledRecord(record: Record<string, string | undefined> | undefined): number {
  if (!record) return 0;
  return countFilled(Object.values(record));
}

export function sectionCompletion(data: {
  chiefComplaint?: string;
  diagnosis?: string;
  notes?: string;
  vitals?: Vitals;
  clinicalPresentation?: ClinicalPresentation;
  patientHistory?: PatientHistory;
  examination?: Examination;
  investigationResults?: InvestigationResults;
  medicalCertificate?: MedicalCertificate;
}) {
  const vitals = data.vitals ?? {};
  const clinicalPresentation = data.clinicalPresentation ?? {};
  const patientHistory = data.patientHistory ?? {};
  const examination = data.examination ?? {};
  const investigationResults = data.investigationResults ?? {};
  const medicalCertificate = data.medicalCertificate ?? {};

  return {
    vitals: {
      filled: countFilled(Object.values(vitals)) > 0,
      count: countFilled(Object.values(vitals)),
      total: 5,
    },
    clinicalPresentation: {
      filled:
        !!data.chiefComplaint?.trim() ||
        countFilledRecord(clinicalPresentation) > 0,
      count:
        (data.chiefComplaint?.trim() ? 1 : 0) +
        countFilledRecord(clinicalPresentation),
      total: 4,
    },
    patientHistory: {
      filled: countFilledRecord(patientHistory) > 0,
      count: countFilledRecord(patientHistory),
      total: 6,
    },
    examination: {
      filled: countFilledRecord(examination) > 0,
      count: countFilledRecord(examination),
      total: 6,
    },
    investigationResults: {
      filled: countFilledRecord(investigationResults) > 0,
      count: countFilledRecord(investigationResults),
      total: 3,
    },
    diagnosis: {
      filled: !!data.diagnosis?.trim(),
      count: data.diagnosis?.trim() ? 1 : 0,
      total: 1,
    },
    notes: {
      filled: !!data.notes?.trim(),
      count: data.notes?.trim() ? 1 : 0,
      total: 1,
    },
    medicalCertificate: {
      filled: countFilledRecord(medicalCertificate) > 0,
      count: countFilledRecord(medicalCertificate),
      total: 5,
    },
  };
}

export function sectionSummary(
  section: { filled: boolean; count: number; total: number },
  emptyLabel = "No details added"
): string {
  if (!section.filled) return emptyLabel;
  if (section.count === section.total) return "All fields completed";
  return `${section.count} of ${section.total} fields filled`;
}

export const emptyClinicalPresentation = (): ClinicalPresentation => ({});
export const emptyPatientHistory = (): PatientHistory => ({});
export const emptyExamination = (): Examination => ({});
export const emptyInvestigationResults = (): InvestigationResults => ({});
export const emptyMedicalCertificate = (): MedicalCertificate => ({});

export function hasMedicalCertificateContent(
  certificate?: MedicalCertificate | null
): boolean {
  if (!certificate) return false;
  return Object.values(certificate).some((value) => value?.trim());
}

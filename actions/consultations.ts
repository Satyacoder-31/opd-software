"use server";

import { revalidatePath } from "next/cache";
import type { Gender } from "@prisma/client";
import { prisma } from "@/lib/db";
import { permissionDenied, requireSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { consultationClinicalSchema, hasMedicalCertificateContent } from "@/lib/consultation-clinical";
import { isConsultationEditable } from "@/lib/consultation-utils";
import { recordPrescribedDrugs } from "@/lib/drug-catalog.server";
import { zodFieldErrors } from "@/lib/form-utils";
import { renderMedicalCertificatePdf } from "@/lib/pdf";
import { formatPatientAge } from "@/lib/date-utils";
import { validatePrescriptionDraft } from "@/lib/prescription-validation";
import { can } from "@/lib/rbac";
import { validateReason } from "@/lib/validation";
import type {
  ActionResult,
  ConsultationClinicalData,
  MedicalCertificate,
  Medicine,
  VoidActionResult,
} from "@/lib/types";

const CONSULTATION_LOCKED_ERROR =
  "This consultation is finalized and cannot be edited.";

type VisitDraftInput = {
  clinical: ConsultationClinicalData;
  medicines: Medicine[];
  advice?: string | null;
  followUp?: string | null;
};

function clinicalUpdateData(
  parsed: ConsultationClinicalData,
  userId: string
) {
  return {
    chiefComplaint: parsed.chiefComplaint,
    diagnosis: parsed.diagnosis,
    notes: parsed.notes,
    vitals: parsed.vitals ?? undefined,
    clinicalPresentation: parsed.clinicalPresentation ?? undefined,
    patientHistory: parsed.patientHistory ?? undefined,
    examination: parsed.examination ?? undefined,
    investigationResults: parsed.investigationResults ?? undefined,
    medicalCertificate: parsed.medicalCertificate ?? undefined,
    updatedById: userId,
  };
}

function validateVisitDraft(input: VisitDraftInput):
  | {
      ok: true;
      clinical: ConsultationClinicalData;
      medicines: Medicine[];
      advice?: string;
      followUp?: string;
    }
  | { ok: false; error: string; fieldErrors?: Record<string, string> } {
  const clinicalParsed = consultationClinicalSchema.safeParse(input.clinical);
  if (!clinicalParsed.success) {
    return {
      ok: false,
      error: "Invalid consultation data.",
      fieldErrors: zodFieldErrors(clinicalParsed.error),
    };
  }

  const prescription = validatePrescriptionDraft(input.medicines, {
    advice: input.advice,
    followUp: input.followUp,
  });
  if (!prescription.ok) {
    return { ok: false, error: prescription.error };
  }

  return {
    ok: true,
    clinical: clinicalParsed.data,
    medicines: prescription.medicines,
    advice: prescription.advice,
    followUp: prescription.followUp,
  };
}

function formatGender(gender: Gender | null | undefined): string | undefined {
  if (!gender) return undefined;
  return gender.charAt(0).toUpperCase() + gender.slice(1);
}

function formatCertificateDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export async function getConsultation(id: string) {
  const session = await requireSessionUser();
  if (!can(session, "consultations.read")) return null;

  const consultation = await prisma.consultation.findFirst({
    where: { id, clinicId: session.clinicId },
    include: {
      patient: true,
      doctor: { select: { id: true, name: true } },
      appointment: true,
      prescription: true,
      invoice: true,
    },
  });

  if (consultation) {
    await logAudit({
      clinicId: session.clinicId,
      actorId: session.userId,
      action: "read",
      resourceType: "consultation",
      resourceId: id,
    });
  }

  return consultation;
}

export async function saveConsultation(
  id: string,
  data: ConsultationClinicalData,
  options?: { autosave?: boolean }
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "consultations.write")) return permissionDenied();

  const consultation = await prisma.consultation.findFirst({
    where: { id, clinicId: session.clinicId },
    include: { appointment: { select: { status: true } } },
  });

  if (!consultation) {
    return { success: false, error: "Consultation not found." };
  }

  if (!isConsultationEditable(consultation.appointment.status)) {
    return { success: false, error: CONSULTATION_LOCKED_ERROR };
  }

  const parsed = consultationClinicalSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid consultation data.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  await prisma.consultation.updateMany({
    where: { id, clinicId: session.clinicId },
    data: {
      chiefComplaint: parsed.data.chiefComplaint,
      diagnosis: parsed.data.diagnosis,
      notes: parsed.data.notes,
      vitals: parsed.data.vitals ?? undefined,
      clinicalPresentation: parsed.data.clinicalPresentation ?? undefined,
      patientHistory: parsed.data.patientHistory ?? undefined,
      examination: parsed.data.examination ?? undefined,
      investigationResults: parsed.data.investigationResults ?? undefined,
      medicalCertificate: parsed.data.medicalCertificate ?? undefined,
      updatedById: session.userId,
    },
  });

  if (!options?.autosave) {
    await logAudit({
      clinicId: session.clinicId,
      actorId: session.userId,
      action: "update",
      resourceType: "consultation",
      resourceId: id,
    });

    revalidatePath(`/consultations/${id}`);
    revalidatePath(`/consultations/${id}/edit`);
  }

  return { success: true };
}

export async function submitConsultation(
  id: string,
  data: ConsultationClinicalData
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "consultations.write")) return permissionDenied();

  const consultation = await prisma.consultation.findFirst({
    where: { id, clinicId: session.clinicId },
    include: { appointment: { select: { id: true, status: true } } },
  });

  if (!consultation) {
    return { success: false, error: "Consultation not found." };
  }

  if (!isConsultationEditable(consultation.appointment.status)) {
    return { success: false, error: "This consultation is already finalized." };
  }

  const parsed = consultationClinicalSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid consultation data.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const finalized = await prisma.$transaction(async (tx) => {
    const statusUpdate = await tx.appointment.updateMany({
      where: {
        id: consultation.appointmentId,
        clinicId: session.clinicId,
        status: "in_progress",
      },
      data: { status: "done" },
    });

    if (statusUpdate.count === 0) {
      return false;
    }

    await tx.consultation.updateMany({
      where: { id, clinicId: session.clinicId },
      data: {
        chiefComplaint: parsed.data.chiefComplaint,
        diagnosis: parsed.data.diagnosis,
        notes: parsed.data.notes,
        vitals: parsed.data.vitals ?? undefined,
        clinicalPresentation: parsed.data.clinicalPresentation ?? undefined,
        patientHistory: parsed.data.patientHistory ?? undefined,
        examination: parsed.data.examination ?? undefined,
        investigationResults: parsed.data.investigationResults ?? undefined,
        medicalCertificate: parsed.data.medicalCertificate ?? undefined,
        updatedById: session.userId,
      },
    });

    return true;
  });

  if (!finalized) {
    return { success: false, error: "This consultation is already finalized." };
  }

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "consultation",
    resourceId: id,
    metadata: { submitted: true },
  });

  revalidatePath("/queue");
  revalidatePath(`/consultations/${id}`);
  revalidatePath(`/consultations/${id}/edit`);
  return { success: true };
}

export async function saveVisitDraft(
  id: string,
  input: VisitDraftInput,
  options?: { autosave?: boolean }
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "consultations.write")) return permissionDenied();

  const consultation = await prisma.consultation.findFirst({
    where: { id, clinicId: session.clinicId },
    include: { appointment: { select: { status: true } } },
  });

  if (!consultation) {
    return { success: false, error: "Consultation not found." };
  }

  if (!isConsultationEditable(consultation.appointment.status)) {
    return { success: false, error: CONSULTATION_LOCKED_ERROR };
  }

  const validated = validateVisitDraft(input);
  if (!validated.ok) {
    return {
      success: false,
      error: validated.error,
      fieldErrors: validated.fieldErrors,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.consultation.updateMany({
      where: { id, clinicId: session.clinicId },
      data: clinicalUpdateData(validated.clinical, session.userId),
    });

    await tx.prescription.upsert({
      where: { consultationId: id },
      create: {
        clinicId: session.clinicId,
        consultationId: id,
        medicines: validated.medicines,
        advice: validated.advice?.trim() || null,
        followUp: validated.followUp?.trim() || null,
        createdById: session.userId,
      },
      update: {
        medicines: validated.medicines,
        advice: validated.advice?.trim() || null,
        followUp: validated.followUp?.trim() || null,
        updatedById: session.userId,
      },
    });

    await recordPrescribedDrugs(tx, session.clinicId, validated.medicines);
  });

  if (!options?.autosave) {
    await logAudit({
      clinicId: session.clinicId,
      actorId: session.userId,
      action: "update",
      resourceType: "consultation",
      resourceId: id,
      metadata: { draft: true },
    });

    revalidatePath(`/consultations/${id}`);
    revalidatePath(`/consultations/${id}/edit`);
  }

  return { success: true };
}

export async function completeVisit(
  id: string,
  input: VisitDraftInput
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "consultations.write")) return permissionDenied();

  const consultation = await prisma.consultation.findFirst({
    where: { id, clinicId: session.clinicId },
    include: { appointment: { select: { id: true, status: true } } },
  });

  if (!consultation) {
    return { success: false, error: "Consultation not found." };
  }

  if (!isConsultationEditable(consultation.appointment.status)) {
    return { success: false, error: "This consultation is already finalized." };
  }

  const validated = validateVisitDraft(input);
  if (!validated.ok) {
    return {
      success: false,
      error: validated.error,
      fieldErrors: validated.fieldErrors,
    };
  }

  const finalized = await prisma.$transaction(async (tx) => {
    const statusUpdate = await tx.appointment.updateMany({
      where: {
        id: consultation.appointmentId,
        clinicId: session.clinicId,
        status: "in_progress",
      },
      data: { status: "done" },
    });

    if (statusUpdate.count === 0) {
      return false;
    }

    await tx.consultation.updateMany({
      where: { id, clinicId: session.clinicId },
      data: clinicalUpdateData(validated.clinical, session.userId),
    });

    await tx.prescription.upsert({
      where: { consultationId: id },
      create: {
        clinicId: session.clinicId,
        consultationId: id,
        medicines: validated.medicines,
        advice: validated.advice?.trim() || null,
        followUp: validated.followUp?.trim() || null,
        createdById: session.userId,
      },
      update: {
        medicines: validated.medicines,
        advice: validated.advice?.trim() || null,
        followUp: validated.followUp?.trim() || null,
        updatedById: session.userId,
      },
    });

    await recordPrescribedDrugs(tx, session.clinicId, validated.medicines);

    return true;
  });

  if (!finalized) {
    return { success: false, error: "This consultation is already finalized." };
  }

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "consultation",
    resourceId: id,
    metadata: { completed: true },
  });

  revalidatePath("/queue");
  revalidatePath(`/consultations/${id}`);
  revalidatePath(`/consultations/${id}/edit`);
  return { success: true };
}

export async function amendConsultation(
  id: string,
  data: ConsultationClinicalData,
  reason: string
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "consultations.write")) return permissionDenied();

  const reasonCheck = validateReason(reason, "Amendment reason");
  if (!reasonCheck.ok) {
    return { success: false, error: reasonCheck.error };
  }

  const consultation = await prisma.consultation.findFirst({
    where: { id, clinicId: session.clinicId },
    include: { appointment: { select: { status: true } } },
  });

  if (!consultation) {
    return { success: false, error: "Consultation not found." };
  }

  if (isConsultationEditable(consultation.appointment.status)) {
    return {
      success: false,
      error: "Use Save or Submit while the consultation is still in progress.",
    };
  }

  if (consultation.appointment.status !== "done") {
    return {
      success: false,
      error: "Only finalized consultations can be amended.",
    };
  }

  const parsed = consultationClinicalSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid consultation data.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  await prisma.consultation.updateMany({
    where: { id, clinicId: session.clinicId },
    data: {
      chiefComplaint: parsed.data.chiefComplaint,
      diagnosis: parsed.data.diagnosis,
      notes: parsed.data.notes,
      vitals: parsed.data.vitals ?? undefined,
      clinicalPresentation: parsed.data.clinicalPresentation ?? undefined,
      patientHistory: parsed.data.patientHistory ?? undefined,
      examination: parsed.data.examination ?? undefined,
      investigationResults: parsed.data.investigationResults ?? undefined,
      medicalCertificate: parsed.data.medicalCertificate ?? undefined,
      amendmentReason: reasonCheck.reason,
      amendedAt: new Date(),
      amendedById: session.userId,
      updatedById: session.userId,
    },
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "consultation",
    resourceId: id,
    metadata: { amendment: true, reason: reasonCheck.reason },
  });

  revalidatePath(`/consultations/${id}`);
  revalidatePath(`/consultations/${id}/amend`);
  return { success: true };
}

export async function generateMedicalCertificatePdf(
  consultationId: string
): Promise<ActionResult<{ pdfBase64: string; filename: string }>> {
  const session = await requireSessionUser();
  if (!can(session, "consultations.write")) return permissionDenied();

  const consultation = await prisma.consultation.findFirst({
    where: { id: consultationId, clinicId: session.clinicId },
    include: {
      patient: true,
      doctor: true,
    },
  });

  if (!consultation) {
    return { success: false, error: "Consultation not found." };
  }

  const certificate = consultation.medicalCertificate as MedicalCertificate | null;
  if (!hasMedicalCertificateContent(certificate)) {
    return { success: false, error: "No medical certificate data on this visit." };
  }

  const clinic = await prisma.clinic.findUniqueOrThrow({
    where: { id: session.clinicId },
  });

  const pdfBytes = await renderMedicalCertificatePdf({
    clinicName: clinic.name,
    clinicPhone: clinic.phone,
    clinicAddress: clinic.address,
    doctorName: consultation.doctor.name,
    doctorQualifications: consultation.doctor.qualifications ?? undefined,
    doctorRegistrationNo: consultation.doctor.registrationNo ?? undefined,
    date: formatCertificateDate(consultation.createdAt),
    patientName: consultation.patient.name,
    patientAge: formatPatientAge(consultation.patient),
    patientGender: formatGender(consultation.patient.gender),
    patientMrn: consultation.patient.mrn,
    diagnosisForCertificate: certificate?.diagnosisForCertificate,
    restFrom: certificate?.restFrom,
    restTo: certificate?.restTo,
    fitnessStatus: certificate?.fitnessStatus,
    remarks: certificate?.remarks,
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "export",
    resourceType: "consultation",
    resourceId: consultation.id,
    metadata: { document: "medical_certificate" },
  });

  const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
  const filename = `medical-certificate-${consultation.patient.mrn}.pdf`;

  return { success: true, data: { pdfBase64, filename } };
}

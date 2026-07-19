"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import type { Gender } from "@prisma/client";
import { prisma } from "@/lib/db";
import { permissionDenied, requireSessionUser, roleAllowed } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { consultationClinicalSchema, hasMedicalCertificateContent } from "@/lib/consultation-clinical";
import { isConsultationEditable } from "@/lib/consultation-utils";
import { zodFieldErrors } from "@/lib/form-utils";
import { renderMedicalCertificatePdf } from "@/lib/pdf";
import { formatPatientAge } from "@/lib/date-utils";
import { validateReason } from "@/lib/validation";
import type { ActionResult, ConsultationClinicalData, MedicalCertificate, VoidActionResult } from "@/lib/types";

const CLINICAL_ROLES: Role[] = [Role.admin, Role.doctor];

const CONSULTATION_LOCKED_ERROR =
  "This consultation is finalized and cannot be edited.";

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
  if (!roleAllowed(session, CLINICAL_ROLES)) return null;

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
  if (!roleAllowed(session, CLINICAL_ROLES)) return permissionDenied();

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
  if (!roleAllowed(session, CLINICAL_ROLES)) return permissionDenied();

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

export async function amendConsultation(
  id: string,
  data: ConsultationClinicalData,
  reason: string
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!roleAllowed(session, CLINICAL_ROLES)) return permissionDenied();

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
  if (!roleAllowed(session, CLINICAL_ROLES)) return permissionDenied();

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

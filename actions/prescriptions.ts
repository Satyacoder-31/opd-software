"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { z } from "zod";
import type { Gender } from "@prisma/client";
import { prisma } from "@/lib/db";
import { permissionDenied, requireSessionUser, roleAllowed } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { renderPrescriptionPdf } from "@/lib/pdf";
import { formatPatientAge } from "@/lib/date-utils";
import { isConsultationEditable } from "@/lib/consultation-utils";
import { validateReason } from "@/lib/validation";
import type { ActionResult, Medicine } from "@/lib/types";

const CLINICAL_ROLES: Role[] = [Role.admin, Role.doctor];

const CONSULTATION_LOCKED_ERROR =
  "This consultation is finalized and cannot be edited.";

const medicineSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  duration: z.string().min(1),
  instructions: z.string().optional(),
});

const prescriptionMetaSchema = z.object({
  advice: z.string().optional(),
  followUp: z.string().optional(),
});

function formatGender(gender: Gender | null | undefined): string | undefined {
  if (!gender) return undefined;
  return gender.charAt(0).toUpperCase() + gender.slice(1);
}

function formatPrescriptionDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export async function savePrescription(
  consultationId: string,
  medicines: Medicine[],
  meta?: { advice?: string; followUp?: string; amendmentReason?: string }
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSessionUser();
  if (!roleAllowed(session, CLINICAL_ROLES)) return permissionDenied();

  const consultation = await prisma.consultation.findFirst({
    where: { id: consultationId, clinicId: session.clinicId },
    include: { appointment: { select: { status: true } } },
  });

  if (!consultation) {
    return { success: false, error: "Consultation not found." };
  }

  const isActive = isConsultationEditable(consultation.appointment.status);
  let amendmentReasonValue: string | undefined;

  if (!isActive) {
    const reasonCheck = validateReason(meta?.amendmentReason, "Amendment reason");
    if (!reasonCheck.ok) {
      return { success: false, error: reasonCheck.error };
    }
    amendmentReasonValue = reasonCheck.reason;
  }

  const validated = z.array(medicineSchema).safeParse(medicines);
  if (!validated.success) {
    return { success: false, error: "Invalid medicine entries." };
  }

  const validatedMeta = prescriptionMetaSchema.safeParse(meta ?? {});
  if (!validatedMeta.success) {
    return { success: false, error: "Invalid prescription details." };
  }

  const prescription = await prisma.prescription.upsert({
    where: { consultationId },
    create: {
      clinicId: session.clinicId,
      consultationId,
      medicines: validated.data,
      advice: validatedMeta.data.advice?.trim() || null,
      followUp: validatedMeta.data.followUp?.trim() || null,
      createdById: session.userId,
    },
    update: {
      medicines: validated.data,
      advice: validatedMeta.data.advice?.trim() || null,
      followUp: validatedMeta.data.followUp?.trim() || null,
      updatedById: session.userId,
    },
  });

  if (amendmentReasonValue) {
    await prisma.consultation.updateMany({
      where: { id: consultationId, clinicId: session.clinicId },
      data: {
        amendmentReason: amendmentReasonValue,
        amendedAt: new Date(),
        amendedById: session.userId,
        updatedById: session.userId,
      },
    });
  }

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "prescription",
    resourceId: prescription.id,
    metadata: amendmentReasonValue
      ? { amendment: true, reason: amendmentReasonValue }
      : undefined,
  });

  revalidatePath(`/consultations/${consultationId}`);
  revalidatePath(`/consultations/${consultationId}/edit`);
  revalidatePath(`/consultations/${consultationId}/amend`);
  return { success: true, data: { id: prescription.id } };
}

export async function generatePrescriptionPdf(
  consultationId: string
): Promise<ActionResult<{ pdfBase64: string; filename: string }>> {
  const session = await requireSessionUser();
  if (!roleAllowed(session, CLINICAL_ROLES)) return permissionDenied();

  const consultation = await prisma.consultation.findFirst({
    where: { id: consultationId, clinicId: session.clinicId },
    include: {
      patient: true,
      doctor: true,
      prescription: true,
    },
  });

  if (!consultation?.prescription) {
    return { success: false, error: "Prescription not found." };
  }

  const clinic = await prisma.clinic.findUniqueOrThrow({
    where: { id: session.clinicId },
  });

  const medicines = consultation.prescription.medicines as Medicine[];
  const consultationDate = consultation.createdAt;

  const pdfBytes = await renderPrescriptionPdf({
    clinicName: clinic.name,
    clinicPhone: clinic.phone,
    clinicAddress: clinic.address,
    doctorName: consultation.doctor.name,
    doctorQualifications: consultation.doctor.qualifications ?? undefined,
    doctorRegistrationNo: consultation.doctor.registrationNo ?? undefined,
    date: formatPrescriptionDate(consultationDate),
    patientName: consultation.patient.name,
    patientAge: formatPatientAge(consultation.patient),
    patientGender: formatGender(consultation.patient.gender),
    patientMrn: consultation.patient.mrn,
    patientPhone: consultation.patient.phone,
    diagnosis: consultation.diagnosis ?? "",
    medicines,
    advice: consultation.prescription.advice ?? undefined,
    followUp: consultation.prescription.followUp ?? undefined,
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "export",
    resourceType: "prescription",
    resourceId: consultation.prescription.id,
  });

  const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
  const filename = `prescription-${consultation.patient.mrn}.pdf`;

  return { success: true, data: { pdfBase64, filename } };
}

export async function updateDoctorCredentials(
  userId: string,
  formData: FormData
): Promise<ActionResult<void>> {
  const session = await requireSessionUser();
  if (session.role !== "admin") {
    return { success: false, error: "Only admins can update doctor credentials." };
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, clinicId: session.clinicId, role: "doctor" },
  });

  if (!user) {
    return { success: false, error: "Doctor not found." };
  }

  const qualifications = (formData.get("qualifications") as string)?.trim() || null;
  const registrationNo = (formData.get("registrationNo") as string)?.trim() || null;

  await prisma.user.updateMany({
    where: { id: userId, clinicId: session.clinicId },
    data: { qualifications, registrationNo },
  });

  revalidatePath("/settings");
  revalidatePath("/settings/edit");
  return { success: true, data: undefined };
}

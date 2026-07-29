"use server";

import { readFileSync } from "node:fs";
import path from "node:path";
import { revalidatePath, revalidateTag } from "next/cache";
import type { Gender } from "@prisma/client";
import { prisma } from "@/lib/db";
import { permissionDenied, requireSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { renderPrescriptionPdf } from "@/lib/pdf";
import type { PrescriptionPdfProps } from "@/lib/pdf/prescription";
import { formatPatientAge } from "@/lib/date-utils";
import { isConsultationEditable } from "@/lib/consultation-utils";
import { validatePrescriptionDraft } from "@/lib/prescription-validation";
import { validateReason } from "@/lib/validation";
import { isPrescriptionLayoutId } from "@/lib/prescription-layouts";
import { recordPrescribedDrugs } from "@/lib/drug-catalog.server";
import { can } from "@/lib/rbac";
import type { ActionResult, Medicine, VoidActionResult } from "@/lib/types";

/** Dummy Maple Care mark for layout PDF previews (data URI for react-pdf). */
function sampleClinicLogoDataUri(): string {
  const logoPath = path.join(
    process.cwd(),
    "public",
    "sample",
    "maple-care-logo.png"
  );
  const bytes = readFileSync(logoPath);
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

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
  if (!can(session, "prescriptions.write")) return permissionDenied();

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
    if (consultation.appointment.status !== "done") {
      return {
        success: false,
        error: "Only finalized consultations can be amended.",
      };
    }
    const reasonCheck = validateReason(meta?.amendmentReason, "Amendment reason");
    if (!reasonCheck.ok) {
      return { success: false, error: reasonCheck.error };
    }
    amendmentReasonValue = reasonCheck.reason;
  }

  const validated = validatePrescriptionDraft(medicines, meta);
  if (!validated.ok) {
    return { success: false, error: validated.error };
  }

  const prescription = await prisma.$transaction(async (tx) => {
    const upserted = await tx.prescription.upsert({
      where: { consultationId },
      create: {
        clinicId: session.clinicId,
        consultationId,
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

    if (amendmentReasonValue) {
      await tx.consultation.updateMany({
        where: { id: consultationId, clinicId: session.clinicId },
        data: {
          amendmentReason: amendmentReasonValue,
          amendedAt: new Date(),
          amendedById: session.userId,
          updatedById: session.userId,
        },
      });
    }

    await recordPrescribedDrugs(tx, session.clinicId, validated.medicines);

    return upserted;
  });

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
  if (!can(session, "prescriptions.write")) return permissionDenied();

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
    clinicLogoUrl: clinic.logoUrl,
    doctorName: consultation.doctor.name,
    doctorQualifications: consultation.doctor.qualifications ?? undefined,
    doctorSpecialization: consultation.doctor.specialty ?? undefined,
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
    layout: clinic.prescriptionLayout,
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
  if (!can(session, "staff.manage")) {
    return { success: false, error: "Only clinic managers can update doctor credentials." };
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
  revalidatePath("/settings/staff");
  return { success: true, data: undefined };
}

const SAMPLE_PRESCRIPTION: Omit<PrescriptionPdfProps, "layout"> = {
  clinicName: "Maple Care Multispecialty Clinic",
  clinicPhone: "+91 191 245 6789",
  clinicAddress:
    "2nd Floor, Sunrise Plaza, Gandhi Nagar, Jammu, Jammu & Kashmir – 180004, India",
  clinicEmail: "care@maplecareclinic.com",
  doctorName: "Aditi Sharma",
  doctorQualifications: "MBBS, MD (General Medicine)",
  doctorSpecialization: "Consultant Physician",
  doctorExperience: "12 Years",
  doctorRegistrationNo: "KMC 45218",
  date: "19 Jul 2026",
  patientName: "Rahul Mehta",
  patientAge: "34 yrs",
  patientGender: "Male",
  patientMrn: "MRN-10482",
  patientPhone: "+91 99887 76655",
  diagnosis: "Acute pharyngitis with mild dehydration",
  medicines: [
    {
      name: "Amoxicillin 500 mg",
      dosage: "1 capsule",
      route: "Oral",
      frequency: "Three times daily",
      duration: "5 days",
      instructions: "After meals",
    },
    {
      name: "Paracetamol 650 mg",
      dosage: "1 tablet",
      route: "Oral",
      frequency: "As needed for fever",
      duration: "3 days",
      instructions: "Max 3 tablets / day",
    },
    {
      name: "ORS sachets",
      dosage: "1 sachet in 200 ml water",
      route: "Oral",
      frequency: "After every loose stool",
      duration: "Until recovered",
    },
  ],
  advice: "Warm saline gargles twice a day\nIncrease oral fluids\nRest for 48 hours",
  followUp: "Review after 5 days or sooner if fever persists",
};

export async function setPrescriptionLayout(
  layoutId: string
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "settings.access")) {
    return { success: false, error: "Only clinic managers can change the prescription layout." };
  }

  if (!isPrescriptionLayoutId(layoutId)) {
    return { success: false, error: "Unknown prescription layout." };
  }

  await prisma.clinic.update({
    where: { id: session.clinicId },
    data: { prescriptionLayout: layoutId },
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "clinic",
    resourceId: session.clinicId,
    metadata: { prescriptionLayout: layoutId },
  });

  revalidateTag("clinic-profile");
  revalidatePath("/settings");
  revalidatePath("/settings/prescriptions");
  return { success: true };
}

export async function previewPrescriptionLayout(
  layoutId: string
): Promise<ActionResult<{ pdfBase64: string; filename: string }>> {
  const session = await requireSessionUser();
  if (!can(session, "settings.access")) {
    return { success: false, error: "Only clinic managers can preview prescription layouts." };
  }

  if (!isPrescriptionLayoutId(layoutId)) {
    return { success: false, error: "Unknown prescription layout." };
  }

  // Layout previews use fixed sample clinic/doctor data so every template
  // is compared on equal footing (not the logged-in clinic's live address).
  const pdfBytes = await renderPrescriptionPdf({
    ...SAMPLE_PRESCRIPTION,
    clinicLogoUrl: sampleClinicLogoDataUri(),
    layout: layoutId,
  });

  return {
    success: true,
    data: {
      pdfBase64: Buffer.from(pdfBytes).toString("base64"),
      filename: `prescription-preview-${layoutId}.pdf`,
    },
  };
}



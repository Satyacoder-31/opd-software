"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { permissionDenied, requireSessionUser, roleAllowed } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult, VoidActionResult } from "@/lib/types";

const CLINICAL_ROLES: Role[] = [Role.admin, Role.doctor];
const STORAGE_BUCKET = "consultation-attachments";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function listConsultationAttachments(consultationId: string) {
  const session = await requireSessionUser();
  if (!roleAllowed(session, CLINICAL_ROLES)) return [];

  const consultation = await prisma.consultation.findFirst({
    where: { id: consultationId, clinicId: session.clinicId },
    select: { id: true },
  });
  if (!consultation) return [];

  return prisma.consultationAttachment.findMany({
    where: { consultationId, clinicId: session.clinicId },
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: { select: { name: true } } },
  });
}

export async function uploadConsultationAttachment(input: {
  consultationId: string;
  fileName: string;
  mimeType: string;
  base64: string;
}): Promise<ActionResult<{ id: string }>> {
  const session = await requireSessionUser();
  if (!roleAllowed(session, CLINICAL_ROLES)) return permissionDenied();

  if (!ALLOWED_TYPES.has(input.mimeType)) {
    return {
      success: false,
      error: "Only PDF and image files (JPEG, PNG, WebP) are allowed.",
    };
  }

  const buffer = Buffer.from(input.base64, "base64");
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_BYTES) {
    return { success: false, error: "File must be between 1 byte and 5 MB." };
  }

  const consultation = await prisma.consultation.findFirst({
    where: { id: input.consultationId, clinicId: session.clinicId },
    select: { id: true },
  });
  if (!consultation) {
    return { success: false, error: "Consultation not found." };
  }

  const safeName = input.fileName.replace(/[^\w.\- ()]/g, "_").slice(0, 120);
  const filePath = `${session.clinicId}/${input.consultationId}/${randomUUID()}-${safeName}`;

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, buffer, {
      contentType: input.mimeType,
      upsert: false,
    });

  if (uploadError) {
    return {
      success: false,
      error: `Upload failed: ${uploadError.message}. Ensure the "${STORAGE_BUCKET}" storage bucket exists.`,
    };
  }

  const attachment = await prisma.consultationAttachment.create({
    data: {
      clinicId: session.clinicId,
      consultationId: input.consultationId,
      fileName: safeName || "attachment",
      filePath,
      mimeType: input.mimeType,
      sizeBytes: buffer.byteLength,
      uploadedById: session.userId,
    },
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "create",
    resourceType: "consultation_attachment",
    resourceId: attachment.id,
  });

  revalidatePath(`/consultations/${input.consultationId}`);
  return { success: true, data: { id: attachment.id } };
}

export async function getAttachmentDownloadUrl(
  attachmentId: string
): Promise<ActionResult<{ url: string; fileName: string }>> {
  const session = await requireSessionUser();
  if (!roleAllowed(session, CLINICAL_ROLES)) return permissionDenied();

  const attachment = await prisma.consultationAttachment.findFirst({
    where: { id: attachmentId, clinicId: session.clinicId },
  });
  if (!attachment) {
    return { success: false, error: "Attachment not found." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(attachment.filePath, 60 * 10);

  if (error || !data?.signedUrl) {
    return { success: false, error: error?.message ?? "Could not create download link." };
  }

  return {
    success: true,
    data: { url: data.signedUrl, fileName: attachment.fileName },
  };
}

export async function deleteConsultationAttachment(
  attachmentId: string
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!roleAllowed(session, CLINICAL_ROLES)) return permissionDenied();

  const attachment = await prisma.consultationAttachment.findFirst({
    where: { id: attachmentId, clinicId: session.clinicId },
  });
  if (!attachment) {
    return { success: false, error: "Attachment not found." };
  }

  const admin = createAdminClient();
  await admin.storage.from(STORAGE_BUCKET).remove([attachment.filePath]);

  await prisma.consultationAttachment.delete({ where: { id: attachmentId } });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "delete",
    resourceType: "consultation_attachment",
    resourceId: attachmentId,
  });

  revalidatePath(`/consultations/${attachment.consultationId}`);
  return { success: true };
}

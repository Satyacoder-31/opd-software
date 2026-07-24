"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { permissionDenied, requireSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { isConsultationEditable } from "@/lib/consultation-utils";
import {
  ALLOWED_ATTACHMENT_TYPES,
  detectMimeType,
  isAllowedAttachmentMime,
  MAX_ATTACHMENT_BASE64_LENGTH,
  MAX_ATTACHMENT_BYTES,
} from "@/lib/file-type";
import { logger } from "@/lib/logger";
import { can } from "@/lib/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult, VoidActionResult } from "@/lib/types";

const STORAGE_BUCKET = "consultation-attachments";
const MAX_BYTES = MAX_ATTACHMENT_BYTES;
const MAX_BASE64_LENGTH = MAX_ATTACHMENT_BASE64_LENGTH;
const ALLOWED_TYPES = ALLOWED_ATTACHMENT_TYPES;

export async function listConsultationAttachments(consultationId: string) {
  const session = await requireSessionUser();
  if (!can(session, "attachments.manage")) return [];

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
  if (!can(session, "attachments.manage")) return permissionDenied();

  if (!input.base64 || input.base64.length > MAX_BASE64_LENGTH) {
    return { success: false, error: "File must be between 1 byte and 5 MB." };
  }

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

  const detected = detectMimeType(buffer);
  if (!isAllowedAttachmentMime(input.mimeType, detected) || !detected) {
    return {
      success: false,
      error: "File content does not match the declared file type.",
    };
  }

  const consultation = await prisma.consultation.findFirst({
    where: { id: input.consultationId, clinicId: session.clinicId },
    include: { appointment: { select: { status: true } } },
  });
  if (!consultation) {
    return { success: false, error: "Consultation not found." };
  }

  if (!isConsultationEditable(consultation.appointment.status)) {
    return {
      success: false,
      error: "Attachments can only be added while the consultation is in progress.",
    };
  }

  const safeName = input.fileName.replace(/[^\w.\- ()]/g, "_").slice(0, 120);
  const storageKey = `${session.clinicId}/${input.consultationId}/${randomUUID()}`;
  const filePath = storageKey;

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, buffer, {
      contentType: detected,
      upsert: false,
    });

  if (uploadError) {
    logger.error("attachment_upload_failed", {
      clinicId: session.clinicId,
      consultationId: input.consultationId,
      error: uploadError.message,
    });
    return {
      success: false,
      error: "Upload failed. Please try again.",
    };
  }

  try {
    const attachment = await prisma.consultationAttachment.create({
      data: {
        clinicId: session.clinicId,
        consultationId: input.consultationId,
        fileName: safeName || "attachment",
        filePath,
        mimeType: detected,
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
  } catch (error) {
    await admin.storage.from(STORAGE_BUCKET).remove([filePath]);
    logger.error("attachment_db_create_failed", {
      clinicId: session.clinicId,
      consultationId: input.consultationId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "Upload failed. Please try again." };
  }
}

export async function getAttachmentDownloadUrl(
  attachmentId: string
): Promise<ActionResult<{ url: string; fileName: string }>> {
  const session = await requireSessionUser();
  if (!can(session, "attachments.manage")) return permissionDenied();

  const attachment = await prisma.consultationAttachment.findFirst({
    where: { id: attachmentId, clinicId: session.clinicId },
  });
  if (!attachment) {
    return { success: false, error: "Attachment not found." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(attachment.filePath, 60 * 10, {
      download: attachment.fileName,
    });

  if (error || !data?.signedUrl) {
    logger.error("attachment_signed_url_failed", {
      attachmentId,
      error: error?.message,
    });
    return { success: false, error: "Could not create download link." };
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
  if (!can(session, "attachments.manage")) return permissionDenied();

  const attachment = await prisma.consultationAttachment.findFirst({
    where: { id: attachmentId, clinicId: session.clinicId },
    include: { consultation: { include: { appointment: { select: { status: true } } } } },
  });
  if (!attachment) {
    return { success: false, error: "Attachment not found." };
  }

  if (!isConsultationEditable(attachment.consultation.appointment.status)) {
    return {
      success: false,
      error: "Attachments can only be removed while the consultation is in progress.",
    };
  }

  const admin = createAdminClient();
  const { error: removeError } = await admin.storage
    .from(STORAGE_BUCKET)
    .remove([attachment.filePath]);

  if (removeError) {
    logger.error("attachment_storage_delete_failed", {
      attachmentId,
      error: removeError.message,
    });
    return { success: false, error: "Could not delete attachment. Please try again." };
  }

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

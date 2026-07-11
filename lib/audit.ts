"use server";

import { headers } from "next/headers";
import type { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export type AuditResourceType =
  | "patient"
  | "consultation"
  | "prescription"
  | "invoice"
  | "appointment"
  | "user"
  | "clinic"
  | "fee_item"
  | "prescription_template"
  | "consultation_attachment";

type AuditParams = {
  clinicId: string;
  actorId: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  metadata?: Record<string, unknown>;
};

export async function logAudit({
  clinicId,
  actorId,
  action,
  resourceType,
  resourceId,
  metadata,
}: AuditParams): Promise<void> {
  try {
    const headerStore = await headers();

    await prisma.auditLog.create({
      data: {
        clinicId,
        actorId,
        action,
        resourceType,
        resourceId,
        ipAddress:
          headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          headerStore.get("x-real-ip") ??
          null,
        userAgent: headerStore.get("user-agent"),
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    logger.error("audit_log_failed", {
      clinicId,
      actorId,
      action,
      resourceType,
      resourceId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

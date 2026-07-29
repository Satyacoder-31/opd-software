"use server";

import { headers } from "next/headers";
import type { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getClientIp } from "@/lib/rate-limit";

export type AuditResourceType =
  | "patient"
  | "consultation"
  | "prescription"
  | "invoice"
  | "appointment"
  | "user"
  | "clinic"
  | "fee_item"
  | "drug_catalog_item"
  | "prescription_template"
  | "consultation_attachment"
  | "lab_test"
  | "lab_order"
  | "lab_result"
  | "messaging_config"
  | "notification";

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
        ipAddress: getClientIp(
          headerStore.get("x-forwarded-for"),
          headerStore.get("x-real-ip"),
          headerStore.get("x-vercel-forwarded-for")
        ),
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

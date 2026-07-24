"use server";

import { type AuditAction, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";

const AUDIT_PAGE_SIZE = 50;

export type AuditLogFilters = {
  action?: AuditAction | "";
  resourceType?: string;
  actorId?: string;
  from?: string;
  to?: string;
  page?: number;
};

export async function getAuditLogs(filters: AuditLogFilters = {}) {
  const session = await requireSessionUser();
  if (!can(session, "audit.read")) return null;

  const page = Math.max(1, filters.page ?? 1);
  const skip = (page - 1) * AUDIT_PAGE_SIZE;

  const where: Prisma.AuditLogWhereInput = {
    clinicId: session.clinicId,
  };

  if (filters.action) {
    where.action = filters.action;
  }

  if (filters.resourceType?.trim()) {
    where.resourceType = filters.resourceType.trim();
  }

  if (filters.actorId?.trim()) {
    where.actorId = filters.actorId.trim();
  }

  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) {
      where.createdAt.gte = new Date(`${filters.from}T00:00:00`);
    }
    if (filters.to) {
      where.createdAt.lte = new Date(`${filters.to}T23:59:59.999`);
    }
  }

  const [logs, total, staff] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: AUDIT_PAGE_SIZE,
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
    prisma.auditLog.count({ where }),
    prisma.user.findMany({
      where: { clinicId: session.clinicId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true },
    }),
  ]);

  return {
    logs,
    total,
    page,
    pageSize: AUDIT_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE)),
    staff,
  };
}

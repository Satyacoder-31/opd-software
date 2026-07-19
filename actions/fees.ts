"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { permissionDenied, requireSessionUser, roleAllowed } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { zodFieldErrors } from "@/lib/form-utils";
import type { ActionResult, VoidActionResult } from "@/lib/types";

const ADMIN_ROLES: Role[] = [Role.admin];
const BILLING_ROLES: Role[] = [Role.admin, Role.receptionist];

const feeSchema = z.object({
  name: z.string().min(2),
  amount: z.coerce.number().positive(),
});

export async function listFeeItems(activeOnly = true) {
  const session = await requireSessionUser();
  if (!roleAllowed(session, BILLING_ROLES) && session.role !== Role.doctor) {
    return [];
  }

  return prisma.feeItem.findMany({
    where: {
      clinicId: session.clinicId,
      ...(activeOnly ? { isActive: true } : {}),
    },
    orderBy: { name: "asc" },
  });
}

export async function createFeeItem(
  formData: FormData
): Promise<ActionResult<{ id: string; name: string; amount: number }>> {
  const session = await requireSessionUser();
  if (!roleAllowed(session, ADMIN_ROLES)) return permissionDenied();

  const parsed = feeSchema.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid fee item.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const item = await prisma.feeItem.create({
    data: {
      clinicId: session.clinicId,
      name: parsed.data.name.trim(),
      amount: new Decimal(parsed.data.amount),
    },
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "create",
    resourceType: "fee_item",
    resourceId: item.id,
  });

  revalidatePath("/settings");
  return {
    success: true,
    data: {
      id: item.id,
      name: item.name,
      amount: Number(item.amount),
    },
  };
}

export async function updateFeeItem(
  id: string,
  formData: FormData
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!roleAllowed(session, ADMIN_ROLES)) return permissionDenied();

  const parsed = feeSchema.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid fee item.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const result = await prisma.feeItem.updateMany({
    where: { id, clinicId: session.clinicId },
    data: {
      name: parsed.data.name.trim(),
      amount: new Decimal(parsed.data.amount),
    },
  });

  if (result.count === 0) {
    return { success: false, error: "Fee item not found." };
  }

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "fee_item",
    resourceId: id,
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function setFeeItemActive(
  id: string,
  isActive: boolean
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!roleAllowed(session, ADMIN_ROLES)) return permissionDenied();

  const result = await prisma.feeItem.updateMany({
    where: { id, clinicId: session.clinicId },
    data: { isActive },
  });

  if (result.count === 0) {
    return { success: false, error: "Fee item not found." };
  }

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "fee_item",
    resourceId: id,
    metadata: { isActive },
  });

  revalidatePath("/settings");
  return { success: true };
}

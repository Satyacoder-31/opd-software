"use server";

import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { permissionDenied, requireSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { zodFieldErrors } from "@/lib/form-utils";
import { can } from "@/lib/rbac";
import type { ActionResult, VoidActionResult } from "@/lib/types";

const feeSchema = z.object({
  name: z.string().min(2),
  amount: z.coerce.number().positive(),
  hsnSac: z.string().trim().max(20).optional(),
});

export async function listFeeItems(activeOnly = true) {
  const session = await requireSessionUser();
  if (!can(session, "fees.read")) {
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
): Promise<ActionResult<{ id: string; name: string; amount: number; hsnSac: string | null }>> {
  const session = await requireSessionUser();
  if (!can(session, "fees.manage")) return permissionDenied();

  const parsed = feeSchema.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    hsnSac: formData.get("hsnSac") || undefined,
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
      hsnSac: parsed.data.hsnSac || null,
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
  revalidatePath("/settings/fees");
  return {
    success: true,
    data: {
      id: item.id,
      name: item.name,
      amount: Number(item.amount),
      hsnSac: item.hsnSac,
    },
  };
}

export async function updateFeeItem(
  id: string,
  formData: FormData
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "fees.manage")) return permissionDenied();

  const parsed = feeSchema.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    hsnSac: formData.get("hsnSac") || undefined,
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
      hsnSac: parsed.data.hsnSac || null,
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
  revalidatePath("/settings/fees");
  return { success: true };
}

export async function setFeeItemActive(
  id: string,
  isActive: boolean
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "fees.manage")) return permissionDenied();

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
  revalidatePath("/settings/fees");
  return { success: true };
}

/**
 * Seed Consultation / Follow-up fee items when the clinic has none yet.
 * Uses owner consultationFee when available for the Consultation amount.
 */
export async function seedDefaultFeeItems(): Promise<
  ActionResult<{ created: number }>
> {
  const session = await requireSessionUser();
  if (!can(session, "fees.manage") && !can(session, "clinic.manage")) {
    return permissionDenied();
  }

  const existing = await prisma.feeItem.count({
    where: { clinicId: session.clinicId },
  });
  if (existing > 0) {
    return { success: true, data: { created: 0 } };
  }

  const owner = await prisma.user.findFirst({
    where: {
      clinicId: session.clinicId,
      role: "owner",
      isActive: true,
    },
    select: { consultationFee: true },
    orderBy: { createdAt: "asc" },
  });

  const consultationAmount =
    owner?.consultationFee != null ? Number(owner.consultationFee) : 500;
  const followUpAmount = Math.max(
    100,
    Math.round(consultationAmount * 0.6),
  );

  await prisma.feeItem.createMany({
    data: [
      {
        clinicId: session.clinicId,
        name: "Consultation",
        amount: new Decimal(consultationAmount),
      },
      {
        clinicId: session.clinicId,
        name: "Follow-up",
        amount: new Decimal(followUpAmount),
      },
    ],
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "create",
    resourceType: "fee_item",
    resourceId: session.clinicId,
    metadata: { seeded: ["Consultation", "Follow-up"] },
  });

  revalidatePath("/settings/fees");
  return { success: true, data: { created: 2 } };
}

"use server";

import { LabItemStatus, LabOrderStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { permissionDenied, requireSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/rbac";
import type { ActionResult, VoidActionResult } from "@/lib/types";

const testSchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().max(30).optional(),
  sampleType: z.string().trim().max(60).optional(),
  feeAmount: z.number().nonnegative().optional(),
  hsnSac: z.string().trim().max(20).optional(),
  isActive: z.boolean().optional(),
});

export async function listLabTests(activeOnly = true) {
  const session = await requireSessionUser();
  if (!can(session, "labs.read")) return [];
  return prisma.labTest.findMany({
    where: { clinicId: session.clinicId, ...(activeOnly ? { isActive: true } : {}) },
    orderBy: { name: "asc" },
  });
}

export async function createLabTest(
  input: z.infer<typeof testSchema>,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSessionUser();
  if (!can(session, "labs.manage")) return permissionDenied();
  const parsed = testSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid lab test." };
  const test = await prisma.labTest.create({
    data: {
      clinicId: session.clinicId,
      ...parsed.data,
      code: parsed.data.code || null,
      sampleType: parsed.data.sampleType || null,
      feeAmount:
        parsed.data.feeAmount == null ? null : new Decimal(parsed.data.feeAmount),
      hsnSac: parsed.data.hsnSac || null,
    },
  });
  await logAudit({ clinicId: session.clinicId, actorId: session.userId, action: "create", resourceType: "lab_test", resourceId: test.id });
  revalidatePath("/labs");
  revalidatePath("/settings/labs");
  return { success: true, data: { id: test.id } };
}

export async function updateLabTest(
  id: string,
  input: z.infer<typeof testSchema>,
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "labs.manage")) return permissionDenied();
  const parsed = testSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid lab test." };
  const updated = await prisma.labTest.updateMany({
    where: { id, clinicId: session.clinicId },
    data: {
      ...parsed.data,
      code: parsed.data.code || null,
      sampleType: parsed.data.sampleType || null,
      feeAmount:
        parsed.data.feeAmount == null ? null : new Decimal(parsed.data.feeAmount),
      hsnSac: parsed.data.hsnSac || null,
    },
  });
  if (!updated.count) return { success: false, error: "Lab test not found." };
  await logAudit({ clinicId: session.clinicId, actorId: session.userId, action: "update", resourceType: "lab_test", resourceId: id });
  revalidatePath("/labs");
  revalidatePath("/settings/labs");
  return { success: true };
}

export async function deleteLabTest(id: string): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "labs.manage")) return permissionDenied();
  const used = await prisma.labOrderItem.count({ where: { labTestId: id, labTest: { clinicId: session.clinicId } } });
  if (used) {
    await prisma.labTest.updateMany({ where: { id, clinicId: session.clinicId }, data: { isActive: false } });
  } else {
    await prisma.labTest.deleteMany({ where: { id, clinicId: session.clinicId } });
  }
  revalidatePath("/labs");
  revalidatePath("/settings/labs");
  return { success: true };
}

export async function createLabOrder(
  consultationId: string,
  labTestIds: string[],
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSessionUser();
  if (!can(session, "labs.manage")) return permissionDenied();
  const ids = [...new Set(labTestIds.filter(Boolean))];
  if (!ids.length) return { success: false, error: "Select at least one lab test." };
  const consultation = await prisma.consultation.findFirst({
    where: { id: consultationId, clinicId: session.clinicId },
    select: { patientId: true },
  });
  if (!consultation) return { success: false, error: "Consultation not found." };
  const validTests = await prisma.labTest.findMany({
    where: { id: { in: ids }, clinicId: session.clinicId, isActive: true },
    select: { id: true },
  });
  if (validTests.length !== ids.length) return { success: false, error: "One or more lab tests are unavailable." };
  const order = await prisma.labOrder.create({
    data: {
      clinicId: session.clinicId,
      consultationId,
      patientId: consultation.patientId,
      orderedById: session.userId,
      items: { create: validTests.map((test) => ({ labTestId: test.id })) },
    },
  });
  await logAudit({ clinicId: session.clinicId, actorId: session.userId, action: "create", resourceType: "lab_order", resourceId: order.id });
  revalidatePath("/labs");
  revalidatePath(`/consultations/${consultationId}`);
  return { success: true, data: { id: order.id } };
}

export async function listLabOrders(status?: LabOrderStatus) {
  const session = await requireSessionUser();
  if (!can(session, "labs.read")) return [];
  return prisma.labOrder.findMany({
    where: { clinicId: session.clinicId, ...(status ? { status } : {}) },
    include: { patient: { select: { id: true, name: true, mrn: true } }, items: { include: { labTest: true } }, orderedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getLabOrdersForConsultation(consultationId: string) {
  const session = await requireSessionUser();
  if (!can(session, "labs.read")) return [];
  return prisma.labOrder.findMany({
    where: { consultationId, clinicId: session.clinicId },
    include: { items: { include: { labTest: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateLabOrderStatus(
  orderId: string,
  status: LabOrderStatus,
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "labs.results")) return permissionDenied();
  if (!Object.values(LabOrderStatus).includes(status)) return { success: false, error: "Invalid order status." };
  const updated = await prisma.labOrder.updateMany({ where: { id: orderId, clinicId: session.clinicId }, data: { status } });
  if (!updated.count) return { success: false, error: "Lab order not found." };
  revalidatePath("/labs");
  return { success: true };
}

export async function updateLabItemStatus(
  itemId: string,
  status: LabItemStatus,
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "labs.results")) return permissionDenied();
  if (!Object.values(LabItemStatus).includes(status)) return { success: false, error: "Invalid item status." };
  const item = await prisma.labOrderItem.findFirst({ where: { id: itemId, labOrder: { clinicId: session.clinicId } }, select: { id: true, labOrderId: true } });
  if (!item) return { success: false, error: "Lab item not found." };
  await prisma.labOrderItem.update({ where: { id: itemId }, data: { status } });
  await syncOrderStatus(item.labOrderId);
  revalidatePath("/labs");
  return { success: true };
}

async function syncOrderStatus(orderId: string) {
  const items = await prisma.labOrderItem.findMany({ where: { labOrderId: orderId }, select: { status: true } });
  const status = items.every((item) => item.status === LabItemStatus.resulted)
    ? LabOrderStatus.completed
    : items.some((item) => item.status === LabItemStatus.collected || item.status === LabItemStatus.resulted)
      ? LabOrderStatus.collected
      : LabOrderStatus.ordered;
  await prisma.labOrder.update({ where: { id: orderId }, data: { status } });
}

export async function enterLabResult(
  itemId: string,
  input: { resultValue: string; resultUnit?: string; resultNotes?: string },
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "labs.results")) return permissionDenied();
  if (!input.resultValue.trim()) return { success: false, error: "Enter a result value." };
  const item = await prisma.labOrderItem.findFirst({ where: { id: itemId, labOrder: { clinicId: session.clinicId } }, select: { labOrderId: true } });
  if (!item) return { success: false, error: "Lab item not found." };
  await prisma.labOrderItem.update({
    where: { id: itemId },
    data: {
      resultValue: input.resultValue.trim(),
      resultUnit: input.resultUnit?.trim() || null,
      resultNotes: input.resultNotes?.trim() || null,
      status: LabItemStatus.resulted,
      resultedAt: new Date(),
      resultedById: session.userId,
    },
  });
  await syncOrderStatus(item.labOrderId);
  await logAudit({ clinicId: session.clinicId, actorId: session.userId, action: "update", resourceType: "lab_result", resourceId: itemId });
  revalidatePath("/labs");
  return { success: true };
}

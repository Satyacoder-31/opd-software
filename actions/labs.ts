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

const DEFAULT_CLINICAL_LAB_TESTS = [
  { name: "Complete Blood Count (CBC)", code: "CBC", sampleType: "Blood (EDTA)", feeAmount: 350 },
  { name: "Erythrocyte Sedimentation Rate (ESR)", code: "ESR", sampleType: "Blood", feeAmount: 150 },
  { name: "C-Reactive Protein (CRP) Quantitative", code: "CRP", sampleType: "Blood (Serum)", feeAmount: 450 },
  { name: "Serum Uric Acid", code: "URIC", sampleType: "Blood (Serum)", feeAmount: 250 },
  { name: "Serum Calcium", code: "CA", sampleType: "Blood (Serum)", feeAmount: 250 },
  { name: "Serum Vitamin D3 (25-OH)", code: "VITD", sampleType: "Blood (Serum)", feeAmount: 1200 },
  { name: "Serum Vitamin B12", code: "VITB12", sampleType: "Blood (Serum)", feeAmount: 900 },
  { name: "Rheumatoid Factor (RA / RF Quantitative)", code: "RF", sampleType: "Blood (Serum)", feeAmount: 500 },
  { name: "Anti-CCP (Cyclic Citrullinated Peptide)", code: "ANTICCP", sampleType: "Blood (Serum)", feeAmount: 1400 },
  { name: "Serum Alkaline Phosphatase (ALP)", code: "ALP", sampleType: "Blood (Serum)", feeAmount: 250 },
  { name: "Fasting Blood Sugar (FBS / Glucose)", code: "FBS", sampleType: "Blood (Fluoride)", feeAmount: 120 },
  { name: "Post Prandial Blood Sugar (PPBS)", code: "PPBS", sampleType: "Blood (Fluoride)", feeAmount: 120 },
  { name: "HbA1c (Glycated Hemoglobin)", code: "HBA1C", sampleType: "Blood (EDTA)", feeAmount: 500 },
  { name: "Kidney Function Test (KFT / Creatinine & Urea)", code: "KFT", sampleType: "Blood (Serum)", feeAmount: 700 },
  { name: "Serum Creatinine", code: "CREAT", sampleType: "Blood (Serum)", feeAmount: 200 },
  { name: "Liver Function Test (LFT)", code: "LFT", sampleType: "Blood (Serum)", feeAmount: 750 },
  { name: "Lipid Profile (Cholesterol, Triglycerides)", code: "LIPID", sampleType: "Blood (Serum)", feeAmount: 650 },
  { name: "Urine Routine & Microscopic Examination", code: "URINE", sampleType: "Urine", feeAmount: 180 },
  { name: "Thyroid Profile (Total T3, T4, TSH)", code: "THYROID", sampleType: "Blood (Serum)", feeAmount: 550 },
  { name: "Prothrombin Time with INR (PT/INR)", code: "PTINR", sampleType: "Blood (Citrate)", feeAmount: 350 },
  { name: "Blood Grouping & Rh Typing", code: "BGRP", sampleType: "Blood (EDTA)", feeAmount: 150 },
  { name: "Viral Serology Screening (HIV, HBsAg, HCV)", code: "VIRAL", sampleType: "Blood (Serum)", feeAmount: 800 },
  { name: "Widal Test (Typhoid Slide/Tube)", code: "WIDAL", sampleType: "Blood (Serum)", feeAmount: 250 },
  { name: "Dengue Serology (NS1 Antigen & IgM/IgG)", code: "DENGUE", sampleType: "Blood (Serum)", feeAmount: 900 },
  { name: "Serum Ferritin", code: "FERRITIN", sampleType: "Blood (Serum)", feeAmount: 600 },
];

export async function listLabTests(activeOnly = true) {
  const session = await requireSessionUser();
  if (!can(session, "labs.read")) return [];
  const existing = await prisma.labTest.findMany({
    where: { clinicId: session.clinicId, ...(activeOnly ? { isActive: true } : {}) },
    orderBy: { name: "asc" },
  });

  if (existing.length > 0) return existing;

  // Auto-seed standard clinical tests if clinic catalog has 0 tests
  await prisma.labTest.createMany({
    data: DEFAULT_CLINICAL_LAB_TESTS.map((t) => ({
      clinicId: session.clinicId,
      name: t.name,
      code: t.code,
      sampleType: t.sampleType,
      feeAmount: new Decimal(t.feeAmount),
      isActive: true,
    })),
  });

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

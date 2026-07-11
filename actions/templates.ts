"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { permissionDenied, requireSessionUser, roleAllowed } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import type { ActionResult, Medicine, VoidActionResult } from "@/lib/types";

const DOCTOR_ROLES: Role[] = [Role.admin, Role.doctor];

const medicineSchema = z.object({
  name: z.string().min(1),
  dosage: z.string(),
  frequency: z.string(),
  duration: z.string(),
  instructions: z.string().optional(),
});

const templateSchema = z.object({
  name: z.string().min(2),
  medicines: z.array(medicineSchema).min(1),
  advice: z.string().optional(),
  followUp: z.string().optional(),
});

export async function listPrescriptionTemplates() {
  const session = await requireSessionUser();
  if (!roleAllowed(session, DOCTOR_ROLES)) return [];

  return prisma.prescriptionTemplate.findMany({
    where: {
      clinicId: session.clinicId,
      OR: [{ doctorId: null }, { doctorId: session.userId }],
    },
    orderBy: { name: "asc" },
  });
}

export async function savePrescriptionTemplate(input: {
  name: string;
  medicines: Medicine[];
  advice?: string;
  followUp?: string;
}): Promise<ActionResult<{ id: string }>> {
  const session = await requireSessionUser();
  if (!roleAllowed(session, DOCTOR_ROLES)) return permissionDenied();

  const parsed = templateSchema.safeParse({
    name: input.name,
    medicines: input.medicines.filter((m) => m.name.trim()),
    advice: input.advice?.trim() || undefined,
    followUp: input.followUp?.trim() || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: "Enter a template name and at least one medicine." };
  }

  const template = await prisma.prescriptionTemplate.create({
    data: {
      clinicId: session.clinicId,
      doctorId: session.role === Role.doctor ? session.userId : session.userId,
      name: parsed.data.name.trim(),
      medicines: parsed.data.medicines,
      advice: parsed.data.advice ?? null,
      followUp: parsed.data.followUp ?? null,
    },
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "create",
    resourceType: "prescription_template",
    resourceId: template.id,
  });

  revalidatePath("/consultations");
  return { success: true, data: { id: template.id } };
}

export async function deletePrescriptionTemplate(
  id: string
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!roleAllowed(session, DOCTOR_ROLES)) return permissionDenied();

  const existing = await prisma.prescriptionTemplate.findFirst({
    where: {
      id,
      clinicId: session.clinicId,
      OR: [{ doctorId: null }, { doctorId: session.userId }],
    },
  });

  if (!existing) {
    return { success: false, error: "Template not found." };
  }

  await prisma.prescriptionTemplate.delete({ where: { id } });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "delete",
    resourceType: "prescription_template",
    resourceId: id,
  });

  return { success: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { permissionDenied, requireSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  buildDrugSuggestions,
  normalizeDrugName,
  type DrugSuggestion,
} from "@/lib/drug-catalog";
import { backfillClinicDrugDefaultsFromCommon } from "@/lib/drug-catalog.server";
import { zodFieldErrors } from "@/lib/form-utils";
import { can } from "@/lib/rbac";
import type { ActionResult, VoidActionResult } from "@/lib/types";

const optionalText = z
  .string()
  .trim()
  .max(120)
  .optional()
  .transform((value) => (value ? value : undefined));

const drugSchema = z.object({
  name: z.string().trim().min(2, "Enter a medicine name.").max(160),
  dosage: optionalText,
  route: optionalText,
  frequency: optionalText,
  duration: optionalText,
  quantity: optionalText,
  instructions: optionalText,
});

const DRUG_DEFAULT_SELECT = {
  id: true,
  name: true,
  isActive: true,
  usageCount: true,
  dosage: true,
  route: true,
  frequency: true,
  duration: true,
  quantity: true,
  instructions: true,
  createdAt: true,
} as const;

export async function listDrugSuggestions(): Promise<DrugSuggestion[]> {
  const session = await requireSessionUser();
  if (!can(session, "drugs.search")) return [];

  // Heal name-only clinic rows created before prescribing defaults existed.
  await backfillClinicDrugDefaultsFromCommon(session.clinicId);

  const clinicEntries = await prisma.drugCatalogItem.findMany({
    where: { clinicId: session.clinicId, isActive: true },
    select: {
      id: true,
      name: true,
      normalizedName: true,
      usageCount: true,
      dosage: true,
      route: true,
      frequency: true,
      duration: true,
      quantity: true,
      instructions: true,
    },
    orderBy: [{ usageCount: "desc" }, { name: "asc" }],
    take: 300,
  });

  return buildDrugSuggestions(clinicEntries);
}

export async function listClinicDrugItems() {
  const session = await requireSessionUser();
  if (!can(session, "drugs.manage")) return [];

  await backfillClinicDrugDefaultsFromCommon(session.clinicId);

  return prisma.drugCatalogItem.findMany({
    where: { clinicId: session.clinicId },
    select: DRUG_DEFAULT_SELECT,
    orderBy: [{ usageCount: "desc" }, { name: "asc" }],
  });
}

export async function createDrugCatalogItem(
  formData: FormData
): Promise<
  ActionResult<{
    id: string;
    name: string;
    isActive: boolean;
    usageCount: number;
    dosage: string | null;
    route: string | null;
    frequency: string | null;
    duration: string | null;
    quantity: string | null;
    instructions: string | null;
  }>
> {
  const session = await requireSessionUser();
  if (!can(session, "drugs.manage")) return permissionDenied();

  const parsed = drugSchema.safeParse({
    name: formData.get("name"),
    dosage: formData.get("dosage") || undefined,
    route: formData.get("route") || undefined,
    frequency: formData.get("frequency") || undefined,
    duration: formData.get("duration") || undefined,
    quantity: formData.get("quantity") || undefined,
    instructions: formData.get("instructions") || undefined,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid medicine.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const name = parsed.data.name.replace(/\s+/g, " ");
  const normalizedName = normalizeDrugName(name);
  const defaults = {
    dosage: parsed.data.dosage ?? null,
    route: parsed.data.route ?? null,
    frequency: parsed.data.frequency ?? null,
    duration: parsed.data.duration ?? null,
    quantity: parsed.data.quantity ?? null,
    instructions: parsed.data.instructions ?? null,
  };

  try {
    const item = await prisma.drugCatalogItem.upsert({
      where: {
        clinicId_normalizedName: {
          clinicId: session.clinicId,
          normalizedName,
        },
      },
      create: {
        clinicId: session.clinicId,
        name,
        normalizedName,
        ...defaults,
      },
      update: {
        name,
        isActive: true,
        ...defaults,
      },
      select: DRUG_DEFAULT_SELECT,
    });

    await logAudit({
      clinicId: session.clinicId,
      actorId: session.userId,
      action: "create",
      resourceType: "drug_catalog_item",
      resourceId: item.id,
    });

    revalidatePath("/settings");
    revalidatePath("/settings/medicines");
    return { success: true, data: item };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, error: "This medicine is already in the dictionary." };
    }
    throw error;
  }
}

export async function updateDrugCatalogItem(
  formData: FormData
): Promise<
  ActionResult<{
    id: string;
    name: string;
    isActive: boolean;
    usageCount: number;
    dosage: string | null;
    route: string | null;
    frequency: string | null;
    duration: string | null;
    quantity: string | null;
    instructions: string | null;
  }>
> {
  const session = await requireSessionUser();
  if (!can(session, "drugs.manage")) return permissionDenied();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { success: false, error: "Medicine not found." };

  const parsed = drugSchema.safeParse({
    name: formData.get("name"),
    dosage: formData.get("dosage") || undefined,
    route: formData.get("route") || undefined,
    frequency: formData.get("frequency") || undefined,
    duration: formData.get("duration") || undefined,
    quantity: formData.get("quantity") || undefined,
    instructions: formData.get("instructions") || undefined,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid medicine.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const name = parsed.data.name.replace(/\s+/g, " ");
  const normalizedName = normalizeDrugName(name);

  try {
    const existing = await prisma.drugCatalogItem.findFirst({
      where: { id, clinicId: session.clinicId },
      select: { id: true },
    });
    if (!existing) return { success: false, error: "Medicine not found." };

    const item = await prisma.drugCatalogItem.update({
      where: { id },
      data: {
        name,
        normalizedName,
        dosage: parsed.data.dosage ?? null,
        route: parsed.data.route ?? null,
        frequency: parsed.data.frequency ?? null,
        duration: parsed.data.duration ?? null,
        quantity: parsed.data.quantity ?? null,
        instructions: parsed.data.instructions ?? null,
      },
      select: DRUG_DEFAULT_SELECT,
    });

    await logAudit({
      clinicId: session.clinicId,
      actorId: session.userId,
      action: "update",
      resourceType: "drug_catalog_item",
      resourceId: item.id,
    });

    revalidatePath("/settings");
    revalidatePath("/settings/medicines");
    return { success: true, data: item };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "Another dictionary entry already uses this name.",
      };
    }
    throw error;
  }
}

export async function setDrugCatalogItemActive(
  id: string,
  isActive: boolean
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "drugs.manage")) return permissionDenied();

  const result = await prisma.drugCatalogItem.updateMany({
    where: { id, clinicId: session.clinicId },
    data: { isActive },
  });

  if (result.count === 0) {
    return { success: false, error: "Medicine not found." };
  }

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "drug_catalog_item",
    resourceId: id,
    metadata: { isActive },
  });

  revalidatePath("/settings");
  revalidatePath("/settings/medicines");
  return { success: true };
}

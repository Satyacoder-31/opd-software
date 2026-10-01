"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { permissionDenied, requireSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/rbac";
import { normalizeDrugName, COMMON_DRUGS } from "@/lib/drug-catalog";
import type { ActionResult, VoidActionResult } from "@/lib/types";

const medicineFormSchema = z.object({
  name: z.string().trim().min(2, "Enter a medicine name.").max(160),
  genericName: z.string().trim().max(160).optional().nullable(),
  category: z.string().trim().max(50).optional().nullable(),
  strength: z.string().trim().max(60).optional().nullable(),
  manufacturer: z.string().trim().max(120).optional().nullable(),
  batchNumber: z.string().trim().max(60).optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  stockQuantity: z.number().int().min(0).default(0),
  reorderLevel: z.number().int().min(0).default(10),
  unitPrice: z.number().min(0).optional().nullable(),
  purchasePrice: z.number().min(0).optional().nullable(),
  rackLocation: z.string().trim().max(60).optional().nullable(),
  dosage: z.string().trim().max(120).optional().nullable(),
  route: z.string().trim().max(60).optional().nullable(),
  frequency: z.string().trim().max(60).optional().nullable(),
  duration: z.string().trim().max(60).optional().nullable(),
  quantity: z.string().trim().max(60).optional().nullable(),
  instructions: z.string().trim().max(160).optional().nullable(),
  isActive: z.boolean().default(true),
});

export type MedicineRecord = {
  id: string;
  name: string;
  normalizedName: string;
  genericName: string | null;
  category: string | null;
  strength: string | null;
  manufacturer: string | null;
  batchNumber: string | null;
  expiryDate: string | null;
  stockQuantity: number;
  reorderLevel: number;
  unitPrice: number | null;
  purchasePrice: number | null;
  rackLocation: string | null;
  dosage: string | null;
  route: string | null;
  frequency: string | null;
  duration: string | null;
  quantity: string | null;
  instructions: string | null;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
  isExpiringSoon: boolean;
  isExpired: boolean;
};

export type StockMovementRecord = {
  id: string;
  type: string;
  quantity: number;
  balanceAfter: number;
  reference: string | null;
  notes: string | null;
  createdAt: string;
  drug: {
    id: string;
    name: string;
    category: string | null;
  };
  createdByUser: {
    name: string;
  } | null;
};

export type MedicineStats = {
  totalMedicines: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringSoonCount: number;
  totalStockUnits: number;
  inventoryValuation: number;
};

export async function listMedicines(options?: {
  query?: string;
  category?: string;
  status?: "all" | "in_stock" | "low_stock" | "out_of_stock" | "expiring_soon" | "inactive";
  sortBy?: "name" | "stock" | "expiry" | "usage";
  sortOrder?: "asc" | "desc";
}): Promise<MedicineRecord[]> {
  const session = await requireSessionUser();
  if (!can(session, "drugs.search")) return [];

  const where: Prisma.DrugCatalogItemWhereInput = {
    clinicId: session.clinicId,
  };

  if (options?.query?.trim()) {
    const q = options.query.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { genericName: { contains: q, mode: "insensitive" } },
      { manufacturer: { contains: q, mode: "insensitive" } },
      { batchNumber: { contains: q, mode: "insensitive" } },
    ];
  }

  if (options?.category && options.category !== "all") {
    where.category = { equals: options.category, mode: "insensitive" };
  }

  if (options?.status === "inactive") {
    where.isActive = false;
  } else if (options?.status && options.status !== "all") {
    where.isActive = true;
  }

  const items = await prisma.drugCatalogItem.findMany({
    where,
    orderBy:
      options?.sortBy === "stock"
        ? { stockQuantity: options.sortOrder ?? "asc" }
        : options?.sortBy === "usage"
          ? { usageCount: options.sortOrder ?? "desc" }
          : options?.sortBy === "expiry"
            ? { expiryDate: options.sortOrder ?? "asc" }
            : { name: options?.sortOrder ?? "asc" },
  });

  const now = new Date();
  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(now.getDate() + 60);

  const formatted: MedicineRecord[] = items.map((item) => {
    const expiry = item.expiryDate ? new Date(item.expiryDate) : null;
    const isExpired = expiry ? expiry < now : false;
    const isExpiringSoon = expiry ? !isExpired && expiry <= sixtyDaysFromNow : false;

    let status: "in_stock" | "low_stock" | "out_of_stock" = "in_stock";
    if (item.stockQuantity <= 0) {
      status = "out_of_stock";
    } else if (item.stockQuantity <= item.reorderLevel) {
      status = "low_stock";
    }

    return {
      id: item.id,
      name: item.name,
      normalizedName: item.normalizedName,
      genericName: item.genericName,
      category: item.category,
      strength: item.strength,
      manufacturer: item.manufacturer,
      batchNumber: item.batchNumber,
      expiryDate: item.expiryDate ? item.expiryDate.toISOString().slice(0, 10) : null,
      stockQuantity: item.stockQuantity,
      reorderLevel: item.reorderLevel,
      unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
      purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
      rackLocation: item.rackLocation,
      dosage: item.dosage,
      route: item.route,
      frequency: item.frequency,
      duration: item.duration,
      quantity: item.quantity,
      instructions: item.instructions,
      isActive: item.isActive,
      usageCount: item.usageCount,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      status,
      isExpiringSoon,
      isExpired,
    };
  });

  if (options?.status === "in_stock") {
    return formatted.filter((m) => m.status === "in_stock");
  }
  if (options?.status === "low_stock") {
    return formatted.filter((m) => m.status === "low_stock");
  }
  if (options?.status === "out_of_stock") {
    return formatted.filter((m) => m.status === "out_of_stock");
  }
  if (options?.status === "expiring_soon") {
    return formatted.filter((m) => m.isExpiringSoon || m.isExpired);
  }

  return formatted;
}

export async function getMedicineStats(): Promise<MedicineStats> {
  const session = await requireSessionUser();
  if (!can(session, "drugs.search")) {
    return {
      totalMedicines: 0,
      inStockCount: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      expiringSoonCount: 0,
      totalStockUnits: 0,
      inventoryValuation: 0,
    };
  }

  const items = await prisma.drugCatalogItem.findMany({
    where: { clinicId: session.clinicId, isActive: true },
    select: {
      stockQuantity: true,
      reorderLevel: true,
      unitPrice: true,
      expiryDate: true,
    },
  });

  const now = new Date();
  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(now.getDate() + 60);

  let totalStockUnits = 0;
  let inventoryValuation = 0;
  let inStockCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let expiringSoonCount = 0;

  for (const item of items) {
    totalStockUnits += item.stockQuantity;
    if (item.unitPrice) {
      inventoryValuation += item.stockQuantity * Number(item.unitPrice);
    }

    if (item.stockQuantity <= 0) {
      outOfStockCount++;
    } else if (item.stockQuantity <= item.reorderLevel) {
      lowStockCount++;
    } else {
      inStockCount++;
    }

    if (item.expiryDate) {
      const exp = new Date(item.expiryDate);
      if (exp <= sixtyDaysFromNow) {
        expiringSoonCount++;
      }
    }
  }

  return {
    totalMedicines: items.length,
    inStockCount,
    lowStockCount,
    outOfStockCount,
    expiringSoonCount,
    totalStockUnits,
    inventoryValuation: Math.round(inventoryValuation),
  };
}

export async function createMedicine(
  input: z.infer<typeof medicineFormSchema>
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSessionUser();
  if (!can(session, "drugs.manage")) return permissionDenied();

  const parsed = medicineFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid medicine data." };
  }

  const data = parsed.data;
  const normalizedName = normalizeDrugName(data.name);
  if (!normalizedName) {
    return { success: false, error: "Medicine name cannot be empty." };
  }

  const existing = await prisma.drugCatalogItem.findFirst({
    where: { clinicId: session.clinicId, normalizedName },
  });

  if (existing) {
    return { success: false, error: `A medicine with the name "${data.name}" already exists.` };
  }

  const expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;

  const item = await prisma.$transaction(async (tx) => {
    const created = await tx.drugCatalogItem.create({
      data: {
        clinicId: session.clinicId,
        name: data.name,
        normalizedName,
        genericName: data.genericName || null,
        category: data.category || null,
        strength: data.strength || null,
        manufacturer: data.manufacturer || null,
        batchNumber: data.batchNumber || null,
        expiryDate,
        stockQuantity: data.stockQuantity,
        reorderLevel: data.reorderLevel,
        unitPrice: data.unitPrice != null ? new Decimal(data.unitPrice) : null,
        purchasePrice: data.purchasePrice != null ? new Decimal(data.purchasePrice) : null,
        rackLocation: data.rackLocation || null,
        dosage: data.dosage || null,
        route: data.route || null,
        frequency: data.frequency || null,
        duration: data.duration || null,
        quantity: data.quantity || null,
        instructions: data.instructions || null,
        isActive: data.isActive,
      },
    });

    if (data.stockQuantity > 0) {
      await tx.stockMovement.create({
        data: {
          clinicId: session.clinicId,
          drugCatalogItemId: created.id,
          type: "initial",
          quantity: data.stockQuantity,
          balanceAfter: data.stockQuantity,
          notes: `Initial stock opening balance (${data.batchNumber ? `Batch: ${data.batchNumber}` : "Standard batch"})`,
          createdById: session.userId,
        },
      });
    }

    return created;
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "create",
    resourceType: "drug_catalog_item",
    resourceId: item.id,
  });

  revalidatePath("/medicines");
  revalidatePath("/settings/drugs");
  return { success: true, data: { id: item.id } };
}

export async function updateMedicine(
  id: string,
  input: Partial<z.infer<typeof medicineFormSchema>>
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "drugs.manage")) return permissionDenied();

  const existing = await prisma.drugCatalogItem.findFirst({
    where: { id, clinicId: session.clinicId },
  });

  if (!existing) {
    return { success: false, error: "Medicine not found." };
  }

  const expiryDate = input.expiryDate !== undefined
    ? input.expiryDate ? new Date(input.expiryDate) : null
    : existing.expiryDate;

  await prisma.drugCatalogItem.update({
    where: { id },
    data: {
      name: input.name ?? existing.name,
      normalizedName: input.name ? normalizeDrugName(input.name) : existing.normalizedName,
      genericName: input.genericName !== undefined ? input.genericName : existing.genericName,
      category: input.category !== undefined ? input.category : existing.category,
      strength: input.strength !== undefined ? input.strength : existing.strength,
      manufacturer: input.manufacturer !== undefined ? input.manufacturer : existing.manufacturer,
      batchNumber: input.batchNumber !== undefined ? input.batchNumber : existing.batchNumber,
      expiryDate,
      reorderLevel: input.reorderLevel !== undefined ? input.reorderLevel : existing.reorderLevel,
      unitPrice: input.unitPrice !== undefined
        ? input.unitPrice != null ? new Decimal(input.unitPrice) : null
        : existing.unitPrice,
      purchasePrice: input.purchasePrice !== undefined
        ? input.purchasePrice != null ? new Decimal(input.purchasePrice) : null
        : existing.purchasePrice,
      rackLocation: input.rackLocation !== undefined ? input.rackLocation : existing.rackLocation,
      dosage: input.dosage !== undefined ? input.dosage : existing.dosage,
      route: input.route !== undefined ? input.route : existing.route,
      frequency: input.frequency !== undefined ? input.frequency : existing.frequency,
      duration: input.duration !== undefined ? input.duration : existing.duration,
      quantity: input.quantity !== undefined ? input.quantity : existing.quantity,
      instructions: input.instructions !== undefined ? input.instructions : existing.instructions,
      isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
    },
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "drug_catalog_item",
    resourceId: id,
  });

  revalidatePath("/medicines");
  revalidatePath("/settings/drugs");
  return { success: true };
}

export async function addStock(input: {
  medicineId: string;
  quantity: number;
  batchNumber?: string;
  expiryDate?: string;
  unitPrice?: number;
  purchasePrice?: number;
  notes?: string;
}): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "drugs.manage")) return permissionDenied();

  if (input.quantity <= 0) {
    return { success: false, error: "Quantity added must be greater than 0." };
  }

  const existing = await prisma.drugCatalogItem.findFirst({
    where: { id: input.medicineId, clinicId: session.clinicId },
  });

  if (!existing) {
    return { success: false, error: "Medicine not found." };
  }

  const newStock = existing.stockQuantity + input.quantity;
  const expiryDate = input.expiryDate ? new Date(input.expiryDate) : existing.expiryDate;

  await prisma.$transaction(async (tx) => {
    await tx.drugCatalogItem.update({
      where: { id: input.medicineId },
      data: {
        stockQuantity: newStock,
        ...(input.batchNumber ? { batchNumber: input.batchNumber.trim() } : {}),
        ...(input.expiryDate ? { expiryDate } : {}),
        ...(input.unitPrice != null ? { unitPrice: new Decimal(input.unitPrice) } : {}),
        ...(input.purchasePrice != null ? { purchasePrice: new Decimal(input.purchasePrice) } : {}),
      },
    });

    await tx.stockMovement.create({
      data: {
        clinicId: session.clinicId,
        drugCatalogItemId: input.medicineId,
        type: "purchase",
        quantity: input.quantity,
        balanceAfter: newStock,
        notes: input.notes?.trim() || `Restocked ${input.quantity} units ${input.batchNumber ? `(Batch: ${input.batchNumber})` : ""}`,
        createdById: session.userId,
      },
    });
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "drug_catalog_item",
    resourceId: input.medicineId,
    metadata: { action: "restock", quantity: input.quantity },
  });

  revalidatePath("/medicines");
  return { success: true };
}

export async function adjustStock(input: {
  medicineId: string;
  newQuantity: number;
  reason: "correction" | "damaged" | "expired" | "return" | "other";
  notes?: string;
}): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "drugs.manage")) return permissionDenied();

  if (input.newQuantity < 0) {
    return { success: false, error: "Stock quantity cannot be negative." };
  }

  const existing = await prisma.drugCatalogItem.findFirst({
    where: { id: input.medicineId, clinicId: session.clinicId },
  });

  if (!existing) {
    return { success: false, error: "Medicine not found." };
  }

  const delta = input.newQuantity - existing.stockQuantity;
  if (delta === 0) {
    return { success: true };
  }

  await prisma.$transaction(async (tx) => {
    await tx.drugCatalogItem.update({
      where: { id: input.medicineId },
      data: { stockQuantity: input.newQuantity },
    });

    await tx.stockMovement.create({
      data: {
        clinicId: session.clinicId,
        drugCatalogItemId: input.medicineId,
        type: input.reason === "expired" ? "expired" : input.reason === "return" ? "return" : "adjustment",
        quantity: delta,
        balanceAfter: input.newQuantity,
        notes: input.notes?.trim() || `Stock adjusted from ${existing.stockQuantity} to ${input.newQuantity} (Reason: ${input.reason})`,
        createdById: session.userId,
      },
    });
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "drug_catalog_item",
    resourceId: input.medicineId,
    metadata: { action: "adjust_stock", reason: input.reason, delta },
  });

  revalidatePath("/medicines");
  return { success: true };
}

export async function deleteMedicine(id: string): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "drugs.manage")) return permissionDenied();

  const usedInMovements = await prisma.stockMovement.count({
    where: { drugCatalogItemId: id, clinicId: session.clinicId },
  });

  if (usedInMovements > 0) {
    // If has transaction history, deactivate instead of hard delete to preserve audits
    await prisma.drugCatalogItem.updateMany({
      where: { id, clinicId: session.clinicId },
      data: { isActive: false },
    });
  } else {
    await prisma.drugCatalogItem.deleteMany({
      where: { id, clinicId: session.clinicId },
    });
  }

  revalidatePath("/medicines");
  revalidatePath("/settings/drugs");
  return { success: true };
}

export async function listStockMovements(options?: {
  drugId?: string;
  limit?: number;
}): Promise<StockMovementRecord[]> {
  const session = await requireSessionUser();
  if (!can(session, "drugs.search")) return [];

  const movements = await prisma.stockMovement.findMany({
    where: {
      clinicId: session.clinicId,
      ...(options?.drugId ? { drugCatalogItemId: options.drugId } : {}),
    },
    include: {
      drugCatalogItem: {
        select: { id: true, name: true, category: true },
      },
      createdBy: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 100,
  });

  return movements.map((m) => ({
    id: m.id,
    type: m.type,
    quantity: m.quantity,
    balanceAfter: m.balanceAfter,
    reference: m.reference,
    notes: m.notes,
    createdAt: m.createdAt.toISOString(),
    drug: {
      id: m.drugCatalogItem.id,
      name: m.drugCatalogItem.name,
      category: m.drugCatalogItem.category,
    },
    createdByUser: m.createdBy ? { name: m.createdBy.name } : null,
  }));
}

/**
 * Seeds or synchronizes the clinic's inventory with the complete catalog of generic and branded
 * medicines covering all types (Tablets, Capsules, Syrups, Injections, IV Fluids, Gels, Drops, Inhalers, Sachets, Suppositories).
 */
export async function seedCommonMedicinesWithStock(): Promise<ActionResult<{ addedCount: number }>> {
  const session = await requireSessionUser();
  if (!can(session, "drugs.manage")) return permissionDenied();

  const now = new Date();
  const nextYear = new Date();
  nextYear.setFullYear(now.getFullYear() + 2);
  const nextYearString = nextYear.toISOString().slice(0, 10);

  let addedCount = 0;

  for (const drug of COMMON_DRUGS) {
    const normalizedName = normalizeDrugName(drug.name);
    if (!normalizedName) continue;

    const existing = await prisma.drugCatalogItem.findFirst({
      where: { clinicId: session.clinicId, normalizedName },
    });

    const category = drug.category || "Tablet";
    const genericName = drug.genericName || null;
    const strength = drug.strength || null;

    // Set initial realistic stock and pricing depending on formulation
    let initialQty = 100;
    let samplePrice = 65;
    if (category === "Gel / Ointment") {
      initialQty = 25;
      samplePrice = 145;
    } else if (category === "Syrup") {
      initialQty = 30;
      samplePrice = 95;
    } else if (category === "Inhaler") {
      initialQty = 20;
      samplePrice = 320;
    } else if (category === "Injection") {
      initialQty = 40;
      samplePrice = 180;
    } else if (category === "IV Fluid") {
      initialQty = 30;
      samplePrice = 85;
    } else if (category === "Drops") {
      initialQty = 30;
      samplePrice = 120;
    } else if (category === "Sachet") {
      initialQty = 50;
      samplePrice = 45;
    } else if (category === "Capsule") {
      initialQty = 100;
      samplePrice = 110;
    } else if (category === "Suppository") {
      initialQty = 20;
      samplePrice = 85;
    }

    const reorderLevel = 15;
    const sampleBatch = `BTH-${now.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    if (!existing) {
      const created = await prisma.drugCatalogItem.create({
        data: {
          clinicId: session.clinicId,
          name: drug.name,
          normalizedName,
          genericName,
          category,
          strength,
          batchNumber: sampleBatch,
          expiryDate: new Date(nextYearString),
          stockQuantity: initialQty,
          reorderLevel,
          unitPrice: new Decimal(samplePrice),
          purchasePrice: new Decimal(Math.round(samplePrice * 0.7)),
          rackLocation: "Rack A-1",
          dosage: drug.dosage || null,
          route: drug.route || null,
          frequency: drug.frequency || null,
          duration: drug.duration || null,
          quantity: drug.quantity || null,
          instructions: drug.instructions || null,
          isActive: true,
          usageCount: 5,
        },
      });

      await prisma.stockMovement.create({
        data: {
          clinicId: session.clinicId,
          drugCatalogItemId: created.id,
          type: "initial",
          quantity: initialQty,
          balanceAfter: initialQty,
          notes: `Catalog import with opening stock (${initialQty} units)`,
          createdById: session.userId,
        },
      });

      addedCount++;
    } else {
      // Upgrade existing rows with genericName, category, and strength if missing
      const needsUpdate =
        !existing.genericName ||
        existing.category !== category ||
        existing.stockQuantity === 0;

      if (needsUpdate) {
        const updateData: Prisma.DrugCatalogItemUpdateInput = {
          genericName: genericName || existing.genericName,
          category: category || existing.category,
          strength: strength || existing.strength,
        };

        if (existing.stockQuantity === 0) {
          updateData.stockQuantity = initialQty;
          updateData.batchNumber = existing.batchNumber || sampleBatch;
          updateData.expiryDate = existing.expiryDate || new Date(nextYearString);
          updateData.unitPrice = existing.unitPrice || new Decimal(samplePrice);
          updateData.purchasePrice =
            existing.purchasePrice || new Decimal(Math.round(samplePrice * 0.7));

          await prisma.stockMovement.create({
            data: {
              clinicId: session.clinicId,
              drugCatalogItemId: existing.id,
              type: "initial",
              quantity: initialQty,
              balanceAfter: initialQty,
              notes: `Initial stock configured (${initialQty} units)`,
              createdById: session.userId,
            },
          });
          addedCount++;
        }

        await prisma.drugCatalogItem.update({
          where: { id: existing.id },
          data: updateData,
        });
      }
    }
  }

  revalidatePath("/medicines");
  revalidatePath("/settings/drugs");
  return { success: true, data: { addedCount } };
}

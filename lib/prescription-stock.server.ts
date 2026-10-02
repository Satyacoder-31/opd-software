import "server-only";

import type { Prisma, DrugCatalogItem } from "@prisma/client";
import {
  findCommonDrugByName,
  normalizeDrugName,
  parsePrescriptionQuantity,
} from "@/lib/drug-catalog";
import type { Medicine } from "@/lib/types";

/**
 * Intelligently matches a prescribed medicine string against a clinic's drug catalog.
 * Supports:
 * - Exact normalizedName match
 * - Case-insensitive exact name match
 * - Number-unit spacing normalization ("650mg" <-> "650 mg")
 * - Formulation prefix stripping (Tab., Cap., Syp., Inj., Oint., Gel, Drops)
 * - Common brand vs generic mappings (e.g. Dolo 650 <-> Paracetamol 650 mg)
 * - Prefix/starts-with matching (e.g. Prescribed "Dolo 650" matches catalog "Dolo 650 mg tablet")
 * - Substring contains match as fallback
 */
export async function findMatchingDrugItem(
  tx: Prisma.TransactionClient,
  clinicId: string,
  rawName: string
): Promise<DrugCatalogItem | null> {
  const trimmed = rawName.trim();
  if (!trimmed) return null;

  const norm = normalizeDrugName(trimmed);

  // 1. Exact normalizedName match
  let item = await tx.drugCatalogItem.findFirst({
    where: { clinicId, normalizedName: norm },
  });
  if (item) return item;

  // 2. Exact case-insensitive name match
  item = await tx.drugCatalogItem.findFirst({
    where: { clinicId, name: { equals: trimmed, mode: "insensitive" } },
  });
  if (item) return item;

  // 3. Spacing normalized around units (e.g., "650mg" <-> "650 mg")
  const spaced = trimmed.replace(/(\d+)\s*(mg|ml|mcg|gm|g|iu|%)/gi, "$1 $2").trim();
  const spacedNorm = normalizeDrugName(spaced);
  if (spacedNorm !== norm) {
    item = await tx.drugCatalogItem.findFirst({
      where: {
        clinicId,
        OR: [
          { normalizedName: spacedNorm },
          { name: { equals: spaced, mode: "insensitive" } },
        ],
      },
    });
    if (item) return item;
  }

  // 4. Strip medical formulation prefix (Tab., Cap., Syp., Inj., Oint., Gel, Drops, etc.)
  const stripped = trimmed
    .replace(/^(tab\.|tab|cap\.|cap|syp\.|syp|inj\.|inj|oint\.|oint|gel\.|gel|drops?)\s+/i, "")
    .trim();
  const strippedNorm = normalizeDrugName(stripped);
  if (strippedNorm !== norm && strippedNorm.length >= 2) {
    item = await tx.drugCatalogItem.findFirst({
      where: {
        clinicId,
        OR: [
          { normalizedName: strippedNorm },
          { name: { equals: stripped, mode: "insensitive" } },
        ],
      },
    });
    if (item) return item;
  }

  // 5. Look up common drug catalog to find associated generic/brand aliases
  const common = findCommonDrugByName(trimmed) || findCommonDrugByName(stripped);
  if (common) {
    const commonNorm = normalizeDrugName(common.name);
    const genericNorm = common.genericName ? normalizeDrugName(common.genericName) : null;

    const orConditions: Prisma.DrugCatalogItemWhereInput[] = [
      { normalizedName: commonNorm },
      { name: { equals: common.name, mode: "insensitive" } },
    ];
    if (common.genericName) {
      orConditions.push({
        genericName: { equals: common.genericName, mode: "insensitive" },
      });
      if (genericNorm) {
        orConditions.push({ normalizedName: genericNorm });
      }
    }

    item = await tx.drugCatalogItem.findFirst({
      where: {
        clinicId,
        OR: orConditions,
      },
    });
    if (item) return item;
  }

  // 6. Generic name match (if prescribed medicine matches genericName in catalog)
  item = await tx.drugCatalogItem.findFirst({
    where: { clinicId, genericName: { equals: trimmed, mode: "insensitive" } },
  });
  if (item) return item;

  // 7. Prefix matching (e.g., Prescribed "Dolo 650" matches catalog "Dolo 650 mg tablet")
  const targetPrefix = strippedNorm.length >= 3 ? strippedNorm : norm;
  item = await tx.drugCatalogItem.findFirst({
    where: {
      clinicId,
      OR: [
        { normalizedName: { startsWith: targetPrefix } },
        { name: { startsWith: stripped, mode: "insensitive" } },
        { genericName: { startsWith: stripped, mode: "insensitive" } },
      ],
    },
  });
  if (item) return item;

  // 8. Contains match for robust fallbacks
  if (targetPrefix.length >= 4) {
    item = await tx.drugCatalogItem.findFirst({
      where: {
        clinicId,
        OR: [
          { normalizedName: { contains: targetPrefix } },
          { name: { contains: stripped, mode: "insensitive" } },
        ],
      },
    });
    if (item) return item;
  }

  return null;
}

export type ApplyPrescriptionStockParams = {
  clinicId: string;
  consultationId: string;
  patientName: string;
  patientMrn: string;
  medicines: Medicine[];
  userId: string;
};

/**
 * Reverses previous consultation stock deductions (if any), then decrements
 * inventory stock and logs `StockMovement` records for all prescribed medicines.
 */
export async function applyPrescriptionStockMovements(
  tx: Prisma.TransactionClient,
  params: ApplyPrescriptionStockParams
): Promise<void> {
  const { clinicId, consultationId, patientName, patientMrn, medicines, userId } = params;

  // 1. Reverse any previous consultation stock deductions for this consultation
  // This allows clean re-calculation if a visit is re-completed, updated, or amended
  const previousMovements = await tx.stockMovement.findMany({
    where: {
      clinicId,
      reference: consultationId,
      type: "consultation",
    },
  });

  for (const prev of previousMovements) {
    const restoreQty = Math.abs(prev.quantity);
    await tx.drugCatalogItem.update({
      where: { id: prev.drugCatalogItemId },
      data: { stockQuantity: { increment: restoreQty } },
    });
  }

  if (previousMovements.length > 0) {
    await tx.stockMovement.deleteMany({
      where: {
        clinicId,
        reference: consultationId,
        type: "consultation",
      },
    });
  }

  // 2. Deduct stock and log stock movement for each prescribed medicine
  for (const m of medicines) {
    if (!m.name?.trim()) continue;

    const item = await findMatchingDrugItem(tx, clinicId, m.name);
    if (!item) continue;

    const qty = Math.max(1, parsePrescriptionQuantity(m));
    const newStock = Math.max(0, item.stockQuantity - qty);

    await tx.drugCatalogItem.update({
      where: { id: item.id },
      data: {
        stockQuantity: newStock,
        usageCount: { increment: 1 },
      },
    });

    await tx.stockMovement.create({
      data: {
        clinicId,
        drugCatalogItemId: item.id,
        type: "consultation",
        quantity: -qty,
        balanceAfter: newStock,
        reference: consultationId,
        notes: `Dispensed to ${patientName} (${patientMrn}) — ${m.name} (${qty} units)`,
        createdById: userId,
      },
    });
  }
}

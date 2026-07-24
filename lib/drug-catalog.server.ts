import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  defaultsForClinicEntry,
  defaultsFromMedicine,
  findCommonDrugByName,
  normalizeDrugName,
} from "@/lib/drug-catalog";
import type { Medicine } from "@/lib/types";

type PrescribedDrugInput = Pick<
  Medicine,
  | "name"
  | "dosage"
  | "route"
  | "frequency"
  | "duration"
  | "quantity"
  | "instructions"
>;

type CatalogDefaultsRow = {
  id: string;
  name: string;
  dosage: string | null;
  route: string | null;
  frequency: string | null;
  duration: string | null;
  quantity: string | null;
  instructions: string | null;
};

type DrugCatalogDb = Pick<typeof prisma, "drugCatalogItem">;

function needsDefaultsBackfill(row: CatalogDefaultsRow): boolean {
  return (
    !row.dosage?.trim() ||
    !row.route?.trim() ||
    !row.frequency?.trim() ||
    !row.duration?.trim() ||
    !row.instructions?.trim()
  );
}

/**
 * Persist common-drug defaults onto clinic dictionary rows that were created
 * before dosage/route/frequency fields existed (name-only entries).
 * Clinic-learned values are never overwritten.
 */
export async function backfillClinicDrugDefaultsFromCommon(
  clinicId: string,
  client: DrugCatalogDb = prisma
): Promise<number> {
  const rows = await client.drugCatalogItem.findMany({
    where: {
      clinicId,
      OR: [
        { dosage: null },
        { route: null },
        { frequency: null },
        { duration: null },
        { instructions: null },
        { dosage: "" },
        { route: "" },
        { frequency: "" },
        { duration: "" },
        { instructions: "" },
      ],
    },
    select: {
      id: true,
      name: true,
      dosage: true,
      route: true,
      frequency: true,
      duration: true,
      quantity: true,
      instructions: true,
    },
  });

  let updated = 0;

  await Promise.all(
    rows.map(async (row) => {
      if (!needsDefaultsBackfill(row)) return;
      if (!findCommonDrugByName(row.name)) return;

      const merged = defaultsForClinicEntry({
        ...row,
        normalizedName: normalizeDrugName(row.name),
        usageCount: 0,
      });

      const next = {
        dosage: row.dosage?.trim() || merged.dosage || null,
        route: row.route?.trim() || merged.route || null,
        frequency: row.frequency?.trim() || merged.frequency || null,
        duration: row.duration?.trim() || merged.duration || null,
        quantity: row.quantity?.trim() || merged.quantity || null,
        instructions: row.instructions?.trim() || merged.instructions || null,
      };

      const changed =
        next.dosage !== row.dosage ||
        next.route !== row.route ||
        next.frequency !== row.frequency ||
        next.duration !== row.duration ||
        next.quantity !== row.quantity ||
        next.instructions !== row.instructions;

      if (!changed) return;

      await client.drugCatalogItem.update({
        where: { id: row.id },
        data: next,
      });
      updated += 1;
    })
  );

  return updated;
}

/**
 * Upsert clinic dictionary entries from prescribed medicines, learning
 * last-used dosage/route/frequency/etc. so the next pick auto-fills.
 */
export async function recordPrescribedDrugs(
  tx: Prisma.TransactionClient,
  clinicId: string,
  medicines: PrescribedDrugInput[]
): Promise<void> {
  const unique = new Map<string, PrescribedDrugInput>();

  for (const medicine of medicines) {
    const name = medicine.name.trim().replace(/\s+/g, " ");
    const normalizedName = normalizeDrugName(name);
    if (!normalizedName) continue;
    unique.set(normalizedName, { ...medicine, name });
  }

  await Promise.all(
    [...unique].map(([normalizedName, medicine]) => {
      const defaults = defaultsFromMedicine(medicine);
      return tx.drugCatalogItem.upsert({
        where: {
          clinicId_normalizedName: { clinicId, normalizedName },
        },
        create: {
          clinicId,
          name: medicine.name,
          normalizedName,
          usageCount: 1,
          dosage: defaults.dosage ?? null,
          route: defaults.route ?? null,
          frequency: defaults.frequency ?? null,
          duration: defaults.duration ?? null,
          quantity: defaults.quantity ?? null,
          instructions: defaults.instructions ?? null,
        },
        update: {
          name: medicine.name,
          isActive: true,
          usageCount: { increment: 1 },
          ...(defaults.dosage !== undefined ? { dosage: defaults.dosage } : {}),
          ...(defaults.route !== undefined ? { route: defaults.route } : {}),
          ...(defaults.frequency !== undefined
            ? { frequency: defaults.frequency }
            : {}),
          ...(defaults.duration !== undefined
            ? { duration: defaults.duration }
            : {}),
          ...(defaults.quantity !== undefined
            ? { quantity: defaults.quantity }
            : {}),
          ...(defaults.instructions !== undefined
            ? { instructions: defaults.instructions }
            : {}),
        },
      });
    })
  );
}

import { z } from "zod";
import type { Medicine } from "@/lib/types";

export const medicineSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().min(1),
  route: z.string().optional(),
  frequency: z.string().min(1),
  duration: z.string().min(1),
  quantity: z.string().optional(),
  instructions: z.string().optional(),
});

export const prescriptionMetaSchema = z.object({
  advice: z.string().optional(),
  followUp: z.string().optional(),
});

function trim(value?: string | null): string {
  return value?.trim() ?? "";
}

/** True when every medicine field is blank. */
export function isBlankMedicineRow(medicine: Medicine): boolean {
  return (
    !trim(medicine.name) &&
    !trim(medicine.dosage) &&
    !trim(medicine.route) &&
    !trim(medicine.frequency) &&
    !trim(medicine.duration) &&
    !trim(medicine.quantity) &&
    !trim(medicine.instructions)
  );
}

/** True when a row has some content but is missing required fields. */
export function isPartialMedicineRow(medicine: Medicine): boolean {
  if (isBlankMedicineRow(medicine)) return false;
  return (
    !trim(medicine.name) ||
    !trim(medicine.dosage) ||
    !trim(medicine.frequency) ||
    !trim(medicine.duration)
  );
}

/** Drop fully blank rows; keep filled and partial rows for validation. */
export function normalizeMedicineRows(medicines: Medicine[]): Medicine[] {
  return medicines
    .filter((medicine) => !isBlankMedicineRow(medicine))
    .map((medicine) => ({
      name: trim(medicine.name),
      dosage: trim(medicine.dosage),
      route: trim(medicine.route) || undefined,
      frequency: trim(medicine.frequency),
      duration: trim(medicine.duration),
      quantity: trim(medicine.quantity) || undefined,
      instructions: trim(medicine.instructions) || undefined,
    }));
}

export type PrescriptionValidationResult =
  | { ok: true; medicines: Medicine[]; advice?: string; followUp?: string }
  | { ok: false; error: string };

export function validatePrescriptionDraft(
  medicines: Medicine[],
  meta?: { advice?: string | null; followUp?: string | null }
): PrescriptionValidationResult {
  const normalized = normalizeMedicineRows(medicines);
  const partialIndex = normalized.findIndex(isPartialMedicineRow);

  if (partialIndex >= 0) {
    return {
      ok: false,
      error: `Medicine ${partialIndex + 1} is incomplete. Fill name, dosage, frequency, and duration, or clear the row.`,
    };
  }

  const validated = z.array(medicineSchema).safeParse(normalized);
  if (!validated.success) {
    return { ok: false, error: "Invalid medicine entries." };
  }

  const validatedMeta = prescriptionMetaSchema.safeParse({
    advice: meta?.advice?.trim() || undefined,
    followUp: meta?.followUp?.trim() || undefined,
  });
  if (!validatedMeta.success) {
    return { ok: false, error: "Invalid prescription details." };
  }

  return {
    ok: true,
    medicines: validated.data,
    advice: validatedMeta.data.advice,
    followUp: validatedMeta.data.followUp,
  };
}

export function filledMedicineCount(medicines: Medicine[]): number {
  return normalizeMedicineRows(medicines).filter(
    (medicine) => !isPartialMedicineRow(medicine) && trim(medicine.name)
  ).length;
}

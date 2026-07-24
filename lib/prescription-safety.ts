import { normalizeDrugName } from "@/lib/drug-catalog";
import {
  isBlankMedicineRow,
  isPartialMedicineRow,
  normalizeMedicineRows,
} from "@/lib/prescription-validation";
import type { Medicine } from "@/lib/types";

export type PrescriptionSafetyCue = {
  id: string;
  severity: "warning" | "danger";
  message: string;
  medicineIndexes?: number[];
};

const STOP_WORDS = new Set([
  "mg",
  "mcg",
  "ml",
  "g",
  "iu",
  "tablet",
  "tablets",
  "capsule",
  "capsules",
  "syrup",
  "cream",
  "ointment",
  "inhaler",
  "sachet",
  "oral",
  "solution",
  "and",
  "with",
  "plus",
  "acid",
  "sodium",
  "hcl",
  "hydrochloride",
]);

function tokenizeDrugName(name: string): string[] {
  return normalizeDrugName(name)
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

/**
 * Match prescribed medicines against free-text patient allergies.
 * Uses token overlap so "Amoxicillin 500 mg" hits allergy "Penicillin / Amoxicillin".
 */
export function findAllergyConflicts(
  medicines: Medicine[],
  allergies?: string | null
): PrescriptionSafetyCue[] {
  const allergyText = allergies?.trim();
  if (!allergyText) return [];

  const allergyNormalized = normalizeDrugName(allergyText);
  if (
    allergyNormalized === "nkda" ||
    allergyNormalized === "nil" ||
    allergyNormalized === "none" ||
    allergyNormalized === "no known drug allergies"
  ) {
    return [];
  }

  const cues: PrescriptionSafetyCue[] = [];

  medicines.forEach((medicine, index) => {
    const name = medicine.name?.trim();
    if (!name) return;

    const tokens = tokenizeDrugName(name);
    const hit =
      tokens.some((token) => allergyNormalized.includes(token)) ||
      allergyNormalized
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length >= 3)
        .some((token) => normalizeDrugName(name).includes(token));

    if (hit) {
      cues.push({
        id: `allergy-${index}`,
        severity: "danger",
        message: `Possible allergy conflict: “${name}” may relate to recorded allergies (${allergyText}).`,
        medicineIndexes: [index],
      });
    }
  });

  return cues;
}

/** Flag duplicate drug names (normalized) on the same Rx. */
export function findDuplicateMedicines(
  medicines: Medicine[]
): PrescriptionSafetyCue[] {
  const groups = new Map<string, number[]>();

  medicines.forEach((medicine, index) => {
    const name = medicine.name?.trim();
    if (!name) return;
    const key = normalizeDrugName(name);
    const existing = groups.get(key) ?? [];
    existing.push(index);
    groups.set(key, existing);
  });

  const cues: PrescriptionSafetyCue[] = [];
  for (const indexes of groups.values()) {
    if (indexes.length < 2) continue;
    const name = medicines[indexes[0]]?.name?.trim() ?? "Medicine";
    cues.push({
      id: `duplicate-${indexes.join("-")}`,
      severity: "warning",
      message: `Duplicate medicine: “${name}” appears ${indexes.length} times.`,
      medicineIndexes: indexes,
    });
  }

  return cues;
}

/** Soft cue when the Rx has no complete medicines (draft may still save). */
export function emptyPrescriptionCue(
  medicines: Medicine[]
): PrescriptionSafetyCue | null {
  const normalized = normalizeMedicineRows(medicines);
  if (normalized.length === 0) {
    return {
      id: "empty-rx",
      severity: "warning",
      message:
        "No medicines on this prescription yet. Add at least one complete medicine before printing.",
    };
  }

  const partial = medicines.findIndex(
    (medicine) =>
      !isBlankMedicineRow(medicine) && isPartialMedicineRow(medicine)
  );
  if (partial >= 0) {
    return {
      id: `partial-${partial}`,
      severity: "warning",
      message: `Medicine ${partial + 1} is incomplete — fill dosage, frequency, and duration, or remove the row.`,
      medicineIndexes: [partial],
    };
  }

  return null;
}

export function collectPrescriptionSafetyCues(
  medicines: Medicine[],
  allergies?: string | null
): PrescriptionSafetyCue[] {
  const cues: PrescriptionSafetyCue[] = [];
  const empty = emptyPrescriptionCue(medicines);
  if (empty) cues.push(empty);
  cues.push(...findDuplicateMedicines(medicines));
  cues.push(...findAllergyConflicts(medicines, allergies));
  return cues;
}

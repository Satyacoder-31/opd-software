import type { Medicine } from "@/lib/types";

/** Prescribing defaults applied when a medicine is picked in the Rx builder. */
export type DrugPrescribingDefaults = {
  dosage?: string;
  route?: string;
  frequency?: string;
  duration?: string;
  quantity?: string;
  instructions?: string;
};

export type DrugSuggestion = {
  id: string;
  name: string;
  source: "common" | "clinic";
  usageCount: number;
  defaults: DrugPrescribingDefaults;
};

export type ClinicDrugEntry = {
  id: string;
  name: string;
  normalizedName: string;
  usageCount: number;
  dosage?: string | null;
  route?: string | null;
  frequency?: string | null;
  duration?: string | null;
  quantity?: string | null;
  instructions?: string | null;
};

export type CommonDrug = {
  name: string;
} & DrugPrescribingDefaults;

function oral(
  name: string,
  overrides: DrugPrescribingDefaults = {}
): CommonDrug {
  return {
    name,
    dosage: "1 tablet",
    route: "Oral",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "After meals",
    ...overrides,
  };
}

function topical(name: string, overrides: DrugPrescribingDefaults = {}): CommonDrug {
  return {
    name,
    dosage: "Apply thinly",
    route: "Topical",
    frequency: "Twice daily",
    duration: "7 Days",
    instructions: "Apply to affected area",
    ...overrides,
  };
}

function inhaler(name: string, overrides: DrugPrescribingDefaults = {}): CommonDrug {
  return {
    name,
    dosage: "2 puffs",
    route: "Inhalation",
    frequency: "Twice daily",
    duration: "Until review",
    instructions: "Rinse mouth after use",
    ...overrides,
  };
}

// Generic names with typical Indian OPD defaults — clinics overwrite via usage.
export const COMMON_DRUGS: readonly CommonDrug[] = [
  oral("Paracetamol 500 mg tablet", {
    frequency: "Three times daily",
    duration: "3 Days",
    instructions: "After meals",
  }),
  oral("Aceclofenac 100 mg + Paracetamol 325 mg", {
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "Strictly after meals with water",
  }),
  oral("Thiocolchicoside 4 mg + Aceclofenac 100 mg", {
    dosage: "1 capsule",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "After food (Muscle relaxant)",
  }),
  oral("Etoricoxib 90 mg tablet", {
    frequency: "Once daily",
    duration: "5 Days",
    instructions: "After dinner for acute joint inflammation",
  }),
  oral("Calcium Citrate Malate 1250 mg + Vitamin D3 1000 IU", {
    dosage: "1 tablet",
    frequency: "Once daily",
    duration: "30 Days",
    instructions: "Post-dinner with milk/water",
  }),
  oral("Pregabalin 75 mg + Methylcobalamin 1500 mcg", {
    dosage: "1 capsule",
    frequency: "Once daily at bedtime",
    duration: "15 Days",
    instructions: "For sciatica / radicular nerve pain",
  }),
  oral("Diacerein 50 mg + Glucosamine 750 mg", {
    dosage: "1 tablet",
    frequency: "Once daily",
    duration: "30 Days",
    instructions: "Cartilage protective agent after food",
  }),
  topical("Diclofenac Diethylamine 1.16% Gel", {
    dosage: "Apply gently",
    frequency: "Three times daily",
    duration: "10 Days",
    instructions: "Apply over affected joint without vigorous massage",
  }),
  oral("Paracetamol 650 mg tablet", {
    frequency: "Three times daily",
    duration: "3 Days",
  }),
  oral("Ibuprofen 400 mg tablet", {
    frequency: "Three times daily",
    duration: "3 Days",
    instructions: "After meals",
  }),
  oral("Diclofenac 50 mg tablet", {
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "After meals",
  }),
  oral("Aceclofenac 100 mg tablet", {
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "After meals",
  }),
  oral("Aspirin 75 mg tablet", {
    dosage: "1 tablet",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
    instructions: "After meals",
  }),
  oral("Amoxicillin 500 mg capsule", {
    dosage: "1 capsule",
    frequency: "Three times daily",
    duration: "5 Days",
  }),
  oral("Amoxicillin + Clavulanic acid 625 mg tablet", {
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "After meals",
  }),
  oral("Azithromycin 500 mg tablet", {
    frequency: "Once daily",
    duration: "3 Days",
  }),
  oral("Cefixime 200 mg tablet", {
    frequency: "Twice daily",
    duration: "5 Days",
  }),
  oral("Cefuroxime 500 mg tablet", {
    frequency: "Twice daily",
    duration: "5 Days",
  }),
  oral("Ciprofloxacin 500 mg tablet", {
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "After meals",
  }),
  oral("Doxycycline 100 mg capsule", {
    dosage: "1 capsule",
    frequency: "Twice daily",
    duration: "7 Days",
    instructions: "After meals",
  }),
  oral("Metronidazole 400 mg tablet", {
    frequency: "Three times daily",
    duration: "5 Days",
    instructions: "After meals",
  }),
  oral("Cetirizine 10 mg tablet", {
    frequency: "Once daily",
    duration: "5 Days",
    instructions: "At bedtime",
  }),
  oral("Levocetirizine 5 mg tablet", {
    frequency: "Once daily",
    duration: "5 Days",
    instructions: "At bedtime",
  }),
  oral("Fexofenadine 120 mg tablet", {
    frequency: "Once daily",
    duration: "5 Days",
    instructions: "Before meals",
  }),
  oral("Montelukast 10 mg tablet", {
    frequency: "Once daily",
    duration: "14 Days",
    instructions: "At bedtime",
  }),
  inhaler("Salbutamol inhaler 100 mcg", {
    frequency: "As needed",
    duration: "Until review",
    instructions: "Use as needed for wheeze",
  }),
  inhaler("Budesonide inhaler 200 mcg"),
  oral("Pantoprazole 40 mg tablet", {
    frequency: "Once daily",
    duration: "14 Days",
    instructions: "Before meals",
  }),
  oral("Omeprazole 20 mg capsule", {
    dosage: "1 capsule",
    frequency: "Once daily",
    duration: "14 Days",
    instructions: "Before meals",
  }),
  oral("Famotidine 20 mg tablet", {
    frequency: "Twice daily",
    duration: "14 Days",
    instructions: "Before meals",
  }),
  oral("Ondansetron 4 mg tablet", {
    frequency: "As needed",
    duration: "3 Days",
    instructions: "As needed for nausea",
  }),
  oral("Domperidone 10 mg tablet", {
    frequency: "Three times daily",
    duration: "5 Days",
    instructions: "Before meals",
  }),
  oral("ORS sachet", {
    dosage: "1 sachet",
    frequency: "As needed",
    duration: "3 Days",
    instructions: "Dissolve in clean water",
  }),
  oral("Zinc 20 mg tablet", {
    frequency: "Once daily",
    duration: "14 Days",
  }),
  oral("Loperamide 2 mg capsule", {
    dosage: "1 capsule",
    frequency: "As needed",
    duration: "2 Days",
    instructions: "After each loose stool",
  }),
  oral("Lactulose oral solution", {
    dosage: "15 ml",
    frequency: "Once daily",
    duration: "7 Days",
    instructions: "At bedtime",
  }),
  oral("Bisacodyl 5 mg tablet", {
    frequency: "Once daily",
    duration: "3 Days",
    instructions: "At bedtime",
  }),
  oral("Metformin 500 mg tablet", {
    frequency: "Twice daily",
    duration: "Ongoing / continuous",
    instructions: "After meals",
  }),
  oral("Glimepiride 1 mg tablet", {
    frequency: "Once daily",
    duration: "Ongoing / continuous",
    instructions: "Before meals",
  }),
  oral("Sitagliptin 100 mg tablet", {
    frequency: "Once daily",
    duration: "Ongoing / continuous",
    instructions: "After meals",
  }),
  oral("Amlodipine 5 mg tablet", {
    frequency: "Once daily",
    duration: "Ongoing / continuous",
  }),
  oral("Telmisartan 40 mg tablet", {
    frequency: "Once daily",
    duration: "Ongoing / continuous",
  }),
  oral("Losartan 50 mg tablet", {
    frequency: "Once daily",
    duration: "Ongoing / continuous",
  }),
  oral("Enalapril 5 mg tablet", {
    frequency: "Once daily",
    duration: "Ongoing / continuous",
  }),
  oral("Atenolol 50 mg tablet", {
    frequency: "Once daily",
    duration: "Ongoing / continuous",
  }),
  oral("Metoprolol 25 mg tablet", {
    frequency: "Twice daily",
    duration: "Ongoing / continuous",
  }),
  oral("Hydrochlorothiazide 12.5 mg tablet", {
    frequency: "Once daily",
    duration: "Ongoing / continuous",
    instructions: "In the morning",
  }),
  oral("Furosemide 40 mg tablet", {
    frequency: "Once daily",
    duration: "Until review",
    instructions: "In the morning",
  }),
  oral("Atorvastatin 10 mg tablet", {
    frequency: "Once daily",
    duration: "Ongoing / continuous",
    instructions: "At bedtime",
  }),
  oral("Rosuvastatin 10 mg tablet", {
    frequency: "Once daily",
    duration: "Ongoing / continuous",
    instructions: "At bedtime",
  }),
  oral("Clopidogrel 75 mg tablet", {
    frequency: "Once daily",
    duration: "Ongoing / continuous",
  }),
  oral("Levothyroxine 50 mcg tablet", {
    frequency: "Once daily",
    duration: "Ongoing / continuous",
    instructions: "On an empty stomach",
  }),
  oral("Prednisolone 5 mg tablet", {
    frequency: "Once daily",
    duration: "5 Days",
    instructions: "After meals",
  }),
  topical("Hydrocortisone 1% cream"),
  topical("Clotrimazole 1% cream", { duration: "14 Days" }),
  topical("Mupirocin 2% ointment", { duration: "5 Days" }),
  topical("Permethrin 5% cream", {
    dosage: "Apply once",
    frequency: "Immediately",
    duration: "1 Days",
    instructions: "Leave on overnight, wash off",
  }),
  oral("Fluconazole 150 mg tablet", {
    frequency: "Immediately",
    duration: "1 Days",
  }),
  oral("Acyclovir 400 mg tablet", {
    frequency: "Three times daily",
    duration: "5 Days",
  }),
  oral("Albendazole 400 mg tablet", {
    frequency: "Immediately",
    duration: "1 Days",
    instructions: "After meals",
  }),
  oral("Calcium + Vitamin D3 tablet", {
    frequency: "Once daily",
    duration: "30 Days",
  }),
  oral("Vitamin D3 60,000 IU capsule", {
    dosage: "1 capsule",
    frequency: "Once weekly",
    duration: "8 Weeks",
    instructions: "After meals",
  }),
  oral("Ferrous ascorbate + Folic acid tablet", {
    frequency: "Once daily",
    duration: "30 Days",
    instructions: "After meals",
  }),
  oral("Folic acid 5 mg tablet", {
    frequency: "Once daily",
    duration: "30 Days",
  }),
  oral("Methylcobalamin 500 mcg tablet", {
    frequency: "Once daily",
    duration: "30 Days",
  }),
  oral("Tranexamic acid 500 mg tablet", {
    frequency: "Three times daily",
    duration: "3 Days",
  }),
  oral("Tamsulosin 0.4 mg capsule", {
    dosage: "1 capsule",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
    instructions: "At bedtime",
  }),
] as const;

function trimOptional(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function defaultsFromEntry(
  entry: Pick<
    ClinicDrugEntry,
    | "dosage"
    | "route"
    | "frequency"
    | "duration"
    | "quantity"
    | "instructions"
  >
): DrugPrescribingDefaults {
  return {
    dosage: trimOptional(entry.dosage),
    route: trimOptional(entry.route),
    frequency: trimOptional(entry.frequency),
    duration: trimOptional(entry.duration),
    quantity: trimOptional(entry.quantity),
    instructions: trimOptional(entry.instructions),
  };
}

export function defaultsFromCommonDrug(
  drug: CommonDrug
): DrugPrescribingDefaults {
  return {
    dosage: trimOptional(drug.dosage),
    route: trimOptional(drug.route),
    frequency: trimOptional(drug.frequency),
    duration: trimOptional(drug.duration),
    quantity: trimOptional(drug.quantity),
    instructions: trimOptional(drug.instructions),
  };
}

/** Look up a built-in common medicine by name (normalized). */
export function findCommonDrugByName(name: string): CommonDrug | null {
  const key = normalizeDrugName(name);
  if (!key) return null;
  return (
    COMMON_DRUGS.find((drug) => normalizeDrugName(drug.name) === key) ?? null
  );
}

/**
 * Fill blank prescribing fields from a fallback (e.g. common-drug defaults).
 * Existing clinic/learned values always win.
 */
export function mergePrescribingDefaults(
  primary: DrugPrescribingDefaults,
  fallback: DrugPrescribingDefaults
): DrugPrescribingDefaults {
  return {
    dosage: primary.dosage ?? fallback.dosage,
    route: primary.route ?? fallback.route,
    frequency: primary.frequency ?? fallback.frequency,
    duration: primary.duration ?? fallback.duration,
    quantity: primary.quantity ?? fallback.quantity,
    instructions: primary.instructions ?? fallback.instructions,
  };
}

/** Clinic entry defaults, with common-drug fallbacks for any blank fields. */
export function defaultsForClinicEntry(
  entry: ClinicDrugEntry
): DrugPrescribingDefaults {
  const own = defaultsFromEntry(entry);
  const common = findCommonDrugByName(entry.name);
  if (!common) return own;
  return mergePrescribingDefaults(own, defaultsFromCommonDrug(common));
}

export function defaultsFromMedicine(
  medicine: Pick<
    Medicine,
    "dosage" | "route" | "frequency" | "duration" | "quantity" | "instructions"
  >
): DrugPrescribingDefaults {
  return {
    dosage: trimOptional(medicine.dosage),
    route: trimOptional(medicine.route),
    frequency: trimOptional(medicine.frequency),
    duration: trimOptional(medicine.duration),
    quantity: trimOptional(medicine.quantity),
    instructions: trimOptional(medicine.instructions),
  };
}

/**
 * Merge catalog defaults onto a medicine row when the doctor picks a suggestion.
 * Catalog values win for fields that have a default; blank fields get light fallbacks.
 */
export function applyDrugDefaults(
  current: Medicine,
  name: string,
  defaults: DrugPrescribingDefaults
): Medicine {
  const dosage = defaults.dosage ?? current.dosage?.trim() ?? "1 tablet";
  const route = defaults.route ?? current.route?.trim() ?? "Oral";
  const frequency = defaults.frequency ?? current.frequency?.trim() ?? "";
  const duration = defaults.duration ?? current.duration?.trim() ?? "";
  const instructions =
    defaults.instructions ?? current.instructions?.trim() ?? "";
  const quantity = defaults.quantity ?? current.quantity?.trim() ?? "";

  return {
    ...current,
    name,
    dosage,
    route,
    frequency,
    duration,
    quantity,
    instructions,
  };
}

/** Compact label for dictionary list rows (e.g. "Oral · BD · 5 Days"). */
export function formatDrugDefaultsSummary(
  defaults: DrugPrescribingDefaults
): string {
  const parts = [
    defaults.route,
    defaults.dosage,
    defaults.frequency,
    defaults.duration,
    defaults.instructions,
  ].filter((part): part is string => Boolean(part?.trim()));
  return parts.join(" · ");
}

export function normalizeDrugName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
}

export function buildDrugSuggestions(
  clinicEntries: ClinicDrugEntry[]
): DrugSuggestion[] {
  const seen = new Set<string>();
  const suggestions: DrugSuggestion[] = [];

  const rankedClinicEntries = [...clinicEntries].sort(
    (a, b) =>
      b.usageCount - a.usageCount ||
      a.name.localeCompare(b.name, "en", { sensitivity: "base" })
  );

  for (const entry of rankedClinicEntries) {
    const normalized = entry.normalizedName || normalizeDrugName(entry.name);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    suggestions.push({
      id: entry.id,
      name: entry.name,
      source: "clinic",
      usageCount: entry.usageCount,
      // Older clinic rows may only have a name — fill blanks from COMMON_DRUGS.
      defaults: defaultsForClinicEntry(entry),
    });
  }

  COMMON_DRUGS.forEach((drug, index) => {
    const normalized = normalizeDrugName(drug.name);
    if (seen.has(normalized)) return;
    seen.add(normalized);
    suggestions.push({
      id: `common-${index}`,
      name: drug.name,
      source: "common",
      usageCount: 0,
      defaults: defaultsFromCommonDrug(drug),
    });
  });

  return suggestions;
}

export function filterDrugSuggestions(
  suggestions: DrugSuggestion[],
  query: string,
  limit = 8
): DrugSuggestion[] {
  const normalizedQuery = normalizeDrugName(query);
  if (!normalizedQuery) return suggestions.slice(0, limit);

  return suggestions
    .map((suggestion, index) => {
      const normalizedName = normalizeDrugName(suggestion.name);
      const matchIndex = normalizedName.indexOf(normalizedQuery);
      return { suggestion, index, normalizedName, matchIndex };
    })
    .filter((item) => item.matchIndex >= 0)
    .sort(
      (a, b) =>
        Number(b.normalizedName.startsWith(normalizedQuery)) -
          Number(a.normalizedName.startsWith(normalizedQuery)) ||
        b.suggestion.usageCount - a.suggestion.usageCount ||
        a.matchIndex - b.matchIndex ||
        a.index - b.index
    )
    .slice(0, limit)
    .map((item) => item.suggestion);
}

/** Look up defaults for a medicine name from an already-built suggestion list. */
export function findDrugSuggestion(
  suggestions: DrugSuggestion[],
  name: string
): DrugSuggestion | null {
  const key = normalizeDrugName(name);
  if (!key) return null;
  return (
    suggestions.find((item) => normalizeDrugName(item.name) === key) ?? null
  );
}

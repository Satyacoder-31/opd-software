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
  stockQuantity?: number;
  reorderLevel?: number;
  genericName?: string | null;
  category?: string | null;
  strength?: string | null;
  batchNumber?: string | null;
  expiryDate?: Date | string | null;
  unitPrice?: number | null;
  defaults: DrugPrescribingDefaults;
};

export type ClinicDrugEntry = {
  id: string;
  name: string;
  normalizedName: string;
  usageCount: number;
  stockQuantity?: number;
  reorderLevel?: number;
  genericName?: string | null;
  category?: string | null;
  strength?: string | null;
  batchNumber?: string | null;
  expiryDate?: Date | string | null;
  unitPrice?: number | null;
  dosage?: string | null;
  route?: string | null;
  frequency?: string | null;
  duration?: string | null;
  quantity?: string | null;
  instructions?: string | null;
};

export type CommonDrug = {
  name: string;
  genericName?: string;
  category?: string;
  strength?: string;
  form?: string;
  therapeuticClass?: string;
} & DrugPrescribingDefaults;

/* Helper constructors */
function oral(
  name: string,
  overrides: DrugPrescribingDefaults & {
    genericName?: string;
    category?: string;
    strength?: string;
    therapeuticClass?: string;
  } = {}
): CommonDrug {
  const { genericName, category = "Tablet", strength, therapeuticClass, ...defaults } = overrides;
  return {
    name,
    genericName,
    category,
    strength,
    form: category,
    therapeuticClass,
    dosage: "1 tablet",
    route: "Oral",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "After meals",
    ...defaults,
  };
}

function capsule(
  name: string,
  overrides: DrugPrescribingDefaults & {
    genericName?: string;
    category?: string;
    strength?: string;
    therapeuticClass?: string;
  } = {}
): CommonDrug {
  const { genericName, category = "Capsule", strength, therapeuticClass, ...defaults } = overrides;
  return {
    name,
    genericName,
    category,
    strength,
    form: category,
    therapeuticClass,
    dosage: "1 capsule",
    route: "Oral",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "After meals",
    ...defaults,
  };
}

function syrup(
  name: string,
  overrides: DrugPrescribingDefaults & {
    genericName?: string;
    category?: string;
    strength?: string;
    therapeuticClass?: string;
  } = {}
): CommonDrug {
  const { genericName, category = "Syrup", strength, therapeuticClass, ...defaults } = overrides;
  return {
    name,
    genericName,
    category,
    strength,
    form: category,
    therapeuticClass,
    dosage: "5 ml",
    route: "Oral",
    frequency: "Three times daily",
    duration: "5 Days",
    instructions: "After meals",
    ...defaults,
  };
}

function topical(
  name: string,
  overrides: DrugPrescribingDefaults & {
    genericName?: string;
    category?: string;
    strength?: string;
    therapeuticClass?: string;
  } = {}
): CommonDrug {
  const { genericName, category = "Gel / Ointment", strength, therapeuticClass, ...defaults } = overrides;
  return {
    name,
    genericName,
    category,
    strength,
    form: category,
    therapeuticClass,
    dosage: "Apply thinly",
    route: "Topical",
    frequency: "Twice daily",
    duration: "7 Days",
    instructions: "Apply gently to affected area",
    ...defaults,
  };
}

function inhaler(
  name: string,
  overrides: DrugPrescribingDefaults & {
    genericName?: string;
    category?: string;
    strength?: string;
    therapeuticClass?: string;
  } = {}
): CommonDrug {
  const { genericName, category = "Inhaler", strength, therapeuticClass, ...defaults } = overrides;
  return {
    name,
    genericName,
    category,
    strength,
    form: category,
    therapeuticClass,
    dosage: "2 puffs",
    route: "Inhalation",
    frequency: "Twice daily",
    duration: "Until review",
    instructions: "Rinse mouth thoroughly after use",
    ...defaults,
  };
}

function drops(
  name: string,
  route: "Ophthalmic" | "Otic" | "Nasal",
  overrides: DrugPrescribingDefaults & {
    genericName?: string;
    category?: string;
    strength?: string;
    therapeuticClass?: string;
  } = {}
): CommonDrug {
  const { genericName, category = "Drops", strength, therapeuticClass, ...defaults } = overrides;
  return {
    name,
    genericName,
    category,
    strength,
    form: category,
    therapeuticClass,
    dosage: "1-2 drops",
    route,
    frequency: "Three times daily",
    duration: "5 Days",
    instructions: route === "Ophthalmic" ? "Instill into affected eye" : route === "Otic" ? "Instill into affected ear canal" : "Instill into nostrils",
    ...defaults,
  };
}

function inj(
  name: string,
  route: "Intramuscular" | "Intravenous" | "Subcutaneous",
  overrides: DrugPrescribingDefaults & {
    genericName?: string;
    category?: string;
    strength?: string;
    therapeuticClass?: string;
  } = {}
): CommonDrug {
  const { genericName, category = "Injection", strength, therapeuticClass, ...defaults } = overrides;
  return {
    name,
    genericName,
    category,
    strength,
    form: category,
    therapeuticClass,
    dosage: "1 ampoule / vial",
    route,
    frequency: "Stat (Single dose)",
    duration: "1 Day",
    instructions: "Administer under nursing supervision",
    ...defaults,
  };
}

function ivFluid(
  name: string,
  overrides: DrugPrescribingDefaults & {
    genericName?: string;
    category?: string;
    strength?: string;
    therapeuticClass?: string;
  } = {}
): CommonDrug {
  const { genericName, category = "IV Fluid", strength, therapeuticClass, ...defaults } = overrides;
  return {
    name,
    genericName,
    category,
    strength,
    form: "IV Infusion",
    therapeuticClass,
    dosage: "500 ml",
    route: "Intravenous",
    frequency: "Once daily / As needed",
    duration: "1 Day",
    instructions: "Slow IV infusion at 30-40 drops/min",
    ...defaults,
  };
}

function sachet(
  name: string,
  overrides: DrugPrescribingDefaults & {
    genericName?: string;
    category?: string;
    strength?: string;
    therapeuticClass?: string;
  } = {}
): CommonDrug {
  const { genericName, category = "Sachet", strength, therapeuticClass, ...defaults } = overrides;
  return {
    name,
    genericName,
    category,
    strength,
    form: category,
    therapeuticClass,
    dosage: "1 sachet",
    route: "Oral",
    frequency: "Once daily",
    duration: "30 Days",
    instructions: "Dissolve completely in a glass of clean water or milk",
    ...defaults,
  };
}

function suppository(
  name: string,
  route: "Rectal" | "Vaginal",
  overrides: DrugPrescribingDefaults & {
    genericName?: string;
    category?: string;
    strength?: string;
    therapeuticClass?: string;
  } = {}
): CommonDrug {
  const { genericName, category = "Suppository", strength, therapeuticClass, ...defaults } = overrides;
  return {
    name,
    genericName,
    category,
    strength,
    form: category,
    therapeuticClass,
    dosage: "1 unit",
    route,
    frequency: "At bedtime",
    duration: "3 Days",
    instructions: "Insert deeply at bedtime",
    ...defaults,
  };
}

/**
 * Comprehensive Indian OPD Medicine Catalog
 * Covers generic medications, standard Indian brand equivalents with mapped generic salts,
 * and all forms (Tablets, Capsules, Syrups, Injections, IV Fluids, Gels/Ointments, Drops, Inhalers, Sachets, Suppositories).
 */
export const COMMON_DRUGS: readonly CommonDrug[] = [
  /* ====================================================================
   * 1. ANALGESICS, NSAIDs, ANTIPYRETICS & MUSCLE RELAXANTS (ORAL)
   * ==================================================================== */
  oral("Paracetamol 500 mg tablet", {
    genericName: "Paracetamol",
    strength: "500 mg",
    therapeuticClass: "Analgesic / Antipyretic",
    frequency: "Three times daily",
    duration: "3 Days",
    instructions: "After meals",
  }),
  oral("Paracetamol 650 mg tablet", {
    genericName: "Paracetamol",
    strength: "650 mg",
    therapeuticClass: "Analgesic / Antipyretic",
    frequency: "Three times daily",
    duration: "3 Days",
    instructions: "After meals for fever / severe pain",
  }),
  oral("Dolo 650 mg tablet", {
    genericName: "Paracetamol 650 mg",
    strength: "650 mg",
    therapeuticClass: "Analgesic / Antipyretic",
    frequency: "Three times daily",
    duration: "3 Days",
    instructions: "After meals for body ache & fever",
  }),
  oral("Calpol 500 mg tablet", {
    genericName: "Paracetamol 500 mg",
    strength: "500 mg",
    therapeuticClass: "Analgesic / Antipyretic",
    frequency: "Three times daily",
    duration: "3 Days",
  }),
  oral("Crocin 650 mg tablet", {
    genericName: "Paracetamol 650 mg",
    strength: "650 mg",
    therapeuticClass: "Analgesic / Antipyretic",
    frequency: "Three times daily",
    duration: "3 Days",
  }),
  oral("Ibuprofen 400 mg tablet", {
    genericName: "Ibuprofen",
    strength: "400 mg",
    therapeuticClass: "NSAID / Anti-inflammatory",
    frequency: "Three times daily",
    duration: "3 Days",
    instructions: "Strictly after meals",
  }),
  oral("Combiflam tablet", {
    genericName: "Ibuprofen 400 mg + Paracetamol 325 mg",
    strength: "400 mg / 325 mg",
    therapeuticClass: "NSAID / Analgesic Combination",
    frequency: "Twice daily",
    duration: "3 Days",
    instructions: "After meals with water",
  }),
  oral("Diclofenac 50 mg tablet", {
    genericName: "Diclofenac Sodium",
    strength: "50 mg",
    therapeuticClass: "NSAID / Analgesic",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "After meals",
  }),
  oral("Aceclofenac 100 mg tablet", {
    genericName: "Aceclofenac",
    strength: "100 mg",
    therapeuticClass: "NSAID / Anti-inflammatory",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "After meals",
  }),
  oral("Aceclofenac 100 mg + Paracetamol 325 mg", {
    genericName: "Aceclofenac + Paracetamol",
    strength: "100 mg / 325 mg",
    therapeuticClass: "NSAID / Analgesic Combination",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "Strictly after meals with water",
  }),
  oral("Zerodol-P tablet", {
    genericName: "Aceclofenac 100 mg + Paracetamol 325 mg",
    strength: "100 mg / 325 mg",
    therapeuticClass: "NSAID / Analgesic Combination",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "Strictly after meals with water",
  }),
  oral("Zerodol-SP tablet", {
    genericName: "Aceclofenac 100 mg + Paracetamol 325 mg + Serratiopeptidase 15 mg",
    strength: "100 mg / 325 mg / 15 mg",
    therapeuticClass: "NSAID / Anti-edema Combination",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "After meals for post-traumatic pain & swelling",
  }),
  capsule("Thiocolchicoside 4 mg + Aceclofenac 100 mg", {
    genericName: "Thiocolchicoside + Aceclofenac",
    strength: "4 mg / 100 mg",
    therapeuticClass: "Muscle Relaxant / NSAID",
    dosage: "1 capsule",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "After food (Muscle spasm relief)",
  }),
  oral("Chlorzoxazone 500 mg + Paracetamol 325 mg + Diclofenac 50 mg tablet", {
    genericName: "Chlorzoxazone + Paracetamol + Diclofenac",
    strength: "500 mg / 325 mg / 50 mg",
    therapeuticClass: "Skeletal Muscle Relaxant Combination",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "After meals for acute back spasm",
  }),
  capsule("Tramadol 50 mg capsule", {
    genericName: "Tramadol HCl",
    strength: "50 mg",
    therapeuticClass: "Opioid Analgesic",
    dosage: "1 capsule",
    frequency: "As needed (SOS)",
    duration: "3 Days",
    instructions: "Take for severe pain only; may cause drowsiness",
  }),
  oral("Ultracet tablet", {
    genericName: "Tramadol 37.5 mg + Paracetamol 325 mg",
    strength: "37.5 mg / 325 mg",
    therapeuticClass: "Moderate-to-Severe Pain Analgesic",
    frequency: "Twice daily as needed",
    duration: "3 Days",
    instructions: "After food; avoid driving",
  }),
  oral("Etoricoxib 90 mg tablet", {
    genericName: "Etoricoxib",
    strength: "90 mg",
    therapeuticClass: "Selective COX-2 Inhibitor",
    frequency: "Once daily",
    duration: "5 Days",
    instructions: "After dinner for acute joint inflammation",
  }),
  oral("Etoricoxib 60 mg tablet", {
    genericName: "Etoricoxib",
    strength: "60 mg",
    therapeuticClass: "Selective COX-2 Inhibitor",
    frequency: "Once daily",
    duration: "10 Days",
    instructions: "After food for chronic osteoarthritis flare",
  }),
  oral("Naproxen 500 mg tablet", {
    genericName: "Naproxen",
    strength: "500 mg",
    therapeuticClass: "NSAID / Anti-inflammatory",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "After meals with full glass of water",
  }),
  oral("Mefenamic Acid 500 mg tablet", {
    genericName: "Mefenamic Acid",
    strength: "500 mg",
    therapeuticClass: "NSAID / Antispasmodic",
    frequency: "Three times daily",
    duration: "3 Days",
    instructions: "After meals for colic or dental pain",
  }),
  oral("Meftal-Spas tablet", {
    genericName: "Mefenamic Acid 250 mg + Dicyclomine HCl 10 mg",
    strength: "250 mg / 10 mg",
    therapeuticClass: "Antispasmodic / Colic Relief",
    frequency: "As needed / Twice daily",
    duration: "3 Days",
    instructions: "For spasmodic abdominal / menstrual pain",
  }),
  oral("Tolperisone 150 mg tablet", {
    genericName: "Tolperisone HCl",
    strength: "150 mg",
    therapeuticClass: "Centrally Acting Muscle Relaxant",
    frequency: "Twice daily",
    duration: "7 Days",
    instructions: "After meals; non-sedative muscle relaxant",
  }),
  oral("Baclofen 10 mg tablet", {
    genericName: "Baclofen",
    strength: "10 mg",
    therapeuticClass: "Antispastic / Muscle Relaxant",
    frequency: "Twice daily",
    duration: "10 Days",
    instructions: "After meals",
  }),
  oral("Chymoral Forte tablet", {
    genericName: "Trypsin-Chymotrypsin 100,000 Armour Units",
    strength: "100,000 AU",
    therapeuticClass: "Proteolytic Anti-inflammatory Enzyme",
    frequency: "Three times daily",
    duration: "5 Days",
    instructions: "Strictly 30 minutes before meals on empty stomach",
  }),
  oral("Serratiopeptidase 10 mg tablet", {
    genericName: "Serratiopeptidase",
    strength: "10 mg",
    therapeuticClass: "Anti-edema Enzyme",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "Before meals",
  }),

  /* ====================================================================
   * 2. ORTHOPEDIC, BONE HEALTH, CARTILAGE & NEUROPATHIC PAIN
   * ==================================================================== */
  oral("Calcium + Vitamin D3 tablet", {
    genericName: "Calcium Carbonate 1250 mg + Vitamin D3 250 IU",
    strength: "500 mg elemental Ca + 250 IU D3",
    therapeuticClass: "Bone Mineral Supplement",
    frequency: "Once daily",
    duration: "30 Days",
    instructions: "Post-dinner with water",
  }),
  oral("Shelcal 500 tablet", {
    genericName: "Calcium 500 mg + Vitamin D3 250 IU",
    strength: "500 mg / 250 IU",
    therapeuticClass: "Calcium Supplement",
    frequency: "Once daily",
    duration: "30 Days",
    instructions: "After meals with water",
  }),
  oral("Calcium Citrate Malate 1250 mg + Vitamin D3 1000 IU", {
    genericName: "Calcium Citrate Malate + Vitamin D3",
    strength: "1250 mg / 1000 IU",
    therapeuticClass: "High-Absorption Calcium Supplement",
    dosage: "1 tablet",
    frequency: "Once daily",
    duration: "30 Days",
    instructions: "Post-dinner with milk/water",
  }),
  capsule("Gemcal capsule", {
    genericName: "Calcium Carbonate 1250 mg + Calcitriol 0.25 mcg + Zinc 7.5 mg",
    strength: "1250 mg / 0.25 mcg",
    therapeuticClass: "Active Vitamin D & Calcium",
    dosage: "1 capsule",
    frequency: "Once daily",
    duration: "30 Days",
    instructions: "After meals",
  }),
  capsule("Vitamin D3 60,000 IU capsule", {
    genericName: "Cholecalciferol",
    strength: "60,000 IU",
    therapeuticClass: "Vitamin D Deficiency Therapy",
    dosage: "1 capsule",
    frequency: "Once weekly",
    duration: "8 Weeks",
    instructions: "After meals with warm milk",
  }),
  capsule("Uprise-D3 60K capsule", {
    genericName: "Cholecalciferol 60,000 IU",
    strength: "60,000 IU",
    therapeuticClass: "Vitamin D3 Supplement",
    dosage: "1 capsule",
    frequency: "Once weekly",
    duration: "8 Weeks",
    instructions: "Once every Sunday with milk",
  }),
  sachet("Calcirol 60K sachet", {
    genericName: "Cholecalciferol (Vitamin D3) 60,000 IU Granules",
    strength: "60,000 IU",
    therapeuticClass: "Vitamin D3 Granules",
    frequency: "Once weekly",
    duration: "8 Weeks",
    instructions: "Mix in 1 glass of warm milk once weekly",
  }),
  oral("Diacerein 50 mg + Glucosamine 750 mg", {
    genericName: "Diacerein + Glucosamine Sulphate",
    strength: "50 mg / 750 mg",
    therapeuticClass: "Cartilage Protective / OA Therapy",
    dosage: "1 tablet",
    frequency: "Once daily",
    duration: "30 Days",
    instructions: "Cartilage protective agent after food",
  }),
  sachet("Glucosamine Sulphate 1500 mg sachet", {
    genericName: "Glucosamine Sulphate Potassium",
    strength: "1500 mg",
    therapeuticClass: "Joint Health Supplement",
    frequency: "Once daily",
    duration: "30 Days",
    instructions: "Dissolve in water, take after breakfast",
  }),
  sachet("Collagen Peptide Type II sachet", {
    genericName: "Hydrolyzed Collagen Peptide + Rosehip Extract + Vit C",
    strength: "10g",
    therapeuticClass: "Joint Cartilage Regenerator",
    frequency: "Once daily",
    duration: "30 Days",
    instructions: "Mix in 100ml water and drink after breakfast",
  }),
  capsule("Pregabalin 75 mg + Methylcobalamin 1500 mcg", {
    genericName: "Pregabalin + Methylcobalamin",
    strength: "75 mg / 1500 mcg",
    therapeuticClass: "Neuropathic Pain & Radiculopathy",
    dosage: "1 capsule",
    frequency: "Once daily at bedtime",
    duration: "15 Days",
    instructions: "For sciatica / radicular nerve pain at bedtime",
  }),
  capsule("Pregeb-M 75 capsule", {
    genericName: "Pregabalin 75 mg + Methylcobalamin 1500 mcg",
    strength: "75 mg / 1500 mcg",
    therapeuticClass: "Neuropathic Pain Agent",
    dosage: "1 capsule",
    frequency: "Once daily at bedtime",
    duration: "15 Days",
    instructions: "Take at night before sleep",
  }),
  oral("Gabapentin 300 mg + Methylcobalamin 500 mcg tablet", {
    genericName: "Gabapentin + Methylcobalamin",
    strength: "300 mg / 500 mcg",
    therapeuticClass: "Neuropathic Pain Agent",
    frequency: "Once daily at bedtime",
    duration: "15 Days",
    instructions: "At bedtime",
  }),
  oral("Febuxostat 40 mg tablet", {
    genericName: "Febuxostat",
    strength: "40 mg",
    therapeuticClass: "Xanthine Oxidase Inhibitor / Gout",
    frequency: "Once daily",
    duration: "30 Days",
    instructions: "After meals for hyperuricemia / gout",
  }),
  oral("Allopurinol 100 mg tablet", {
    genericName: "Allopurinol",
    strength: "100 mg",
    therapeuticClass: "Uric Acid Lowering Agent",
    frequency: "Once daily",
    duration: "30 Days",
    instructions: "After meals with plenty of fluids",
  }),
  oral("Colchicine 0.5 mg tablet", {
    genericName: "Colchicine",
    strength: "0.5 mg",
    therapeuticClass: "Acute Gouty Arthritis Agent",
    frequency: "Twice daily",
    duration: "3 Days",
    instructions: "For acute gout flare-up",
  }),

  /* ====================================================================
   * 3. ANTIBIOTICS & ANTIMICROBIALS (ORAL)
   * ==================================================================== */
  capsule("Amoxicillin 500 mg capsule", {
    genericName: "Amoxicillin",
    strength: "500 mg",
    therapeuticClass: "Penicillin Antibiotic",
    dosage: "1 capsule",
    frequency: "Three times daily",
    duration: "5 Days",
    instructions: "Complete full 5-day course",
  }),
  oral("Amoxicillin + Clavulanic acid 625 mg tablet", {
    genericName: "Amoxicillin 500 mg + Clavulanic Acid 125 mg",
    strength: "625 mg",
    therapeuticClass: "Broad Spectrum Antibiotic",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "After meals to avoid gastric irritation",
  }),
  oral("Augmentin 625 Duo tablet", {
    genericName: "Amoxicillin 500 mg + Clavulanic Acid 125 mg",
    strength: "625 mg",
    therapeuticClass: "Broad Spectrum Antibiotic",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "Strictly after meals with plenty of water",
  }),
  oral("Azithromycin 500 mg tablet", {
    genericName: "Azithromycin",
    strength: "500 mg",
    therapeuticClass: "Macrolide Antibiotic",
    frequency: "Once daily",
    duration: "3 Days",
    instructions: "1 hour before or 2 hours after meals",
  }),
  oral("Azee 500 tablet", {
    genericName: "Azithromycin 500 mg",
    strength: "500 mg",
    therapeuticClass: "Macrolide Antibiotic",
    frequency: "Once daily",
    duration: "3 Days",
    instructions: "Once daily at the same time each day",
  }),
  oral("Cefixime 200 mg tablet", {
    genericName: "Cefixime",
    strength: "200 mg",
    therapeuticClass: "Cephalosporin (3rd Gen) Antibiotic",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "After meals",
  }),
  oral("Taxim-O 200 tablet", {
    genericName: "Cefixime 200 mg",
    strength: "200 mg",
    therapeuticClass: "Cephalosporin Antibiotic",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "After meals",
  }),
  oral("Zifi 200 tablet", {
    genericName: "Cefixime 200 mg",
    strength: "200 mg",
    therapeuticClass: "Cephalosporin Antibiotic",
    frequency: "Twice daily",
    duration: "5 Days",
  }),
  oral("Cefuroxime 500 mg tablet", {
    genericName: "Cefuroxime Axetil",
    strength: "500 mg",
    therapeuticClass: "Cephalosporin (2nd Gen) Antibiotic",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "After meals",
  }),
  oral("Ceftum 500 tablet", {
    genericName: "Cefuroxime Axetil 500 mg",
    strength: "500 mg",
    therapeuticClass: "Cephalosporin Antibiotic",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "After meals",
  }),
  oral("Cefpodoxime Proxetil 200 mg tablet", {
    genericName: "Cefpodoxime Proxetil",
    strength: "200 mg",
    therapeuticClass: "Cephalosporin (3rd Gen) Antibiotic",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "After meals",
  }),
  oral("Ciprofloxacin 500 mg tablet", {
    genericName: "Ciprofloxacin HCl",
    strength: "500 mg",
    therapeuticClass: "Fluoroquinolone Antibiotic",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "After meals with plenty of fluids",
  }),
  oral("Ciplox 500 tablet", {
    genericName: "Ciprofloxacin 500 mg",
    strength: "500 mg",
    therapeuticClass: "Fluoroquinolone Antibiotic",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "After meals",
  }),
  oral("Ofloxacin 200 mg tablet", {
    genericName: "Ofloxacin",
    strength: "200 mg",
    therapeuticClass: "Fluoroquinolone Antibiotic",
    frequency: "Twice daily",
    duration: "5 Days",
  }),
  oral("Ofloxacin 200 mg + Ornidazole 500 mg tablet", {
    genericName: "Ofloxacin + Ornidazole",
    strength: "200 mg / 500 mg",
    therapeuticClass: "Antidiarrheal / Antimicrobial Combo",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "After meals for gastroenteritis",
  }),
  oral("O2 tablet", {
    genericName: "Ofloxacin 200 mg + Ornidazole 500 mg",
    strength: "200 mg / 500 mg",
    therapeuticClass: "Antidiarrheal / Antimicrobial Combo",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "After food for infectious diarrhea",
  }),
  oral("Levofloxacin 500 mg tablet", {
    genericName: "Levofloxacin",
    strength: "500 mg",
    therapeuticClass: "Fluoroquinolone Antibiotic",
    frequency: "Once daily",
    duration: "5 Days",
    instructions: "After meals",
  }),
  capsule("Doxycycline 100 mg capsule", {
    genericName: "Doxycycline Hyclate",
    strength: "100 mg",
    therapeuticClass: "Tetracycline Antibiotic",
    dosage: "1 capsule",
    frequency: "Twice daily",
    duration: "7 Days",
    instructions: "After meals; remain upright for 30 minutes",
  }),
  oral("Metronidazole 400 mg tablet", {
    genericName: "Metronidazole",
    strength: "400 mg",
    therapeuticClass: "Antiprotozoal / Anaerobic Antibiotic",
    frequency: "Three times daily",
    duration: "5 Days",
    instructions: "After meals; strictly avoid alcohol",
  }),
  oral("Clarithromycin 500 mg tablet", {
    genericName: "Clarithromycin",
    strength: "500 mg",
    therapeuticClass: "Macrolide Antibiotic",
    frequency: "Twice daily",
    duration: "7 Days",
    instructions: "After meals",
  }),
  oral("Linezolid 600 mg tablet", {
    genericName: "Linezolid",
    strength: "600 mg",
    therapeuticClass: "Oxazolidinone Antibiotic (MRSA)",
    frequency: "Twice daily",
    duration: "10 Days",
    instructions: "For resistant soft tissue / bone infections",
  }),
  oral("Nitrofurantoin 100 mg tablet", {
    genericName: "Nitrofurantoin SR",
    strength: "100 mg",
    therapeuticClass: "Urinary Tract Antibacterial",
    frequency: "Twice daily",
    duration: "7 Days",
    instructions: "With food or milk for uncomplicated UTI",
  }),
  oral("Fluconazole 150 mg tablet", {
    genericName: "Fluconazole",
    strength: "150 mg",
    therapeuticClass: "Antifungal",
    frequency: "Immediately (Single dose)",
    duration: "1 Day",
    instructions: "Single dose for fungal / yeast infection",
  }),
  oral("Albendazole 400 mg tablet", {
    genericName: "Albendazole",
    strength: "400 mg",
    therapeuticClass: "Anthelmintic / Deworming",
    dosage: "1 tablet (chewable)",
    frequency: "Immediately (Single dose)",
    duration: "1 Day",
    instructions: "Chew tablet thoroughly after dinner",
  }),
  oral("Ivermectin 12 mg tablet", {
    genericName: "Ivermectin",
    strength: "12 mg",
    therapeuticClass: "Antiparasitic",
    frequency: "Immediately",
    duration: "1 Day",
    instructions: "On an empty stomach with a glass of water",
  }),
  oral("Acyclovir 400 mg tablet", {
    genericName: "Acyclovir",
    strength: "400 mg",
    therapeuticClass: "Antiviral",
    frequency: "Three times daily",
    duration: "5 Days",
    instructions: "For herpes / shingles viral episodes",
  }),

  /* ====================================================================
   * 4. GASTROINTESTINAL, ANTACIDS, PPIs & ANTIEMETICS (ORAL)
   * ==================================================================== */
  oral("Pantoprazole 40 mg tablet", {
    genericName: "Pantoprazole Sodium",
    strength: "40 mg",
    therapeuticClass: "Proton Pump Inhibitor (PPI)",
    frequency: "Once daily",
    duration: "14 Days",
    instructions: "Before meals",
  }),
  oral("Pan 40 tablet", {
    genericName: "Pantoprazole 40 mg",
    strength: "40 mg",
    therapeuticClass: "Proton Pump Inhibitor (PPI)",
    frequency: "Once daily",
    duration: "14 Days",
    instructions: "30 minutes before breakfast",
  }),
  capsule("Pantoprazole 40 mg + Domperidone 30 mg SR", {
    genericName: "Pantoprazole + Domperidone SR",
    strength: "40 mg / 30 mg",
    therapeuticClass: "PPI + Prokinetic Combination",
    dosage: "1 capsule",
    frequency: "Once daily",
    duration: "14 Days",
    instructions: "30 minutes before breakfast on empty stomach",
  }),
  capsule("Pan-D capsule", {
    genericName: "Pantoprazole 40 mg + Domperidone 30 mg SR",
    strength: "40 mg / 30 mg",
    therapeuticClass: "PPI + Antiemetic / Prokinetic",
    dosage: "1 capsule",
    frequency: "Once daily",
    duration: "14 Days",
    instructions: "On empty stomach in the morning",
  }),
  capsule("Omeprazole 20 mg capsule", {
    genericName: "Omeprazole",
    strength: "20 mg",
    therapeuticClass: "Proton Pump Inhibitor (PPI)",
    dosage: "1 capsule",
    frequency: "Once daily",
    duration: "14 Days",
    instructions: "Before breakfast",
  }),
  capsule("Omez 20 capsule", {
    genericName: "Omeprazole 20 mg",
    strength: "20 mg",
    therapeuticClass: "Proton Pump Inhibitor",
    dosage: "1 capsule",
    frequency: "Once daily",
    duration: "14 Days",
    instructions: "Before breakfast",
  }),
  oral("Rabeprazole 20 mg tablet", {
    genericName: "Rabeprazole Sodium",
    strength: "20 mg",
    therapeuticClass: "Proton Pump Inhibitor",
    frequency: "Once daily",
    duration: "14 Days",
    instructions: "Before meals",
  }),
  capsule("Rabeprazole 20 mg + Domperidone 30 mg SR", {
    genericName: "Rabeprazole + Domperidone SR",
    strength: "20 mg / 30 mg",
    therapeuticClass: "PPI + Prokinetic",
    dosage: "1 capsule",
    frequency: "Once daily",
    duration: "14 Days",
    instructions: "Before meals on empty stomach",
  }),
  capsule("Rablet-D capsule", {
    genericName: "Rabeprazole 20 mg + Domperidone 30 mg SR",
    strength: "20 mg / 30 mg",
    therapeuticClass: "PPI + Prokinetic",
    dosage: "1 capsule",
    frequency: "Once daily",
    duration: "14 Days",
    instructions: "30 minutes before breakfast",
  }),
  oral("Esomeprazole 40 mg tablet", {
    genericName: "Esomeprazole Magnesium",
    strength: "40 mg",
    therapeuticClass: "Proton Pump Inhibitor (PPI)",
    frequency: "Once daily",
    duration: "14 Days",
    instructions: "Before breakfast",
  }),
  oral("Famotidine 40 mg tablet", {
    genericName: "Famotidine",
    strength: "40 mg",
    therapeuticClass: "H2 Receptor Blocker",
    frequency: "Twice daily",
    duration: "14 Days",
    instructions: "Before meals",
  }),
  oral("Ondansetron 4 mg tablet", {
    genericName: "Ondansetron HCl",
    strength: "4 mg",
    therapeuticClass: "Antiemetic (5-HT3 Antagonist)",
    frequency: "As needed (SOS)",
    duration: "3 Days",
    instructions: "Take 30 minutes before food for nausea / vomiting",
  }),
  oral("Emeset 4 tablet", {
    genericName: "Ondansetron 4 mg",
    strength: "4 mg",
    therapeuticClass: "Antiemetic",
    frequency: "As needed (SOS)",
    duration: "3 Days",
    instructions: "For nausea or vomiting",
  }),
  oral("Domperidone 10 mg tablet", {
    genericName: "Domperidone",
    strength: "10 mg",
    therapeuticClass: "Prokinetic / Antiemetic",
    frequency: "Three times daily",
    duration: "5 Days",
    instructions: "15-30 minutes before meals",
  }),
  oral("Metoclopramide 10 mg tablet", {
    genericName: "Metoclopramide HCl",
    strength: "10 mg",
    therapeuticClass: "Prokinetic / Antiemetic",
    frequency: "Three times daily",
    duration: "3 Days",
    instructions: "Before meals",
  }),
  oral("Dicyclomine 20 mg + Paracetamol 500 mg tablet", {
    genericName: "Dicyclomine + Paracetamol",
    strength: "20 mg / 500 mg",
    therapeuticClass: "Antispasmodic Analgesic",
    frequency: "Twice daily as needed",
    duration: "3 Days",
    instructions: "For spasmodic intestinal / abdominal cramps",
  }),
  oral("Cyclopam tablet", {
    genericName: "Dicyclomine 20 mg + Paracetamol 500 mg",
    strength: "20 mg / 500 mg",
    therapeuticClass: "Antispasmodic Analgesic",
    frequency: "As needed",
    duration: "3 Days",
    instructions: "For abdominal pain or cramps",
  }),
  oral("Drotaverine 80 mg tablet", {
    genericName: "Drotaverine HCl",
    strength: "80 mg",
    therapeuticClass: "Smooth Muscle Antispasmodic",
    frequency: "Twice daily",
    duration: "3 Days",
    instructions: "For biliary, renal, or GI smooth muscle colic",
  }),
  capsule("Loperamide 2 mg capsule", {
    genericName: "Loperamide HCl",
    strength: "2 mg",
    therapeuticClass: "Antimotility / Antidiarrheal",
    dosage: "1 capsule",
    frequency: "As needed",
    duration: "2 Days",
    instructions: "1 capsule after each unformed stool; max 4 per day",
  }),
  oral("Bisacodyl 5 mg tablet", {
    genericName: "Bisacodyl",
    strength: "5 mg",
    therapeuticClass: "Stimulant Laxative",
    frequency: "Once daily",
    duration: "3 Days",
    instructions: "At bedtime with water",
  }),
  oral("Dulcolax 5 mg tablet", {
    genericName: "Bisacodyl 5 mg",
    strength: "5 mg",
    therapeuticClass: "Laxative",
    frequency: "Once daily",
    duration: "3 Days",
    instructions: "Take at bedtime",
  }),
  sachet("Oral Rehydration Salts (ORS) WHO formula sachet", {
    genericName: "Oral Rehydration Salts WHO Formula",
    strength: "21.8g sachet",
    therapeuticClass: "Oral Electrolyte Replenisher",
    frequency: "As needed",
    duration: "3 Days",
    instructions: "Dissolve entire sachet in 1 litre of clean drinking water",
  }),
  sachet("Electral ORS sachet", {
    genericName: "Oral Rehydration Salts WHO Formula",
    strength: "21.8g",
    therapeuticClass: "Electrolyte Replenisher",
    frequency: "As needed",
    duration: "3 Days",
    instructions: "Dissolve in 1 litre boiled and cooled water",
  }),
  sachet("Ispaghula Husk (Psyllium) granules", {
    genericName: "Ispaghula Husk",
    strength: "100g pack",
    therapeuticClass: "Bulk-Forming Laxative",
    frequency: "Once daily",
    duration: "14 Days",
    instructions: "Mix 1-2 spoonfuls in a glass of water and drink immediately at bedtime",
  }),

  /* ====================================================================
   * 5. SYRUPS & ORAL LIQUIDS
   * ==================================================================== */
  syrup("Sucralfate + Oxetacaine suspension 200 ml", {
    genericName: "Sucralfate 1000 mg + Oxetacaine 20 mg / 10 ml",
    strength: "1000 mg / 20 mg",
    therapeuticClass: "Mucosal Protective & Local Anesthetic",
    dosage: "10 ml",
    frequency: "Three times daily",
    duration: "14 Days",
    instructions: "1 hour before meals and at bedtime for ulcers / reflux",
  }),
  syrup("Antacid Magnesium + Aluminium Hydroxide suspension", {
    genericName: "Aluminium Hydroxide + Magnesium Hydroxide + Simethicone",
    strength: "200 ml",
    therapeuticClass: "Antacid & Antiflatulent",
    dosage: "10 ml",
    frequency: "Three times daily",
    duration: "7 Days",
    instructions: "After meals and at bedtime",
  }),
  syrup("Digene oral suspension 200 ml", {
    genericName: "Aluminium Hydroxide + Magnesium Hydroxide + Simethicone",
    strength: "200 ml",
    therapeuticClass: "Antacid / Heartburn Relief",
    dosage: "10 ml",
    frequency: "As needed",
    duration: "7 Days",
    instructions: "1-2 teaspoons after food for acidity",
  }),
  syrup("Lactulose oral solution", {
    genericName: "Lactulose",
    strength: "10g / 15 ml",
    therapeuticClass: "Osmotic Laxative",
    dosage: "15 ml",
    frequency: "Once daily",
    duration: "7 Days",
    instructions: "At bedtime with water",
  }),
  syrup("Cough Syrup Dextromethorphan + Chlorpheniramine", {
    genericName: "Dextromethorphan HBr 10 mg + Chlorpheniramine 2 mg / 5 ml",
    strength: "100 ml",
    therapeuticClass: "Antitussive / Dry Cough Syrup",
    dosage: "5 ml",
    frequency: "Three times daily",
    duration: "5 Days",
    instructions: "After meals for dry, hacking cough",
  }),
  syrup("Expectorant Ambroxol + Guaifenesin + Terbutaline", {
    genericName: "Ambroxol + Guaifenesin + Terbutaline",
    strength: "100 ml",
    therapeuticClass: "Mucolytic / Bronchodilator Expectorant",
    dosage: "5 ml",
    frequency: "Three times daily",
    duration: "5 Days",
    instructions: "After meals for productive, chesty cough with phlegm",
  }),
  syrup("Ascoril-LS syrup 100 ml", {
    genericName: "Levosalbutamol 1 mg + Ambroxol 30 mg + Guaiphenesin 50 mg / 5 ml",
    strength: "100 ml",
    therapeuticClass: "Expectorant & Bronchodilator",
    dosage: "5 ml",
    frequency: "Three times daily",
    duration: "5 Days",
    instructions: "After meals with warm water",
  }),
  syrup("Paracetamol Pediatric Suspension 120 mg / 5 ml", {
    genericName: "Paracetamol",
    strength: "120 mg / 5 ml",
    therapeuticClass: "Pediatric Antipyretic",
    dosage: "5 ml",
    frequency: "Three times daily as needed",
    duration: "3 Days",
    instructions: "Dosed per pediatric weight for fever",
  }),
  syrup("Paracetamol Pediatric Suspension 250 mg / 5 ml", {
    genericName: "Paracetamol",
    strength: "250 mg / 5 ml",
    therapeuticClass: "Pediatric Antipyretic / Analgesic",
    dosage: "5 ml",
    frequency: "Three times daily as needed",
    duration: "3 Days",
    instructions: "After food for fever or pain",
  }),
  syrup("Calpol 250 Pead suspension 60 ml", {
    genericName: "Paracetamol 250 mg / 5 ml",
    strength: "250 mg / 5 ml",
    therapeuticClass: "Pediatric Antipyretic",
    dosage: "5 ml",
    frequency: "Three times daily as needed",
    duration: "3 Days",
  }),
  syrup("Ibuprofen Pediatric Oral Suspension 100 mg / 5 ml", {
    genericName: "Ibuprofen",
    strength: "100 mg / 5 ml",
    therapeuticClass: "Pediatric NSAID / Antipyretic",
    dosage: "5 ml",
    frequency: "Three times daily",
    duration: "3 Days",
    instructions: "Strictly after feeding/meals",
  }),
  syrup("Amoxicillin + Clavulanic Acid Dry Syrup 228.5 mg / 5 ml", {
    genericName: "Amoxicillin 200 mg + Clavulanic Acid 28.5 mg / 5 ml",
    strength: "228.5 mg / 5 ml",
    therapeuticClass: "Pediatric Antibiotic",
    dosage: "5 ml",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "Reconstitute with sterile water; store in fridge and finish in 7 days",
  }),
  syrup("Azithromycin Pediatric Suspension 100 mg / 5 ml", {
    genericName: "Azithromycin",
    strength: "100 mg / 5 ml",
    therapeuticClass: "Pediatric Antibiotic",
    dosage: "5 ml",
    frequency: "Once daily",
    duration: "3 Days",
  }),
  syrup("Cefixime Oral Suspension 50 mg / 5 ml", {
    genericName: "Cefixime",
    strength: "50 mg / 5 ml",
    therapeuticClass: "Pediatric Cephalosporin",
    dosage: "5 ml",
    frequency: "Twice daily",
    duration: "5 Days",
  }),
  syrup("Ondansetron Pediatric Drops 2 mg / 5 ml", {
    genericName: "Ondansetron",
    strength: "2 mg / 5 ml",
    therapeuticClass: "Pediatric Antiemetic",
    dosage: "2.5 - 5 ml",
    frequency: "As needed",
    duration: "2 Days",
    instructions: "Before feeds for persistent vomiting",
  }),
  syrup("Cetirizine Pediatric Syrup 5 mg / 5 ml", {
    genericName: "Cetirizine HCl",
    strength: "5 mg / 5 ml",
    therapeuticClass: "Pediatric Antihistamine",
    dosage: "2.5 - 5 ml",
    frequency: "Once daily",
    duration: "5 Days",
    instructions: "At bedtime",
  }),
  syrup("Zinc Gluconate Oral Solution 20 mg / 5 ml", {
    genericName: "Zinc Gluconate",
    strength: "20 mg / 5 ml",
    therapeuticClass: "Diarrhea Recovery & Immunity",
    dosage: "5 ml",
    frequency: "Once daily",
    duration: "14 Days",
    instructions: "Given for 14 days during acute childhood diarrhea",
  }),

  /* ====================================================================
   * 6. CARDIOVASCULAR, ANTIHYPERTENSIVES, STATINS & ANTIPLATELETS
   * ==================================================================== */
  oral("Amlodipine 5 mg tablet", {
    genericName: "Amlodipine Besylate",
    strength: "5 mg",
    therapeuticClass: "Calcium Channel Blocker (CCB)",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
  }),
  oral("Amlong 5 tablet", {
    genericName: "Amlodipine 5 mg",
    strength: "5 mg",
    therapeuticClass: "Calcium Channel Blocker",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
  }),
  oral("Telmisartan 40 mg tablet", {
    genericName: "Telmisartan",
    strength: "40 mg",
    therapeuticClass: "Angiotensin Receptor Blocker (ARB)",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
  }),
  oral("Telma 40 tablet", {
    genericName: "Telmisartan 40 mg",
    strength: "40 mg",
    therapeuticClass: "Angiotensin Receptor Blocker",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
  }),
  oral("Telmisartan 40 mg + Amlodipine 5 mg tablet", {
    genericName: "Telmisartan + Amlodipine",
    strength: "40 mg / 5 mg",
    therapeuticClass: "ARB + CCB Antihypertensive Combination",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
  }),
  oral("Telma-AM tablet", {
    genericName: "Telmisartan 40 mg + Amlodipine 5 mg",
    strength: "40 mg / 5 mg",
    therapeuticClass: "Combination Antihypertensive",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
  }),
  oral("Telmisartan 40 mg + Hydrochlorothiazide 12.5 mg tablet", {
    genericName: "Telmisartan + Hydrochlorothiazide",
    strength: "40 mg / 12.5 mg",
    therapeuticClass: "ARB + Thiazide Diuretic",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
    instructions: "In the morning",
  }),
  oral("Losartan 50 mg tablet", {
    genericName: "Losartan Potassium",
    strength: "50 mg",
    therapeuticClass: "Angiotensin Receptor Blocker",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
  }),
  oral("Ramipril 5 mg tablet", {
    genericName: "Ramipril",
    strength: "5 mg",
    therapeuticClass: "ACE Inhibitor",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
  }),
  oral("Enalapril 5 mg tablet", {
    genericName: "Enalapril Maleate",
    strength: "5 mg",
    therapeuticClass: "ACE Inhibitor",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
  }),
  oral("Atenolol 50 mg tablet", {
    genericName: "Atenolol",
    strength: "50 mg",
    therapeuticClass: "Beta Blocker",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
  }),
  oral("Metoprolol 25 mg tablet", {
    genericName: "Metoprolol Succinate",
    strength: "25 mg",
    therapeuticClass: "Beta-1 Selective Blocker",
    frequency: "Twice daily",
    duration: "Ongoing / continuous",
  }),
  oral("Metoprolol 50 mg ER tablet", {
    genericName: "Metoprolol Succinate ER",
    strength: "50 mg",
    therapeuticClass: "Beta-1 Selective Blocker (Extended Release)",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
  }),
  oral("Hydrochlorothiazide 12.5 mg tablet", {
    genericName: "Hydrochlorothiazide",
    strength: "12.5 mg",
    therapeuticClass: "Thiazide Diuretic",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
    instructions: "In the morning",
  }),
  oral("Furosemide 40 mg tablet", {
    genericName: "Furosemide",
    strength: "40 mg",
    therapeuticClass: "Loop Diuretic",
    frequency: "Once daily",
    duration: "Until review",
    instructions: "In the morning with water",
  }),
  oral("Lasix 40 tablet", {
    genericName: "Furosemide 40 mg",
    strength: "40 mg",
    therapeuticClass: "Loop Diuretic",
    frequency: "Once daily",
    duration: "Until review",
    instructions: "In the morning",
  }),
  oral("Torsemide 10 mg tablet", {
    genericName: "Torsemide",
    strength: "10 mg",
    therapeuticClass: "Loop Diuretic",
    frequency: "Once daily",
    duration: "Until review",
    instructions: "In the morning",
  }),
  oral("Spironolactone 25 mg tablet", {
    genericName: "Spironolactone",
    strength: "25 mg",
    therapeuticClass: "Potassium-Sparing Diuretic",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
  }),
  oral("Nitroglycerin 0.5 mg sublingual tablet", {
    genericName: "Glyceryl Trinitrate",
    strength: "0.5 mg",
    therapeuticClass: "Vasodilator / Angina Relief",
    route: "Sublingual",
    frequency: "As needed (SOS)",
    duration: "Until review",
    instructions: "Place under tongue immediately during chest pain; repeat once after 5 min if needed",
  }),
  oral("Atorvastatin 10 mg tablet", {
    genericName: "Atorvastatin Calcium",
    strength: "10 mg",
    therapeuticClass: "HMG-CoA Reductase Inhibitor (Statin)",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
    instructions: "At bedtime",
  }),
  oral("Atorvastatin 20 mg tablet", {
    genericName: "Atorvastatin Calcium",
    strength: "20 mg",
    therapeuticClass: "Statin / Lipid Lowering",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
    instructions: "At bedtime",
  }),
  oral("Atorva 10 tablet", {
    genericName: "Atorvastatin 10 mg",
    strength: "10 mg",
    therapeuticClass: "Statin / Lipid Lowering",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
    instructions: "At bedtime",
  }),
  oral("Rosuvastatin 10 mg tablet", {
    genericName: "Rosuvastatin Calcium",
    strength: "10 mg",
    therapeuticClass: "High-Intensity Statin",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
    instructions: "At bedtime",
  }),
  oral("Rosuvas 10 tablet", {
    genericName: "Rosuvastatin 10 mg",
    strength: "10 mg",
    therapeuticClass: "High-Intensity Statin",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
    instructions: "At bedtime",
  }),
  oral("Aspirin 75 mg tablet", {
    genericName: "Acetylsalicylic Acid (Aspirin)",
    strength: "75 mg",
    therapeuticClass: "Antiplatelet / Cardioprotective",
    dosage: "1 tablet",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
    instructions: "After meals",
  }),
  oral("Ecosprin 75 tablet", {
    genericName: "Aspirin 75 mg Gastro-Resistant",
    strength: "75 mg",
    therapeuticClass: "Antiplatelet Agent",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
    instructions: "After meals",
  }),
  oral("Ecosprin 150 tablet", {
    genericName: "Aspirin 150 mg Gastro-Resistant",
    strength: "150 mg",
    therapeuticClass: "Antiplatelet Agent",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
    instructions: "After meals",
  }),
  oral("Clopidogrel 75 mg tablet", {
    genericName: "Clopidogrel Bisulphate",
    strength: "75 mg",
    therapeuticClass: "Antiplatelet Agent",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
    instructions: "After meals",
  }),
  oral("Deplatt 75 tablet", {
    genericName: "Clopidogrel 75 mg",
    strength: "75 mg",
    therapeuticClass: "Antiplatelet Agent",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
  }),
  capsule("Aspirin 75 mg + Clopidogrel 75 mg capsule", {
    genericName: "Aspirin + Clopidogrel",
    strength: "75 mg / 75 mg",
    therapeuticClass: "Dual Antiplatelet Therapy (DAPT)",
    dosage: "1 capsule",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
    instructions: "After meals",
  }),

  /* ====================================================================
   * 7. ANTIDIABETIC MEDICATIONS (ORAL & INJECTABLE)
   * ==================================================================== */
  oral("Metformin 500 mg tablet", {
    genericName: "Metformin HCl",
    strength: "500 mg",
    therapeuticClass: "Biguanide Antidiabetic",
    frequency: "Twice daily",
    duration: "Ongoing / continuous",
    instructions: "After meals",
  }),
  oral("Metformin 500 mg SR tablet", {
    genericName: "Metformin HCl Sustained Release",
    strength: "500 mg SR",
    therapeuticClass: "Biguanide Antidiabetic (SR)",
    frequency: "Twice daily",
    duration: "Ongoing / continuous",
    instructions: "Immediately after dinner",
  }),
  oral("Glycomet 500 SR tablet", {
    genericName: "Metformin 500 mg SR",
    strength: "500 mg SR",
    therapeuticClass: "Oral Antidiabetic",
    frequency: "Twice daily",
    duration: "Ongoing / continuous",
    instructions: "After meals",
  }),
  oral("Glimepiride 1 mg tablet", {
    genericName: "Glimepiride",
    strength: "1 mg",
    therapeuticClass: "Sulfonylurea Antidiabetic",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
    instructions: "Before breakfast",
  }),
  oral("Glimepiride 2 mg tablet", {
    genericName: "Glimepiride",
    strength: "2 mg",
    therapeuticClass: "Sulfonylurea Antidiabetic",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
    instructions: "Before breakfast",
  }),
  oral("Glimepiride 1 mg + Metformin 500 mg SR tablet", {
    genericName: "Glimepiride + Metformin SR",
    strength: "1 mg / 500 mg",
    therapeuticClass: "Dual Oral Antidiabetic Combo",
    frequency: "Twice daily",
    duration: "Ongoing / continuous",
    instructions: "Before breakfast and dinner",
  }),
  oral("Glycomet-GP 1 tablet", {
    genericName: "Glimepiride 1 mg + Metformin 500 mg SR",
    strength: "1 mg / 500 mg",
    therapeuticClass: "Dual Antidiabetic Combination",
    frequency: "Twice daily",
    duration: "Ongoing / continuous",
    instructions: "Just before meals",
  }),
  oral("Glycomet-GP 2 tablet", {
    genericName: "Glimepiride 2 mg + Metformin 500 mg SR",
    strength: "2 mg / 500 mg",
    therapeuticClass: "Dual Antidiabetic Combination",
    frequency: "Twice daily",
    duration: "Ongoing / continuous",
    instructions: "Just before meals",
  }),
  oral("Vildagliptin 50 mg tablet", {
    genericName: "Vildagliptin",
    strength: "50 mg",
    therapeuticClass: "DPP-4 Inhibitor",
    frequency: "Twice daily",
    duration: "Ongoing / continuous",
  }),
  oral("Vildagliptin 50 mg + Metformin 500 mg tablet", {
    genericName: "Vildagliptin + Metformin",
    strength: "50 mg / 500 mg",
    therapeuticClass: "DPP-4 Inhibitor + Biguanide",
    frequency: "Twice daily",
    duration: "Ongoing / continuous",
    instructions: "With or after meals",
  }),
  oral("Galvus Met 50/500 tablet", {
    genericName: "Vildagliptin 50 mg + Metformin 500 mg",
    strength: "50 mg / 500 mg",
    therapeuticClass: "Combination Antidiabetic",
    frequency: "Twice daily",
    duration: "Ongoing / continuous",
    instructions: "After meals",
  }),
  oral("Sitagliptin 100 mg tablet", {
    genericName: "Sitagliptin Phosphate",
    strength: "100 mg",
    therapeuticClass: "DPP-4 Inhibitor",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
    instructions: "After meals",
  }),
  oral("Januvia 100 tablet", {
    genericName: "Sitagliptin 100 mg",
    strength: "100 mg",
    therapeuticClass: "DPP-4 Inhibitor",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
  }),
  oral("Dapagliflozin 10 mg tablet", {
    genericName: "Dapagliflozin Propanediol",
    strength: "10 mg",
    therapeuticClass: "SGLT2 Inhibitor (Gliflozin)",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
    instructions: "In the morning with water; drink adequate fluids",
  }),
  oral("Forxiga 10 tablet", {
    genericName: "Dapagliflozin 10 mg",
    strength: "10 mg",
    therapeuticClass: "SGLT2 Inhibitor",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
  }),
  oral("Empagliflozin 10 mg tablet", {
    genericName: "Empagliflozin",
    strength: "10 mg",
    therapeuticClass: "SGLT2 Inhibitor",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
  }),
  oral("Teneligliptin 20 mg tablet", {
    genericName: "Teneligliptin Hydrobromide",
    strength: "20 mg",
    therapeuticClass: "DPP-4 Inhibitor",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
  }),
  oral("Voglibose 0.2 mg tablet", {
    genericName: "Voglibose",
    strength: "0.2 mg",
    therapeuticClass: "Alpha-Glucosidase Inhibitor",
    frequency: "Three times daily",
    duration: "Ongoing / continuous",
    instructions: "Take with the very first bite of each main meal",
  }),
  inj("Human Mixtard 30/70 Insulin 40 IU/ml vial", "Subcutaneous", {
    genericName: "Biphasic Isophane Insulin (30% soluble / 70% isophane)",
    strength: "40 IU/ml (10 ml vial)",
    therapeuticClass: "Premixed Human Insulin",
    dosage: "Dosed per sliding scale / doctor chart",
    frequency: "Twice daily",
    duration: "Ongoing / continuous",
    instructions: "Inject subcutaneously 30 minutes before breakfast & dinner",
  }),
  inj("Insulin Glargine 100 IU/ml pen", "Subcutaneous", {
    genericName: "Insulin Glargine (Long-Acting Basal Analog)",
    strength: "100 IU/ml",
    therapeuticClass: "Basal Insulin Analog",
    dosage: "Dosed per doctor prescription",
    frequency: "Once daily at bedtime",
    duration: "Ongoing / continuous",
    instructions: "Inject subcutaneously into thigh/abdomen at exact same time each night",
  }),

  /* ====================================================================
   * 8. RESPIRATORY, ANTI-ALLERGIC, INHALERS & NASAL DROPS
   * ==================================================================== */
  inhaler("Salbutamol inhaler 100 mcg", {
    genericName: "Salbutamol Sulphate",
    strength: "100 mcg / puff",
    therapeuticClass: "Short-Acting Beta-2 Agonist (Reliever)",
    frequency: "As needed",
    duration: "Until review",
    instructions: "2 puffs as needed for sudden wheeze or shortness of breath",
  }),
  inhaler("Asthalin 100 mcg inhaler", {
    genericName: "Salbutamol 100 mcg",
    strength: "100 mcg",
    therapeuticClass: "Bronchodilator (MDI)",
    frequency: "As needed (SOS)",
    duration: "Until review",
    instructions: "Use with spacer for asthma / wheezing flare",
  }),
  inhaler("Budesonide inhaler 200 mcg", {
    genericName: "Budesonide",
    strength: "200 mcg / puff",
    therapeuticClass: "Inhaled Corticosteroid (Preventer)",
    frequency: "Twice daily",
    duration: "Until review",
    instructions: "Rinse mouth thoroughly with water after use",
  }),
  inhaler("Budecort 200 inhaler", {
    genericName: "Budesonide 200 mcg",
    strength: "200 mcg",
    therapeuticClass: "Inhaled Corticosteroid (Preventer)",
    frequency: "Twice daily",
    duration: "Until review",
    instructions: "Rinse mouth and spit out after inhalation",
  }),
  inhaler("Budecort 0.5 mg respules", {
    genericName: "Budesonide 0.5 mg / 2 ml",
    strength: "0.5 mg / 2 ml",
    therapeuticClass: "Nebulizer Suspension",
    dosage: "1 respule",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "Pour into nebulizer chamber and nebulize over 10-15 minutes",
  }),
  inhaler("Formoterol 6 mcg + Budesonide 200 mcg inhaler", {
    genericName: "Formoterol Fumarate + Budesonide",
    strength: "6 mcg / 200 mcg",
    therapeuticClass: "LABA + ICS Maintenance Inhaler",
    frequency: "Twice daily",
    duration: "Until review",
    instructions: "2 puffs twice daily; rinse mouth after use",
  }),
  inhaler("Foracort 200 inhaler", {
    genericName: "Formoterol 6 mcg + Budesonide 200 mcg",
    strength: "6 mcg / 200 mcg",
    therapeuticClass: "Asthma / COPD Maintenance Inhaler",
    frequency: "Twice daily",
    duration: "Until review",
    instructions: "Rinse mouth after inhalation",
  }),
  inhaler("Duolin respules", {
    genericName: "Levosalbutamol 1.25 mg + Ipratropium Bromide 500 mcg",
    strength: "1.25 mg / 500 mcg / 2.5 ml",
    therapeuticClass: "Dual Bronchodilator Respules",
    dosage: "1 respule",
    frequency: "Three times daily as needed",
    duration: "3 Days",
    instructions: "Nebulize for acute bronchospasm / COPD exacerbation",
  }),
  oral("Cetirizine 10 mg tablet", {
    genericName: "Cetirizine HCl",
    strength: "10 mg",
    therapeuticClass: "2nd Gen Antihistamine",
    frequency: "Once daily",
    duration: "5 Days",
    instructions: "At bedtime",
  }),
  oral("Cetzine 10 tablet", {
    genericName: "Cetirizine 10 mg",
    strength: "10 mg",
    therapeuticClass: "Antiallergic Antihistamine",
    frequency: "Once daily",
    duration: "5 Days",
    instructions: "At bedtime",
  }),
  oral("Levocetirizine 5 mg tablet", {
    genericName: "Levocetirizine Dihydrochloride",
    strength: "5 mg",
    therapeuticClass: "Antihistamine / Antiallergic",
    frequency: "Once daily",
    duration: "5 Days",
    instructions: "At bedtime",
  }),
  oral("Levocet 5 tablet", {
    genericName: "Levocetirizine 5 mg",
    strength: "5 mg",
    therapeuticClass: "Antiallergic",
    frequency: "Once daily",
    duration: "5 Days",
    instructions: "At bedtime",
  }),
  oral("Montelukast 10 mg tablet", {
    genericName: "Montelukast Sodium",
    strength: "10 mg",
    therapeuticClass: "Leukotriene Receptor Antagonist",
    frequency: "Once daily",
    duration: "14 Days",
    instructions: "At bedtime",
  }),
  oral("Montelukast 10 mg + Levocetirizine 5 mg tablet", {
    genericName: "Montelukast + Levocetirizine",
    strength: "10 mg / 5 mg",
    therapeuticClass: "Allergic Rhinitis & Asthma Combo",
    frequency: "Once daily",
    duration: "10 Days",
    instructions: "At bedtime",
  }),
  oral("Monticope tablet", {
    genericName: "Montelukast 10 mg + Levocetirizine 5 mg",
    strength: "10 mg / 5 mg",
    therapeuticClass: "Antiallergic Combination",
    frequency: "Once daily",
    duration: "10 Days",
    instructions: "Take 1 tablet at night for allergic sneezing / rhinitis",
  }),
  oral("Fexofenadine 120 mg tablet", {
    genericName: "Fexofenadine HCl",
    strength: "120 mg",
    therapeuticClass: "Non-Sedating Antihistamine",
    frequency: "Once daily",
    duration: "5 Days",
    instructions: "Before meals with water (avoid fruit juice)",
  }),
  oral("Allegra 120 tablet", {
    genericName: "Fexofenadine 120 mg",
    strength: "120 mg",
    therapeuticClass: "Non-Sedating Antihistamine",
    frequency: "Once daily",
    duration: "5 Days",
    instructions: "Take with water before food",
  }),
  oral("Allegra 180 tablet", {
    genericName: "Fexofenadine 180 mg",
    strength: "180 mg",
    therapeuticClass: "Antihistamine / Chronic Urticaria",
    frequency: "Once daily",
    duration: "10 Days",
    instructions: "For skin allergies / hives / chronic urticaria",
  }),
  drops("Xylometazoline 0.1% nasal drops", "Nasal", {
    genericName: "Xylometazoline HCl 0.1%",
    strength: "0.1% w/v",
    therapeuticClass: "Nasal Decongestant",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "2 drops in each nostril; do NOT use for more than 5 consecutive days",
  }),
  drops("Otrivin Adult nasal drops", "Nasal", {
    genericName: "Xylometazoline 0.1%",
    strength: "0.1%",
    therapeuticClass: "Nasal Decongestant",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "For blocked nose; maximum 5 days",
  }),
  drops("Fluticasone Propionate 50 mcg nasal spray", "Nasal", {
    genericName: "Fluticasone Propionate",
    strength: "50 mcg / spray",
    therapeuticClass: "Intranasal Corticosteroid",
    dosage: "2 sprays in each nostril",
    frequency: "Once daily",
    duration: "30 Days",
    instructions: "Shake well; blow nose gently before spraying",
  }),
  drops("Flomist nasal spray", "Nasal", {
    genericName: "Fluticasone Propionate 50 mcg",
    strength: "50 mcg",
    therapeuticClass: "Allergic Rhinitis Nasal Spray",
    dosage: "2 sprays each nostril",
    frequency: "Once daily in the morning",
    duration: "30 Days",
    instructions: "For allergic sneezing and nasal blockage",
  }),

  /* ====================================================================
   * 9. TOPICAL MEDICINES, GELS, CREAMS & OINTMENTS
   * ==================================================================== */
  topical("Diclofenac Diethylamine 1.16% Gel", {
    genericName: "Diclofenac Diethylamine + Virgin Linseed Oil + Methyl Salicylate + Menthol",
    strength: "30g tube",
    therapeuticClass: "Topical NSAID Analgesic",
    dosage: "Apply gently",
    frequency: "Three times daily",
    duration: "10 Days",
    instructions: "Apply over affected joint without vigorous massage",
  }),
  topical("Volini Gel 30g", {
    genericName: "Diclofenac Diethylamine 1.16% w/w Gel",
    strength: "30g",
    therapeuticClass: "Pain Relief Gel",
    dosage: "Apply thinly",
    frequency: "Three times daily",
    duration: "7 Days",
    instructions: "Apply gently to sprains / joint pain",
  }),
  topical("Omnigel 30g", {
    genericName: "Diclofenac Diethylamine + Virgin Linseed Oil Gel",
    strength: "30g",
    therapeuticClass: "Musculoskeletal Pain Gel",
    dosage: "Apply thinly",
    frequency: "Three times daily",
    duration: "7 Days",
  }),
  topical("Povidone-Iodine 5% ointment 20g", {
    genericName: "Povidone-Iodine 5% w/w",
    strength: "20g tube",
    therapeuticClass: "Antiseptic & Wound Healing",
    dosage: "Apply thinly",
    frequency: "Twice daily",
    duration: "7 Days",
    instructions: "Clean wound first, apply ointment, cover with sterile gauze",
  }),
  topical("Betadine 5% ointment 20g", {
    genericName: "Povidone-Iodine 5% w/w",
    strength: "20g",
    therapeuticClass: "Antiseptic Ointment",
    dosage: "Apply gently",
    frequency: "Twice daily",
    duration: "7 Days",
    instructions: "For minor cuts, abrasions, and dressing wounds",
  }),
  topical("Mupirocin 2% ointment", {
    genericName: "Mupirocin",
    strength: "2% w/w (5g)",
    therapeuticClass: "Topical Antibacterial (MRSA / Impetigo)",
    duration: "5 Days",
    instructions: "Apply to bacterial skin infections / folliculitis",
  }),
  topical("T-Bact 2% ointment 5g", {
    genericName: "Mupirocin 2% w/w",
    strength: "5g",
    therapeuticClass: "Topical Antibacterial",
    duration: "5 Days",
    instructions: "Apply three times daily",
  }),
  topical("Silver Sulfadiazine 1% cream 50g", {
    genericName: "Silver Sulfadiazine 1% w/w",
    strength: "50g",
    therapeuticClass: "Burn Wound Antimicrobial",
    dosage: "Apply 1-2 mm layer",
    frequency: "Twice daily",
    duration: "10 Days",
    instructions: "Apply under sterile precautions for burn dressings",
  }),
  topical("Framycetin skin cream (Soframycin) 30g", {
    genericName: "Framycetin Sulphate 1% w/w",
    strength: "30g",
    therapeuticClass: "Topical Antibiotic Cream",
    duration: "7 Days",
    instructions: "For superficial traumatic wounds and burns",
  }),
  topical("Clotrimazole 1% cream", {
    genericName: "Clotrimazole",
    strength: "1% w/w (20g)",
    therapeuticClass: "Topical Antifungal",
    duration: "14 Days",
    instructions: "Apply to affected skin twice daily for ringworm / fungal tinea",
  }),
  topical("Candid-B cream 20g", {
    genericName: "Clotrimazole 1% + Beclomethasone Dipropionate 0.025%",
    strength: "20g",
    therapeuticClass: "Antifungal + Anti-inflammatory Steroid",
    duration: "10 Days",
    instructions: "Apply thinly on itchy fungal lesions",
  }),
  topical("Terbinafine 1% cream 15g", {
    genericName: "Terbinafine HCl",
    strength: "1% w/w",
    therapeuticClass: "Topical Antifungal",
    duration: "14 Days",
    instructions: "Apply once daily after cleaning and drying the area",
  }),
  topical("Luliconazole 1% cream 20g", {
    genericName: "Luliconazole",
    strength: "1% w/w",
    therapeuticClass: "Broad Spectrum Antifungal",
    duration: "14 Days",
    instructions: "Apply once daily to affected skin",
  }),
  topical("Clobetasol Propionate 0.05% cream", {
    genericName: "Clobetasol Propionate",
    strength: "0.05% w/w (20g)",
    therapeuticClass: "Superpotent Topical Corticosteroid",
    duration: "7 Days",
    instructions: "Apply thinly to severe eczema / psoriasis; avoid on face",
  }),
  topical("Hydrocortisone 1% cream", {
    genericName: "Hydrocortisone Acetate",
    strength: "1% w/w (15g)",
    therapeuticClass: "Mild Topical Corticosteroid",
    duration: "5 Days",
    instructions: "Apply thinly for mild dermatitis or allergic rash",
  }),
  topical("Permethrin 5% cream", {
    genericName: "Permethrin",
    strength: "5% w/w (30g)",
    therapeuticClass: "Scabicide / Antiparasitic",
    dosage: "Apply once all over body below neck",
    frequency: "Immediately (Single application)",
    duration: "1 Day",
    instructions: "Leave on for 8-12 hours overnight, wash off thoroughly in morning",
  }),
  topical("Calamine lotion 100 ml", {
    genericName: "Calamine + Zinc Oxide + Glycerin",
    strength: "100 ml",
    therapeuticClass: "Soothing Antipruritic Lotion",
    dosage: "Apply gently",
    frequency: "Three times daily as needed",
    duration: "7 Days",
    instructions: "Shake bottle well; apply with cotton pad for chickenpox / prickly heat rash",
  }),

  /* ====================================================================
   * 10. OPHTHALMIC & OTIC (EYE & EAR DROPS)
   * ==================================================================== */
  drops("Ciprofloxacin 0.3% eye/ear drops 10 ml", "Ophthalmic", {
    genericName: "Ciprofloxacin HCl 0.3%",
    strength: "0.3% w/v",
    therapeuticClass: "Antibacterial Eye / Ear Drops",
    frequency: "Four times daily",
    duration: "5 Days",
    instructions: "Instill 1-2 drops into affected eye/ear",
  }),
  drops("Ciplox eye/ear drops 10 ml", "Ophthalmic", {
    genericName: "Ciprofloxacin 0.3%",
    strength: "0.3%",
    therapeuticClass: "Antibacterial Eye / Ear Drops",
    frequency: "Four times daily",
    duration: "5 Days",
  }),
  drops("Moxifloxacin 0.5% eye drops 5 ml", "Ophthalmic", {
    genericName: "Moxifloxacin HCl 0.5%",
    strength: "0.5% w/v",
    therapeuticClass: "Broad Spectrum Antibacterial Eye Drops",
    frequency: "Three times daily",
    duration: "5 Days",
    instructions: "1 drop in affected eye for bacterial conjunctivitis",
  }),
  drops("Vigamox 0.5% eye drops 5 ml", "Ophthalmic", {
    genericName: "Moxifloxacin 0.5%",
    strength: "0.5%",
    therapeuticClass: "Antibacterial Eye Drops",
    frequency: "Three times daily",
    duration: "5 Days",
  }),
  drops("Tobramycin 0.3% eye drops 5 ml", "Ophthalmic", {
    genericName: "Tobramycin",
    strength: "0.3% w/v",
    therapeuticClass: "Aminoglycoside Ophthalmic Antibiotic",
    frequency: "Four times daily",
    duration: "5 Days",
  }),
  drops("Carboxymethylcellulose 0.5% eye drops 10 ml", "Ophthalmic", {
    genericName: "Carboxymethylcellulose Sodium 0.5%",
    strength: "0.5% w/v",
    therapeuticClass: "Lubricating Artificial Tears",
    frequency: "Four times daily",
    duration: "30 Days",
    instructions: "1-2 drops in both eyes for dry eyes / computer eye strain",
  }),
  drops("Refresh Tears 0.5% eye drops 10 ml", "Ophthalmic", {
    genericName: "Carboxymethylcellulose 0.5%",
    strength: "0.5%",
    therapeuticClass: "Lubricant Eye Drops",
    frequency: "Four times daily",
    duration: "30 Days",
  }),
  drops("Olopatadine 0.1% eye drops 5 ml", "Ophthalmic", {
    genericName: "Olopatadine HCl 0.1%",
    strength: "0.1% w/v",
    therapeuticClass: "Antiallergic Ophthalmic Drops",
    frequency: "Twice daily",
    duration: "14 Days",
    instructions: "1 drop in each eye for allergic itchy eyes",
  }),
  drops("Wax dissolver ear drops 10 ml", "Otic", {
    genericName: "Paradichlorobenzene + Benzocaine + Chlorbutol + Turpentine Oil",
    strength: "10 ml",
    therapeuticClass: "Cerumenolytic / Ear Wax Softener",
    dosage: "3-4 drops",
    frequency: "Three times daily",
    duration: "4 Days",
    instructions: "Instill 3-4 drops into ear canal, keep head tilted for 5 minutes",
  }),
  drops("Waxsol / Clearwax ear drops 10 ml", "Otic", {
    genericName: "Paradichlorobenzene + Benzocaine Ear Drops",
    strength: "10 ml",
    therapeuticClass: "Ear Wax Softener",
    dosage: "3-4 drops",
    frequency: "Three times daily",
    duration: "4 Days",
  }),

  /* ====================================================================
   * 11. INJECTIONS & EMERGENCY / CLINICAL MEDICATIONS
   * ==================================================================== */
  inj("Inj. Paracetamol 1000 mg / 100 ml IV infusion", "Intravenous", {
    genericName: "Paracetamol 1000 mg IV",
    strength: "1000 mg / 100 ml",
    therapeuticClass: "IV Antipyretic & Post-Op Analgesic",
    dosage: "100 ml infusion",
    frequency: "Twice daily as needed",
    duration: "1 Day",
    instructions: "Infuse over 15 minutes for severe acute fever / postoperative pain",
  }),
  inj("Inj. Diclofenac Sodium 75 mg / 1 ml", "Intramuscular", {
    genericName: "Diclofenac Sodium 75 mg",
    strength: "75 mg / 1 ml",
    therapeuticClass: "Injectable NSAID",
    frequency: "Stat (Single dose)",
    duration: "1 Day",
    instructions: "Deep intragluteal IM injection for acute renal colic or severe joint pain",
  }),
  inj("Dynapar AQ 75 mg injection", "Intramuscular", {
    genericName: "Diclofenac Sodium 75 mg / ml",
    strength: "75 mg / ml",
    therapeuticClass: "Injectable Analgesic",
    frequency: "Stat (Single dose)",
    duration: "1 Day",
    instructions: "Deep IM injection for severe pain",
  }),
  inj("Inj. Tramadol 50 mg / 1 ml", "Intramuscular", {
    genericName: "Tramadol HCl 50 mg / ml",
    strength: "50 mg / ml",
    therapeuticClass: "Injectable Opioid Analgesic",
    frequency: "Stat / SOS",
    duration: "1 Day",
    instructions: "Slow IV or deep IM injection",
  }),
  inj("Inj. Ondansetron 4 mg / 2 ml", "Intravenous", {
    genericName: "Ondansetron HCl 2 mg / ml",
    strength: "4 mg / 2 ml",
    therapeuticClass: "Injectable Antiemetic",
    frequency: "Stat (Single dose)",
    duration: "1 Day",
    instructions: "Slow IV push over 2-3 minutes for severe vomiting / dehydration",
  }),
  inj("Emeset 2 ml injection", "Intravenous", {
    genericName: "Ondansetron 4 mg / 2 ml",
    strength: "4 mg / 2 ml",
    therapeuticClass: "Injectable Antiemetic",
    frequency: "Stat / SOS",
    duration: "1 Day",
  }),
  inj("Inj. Pantoprazole 40 mg IV vial", "Intravenous", {
    genericName: "Pantoprazole Sodium 40 mg IV",
    strength: "40 mg lyophilized vial",
    therapeuticClass: "Injectable PPI",
    dosage: "1 reconstituted vial",
    frequency: "Once daily",
    duration: "1 Day",
    instructions: "Reconstitute with 10ml normal saline and give slow IV push over 2 minutes",
  }),
  inj("Pantocid 40 mg injection", "Intravenous", {
    genericName: "Pantoprazole 40 mg IV",
    strength: "40 mg",
    therapeuticClass: "Injectable PPI",
    frequency: "Once daily",
    duration: "1 Day",
  }),
  inj("Inj. Ceftriaxone 1g IV/IM vial", "Intravenous", {
    genericName: "Ceftriaxone Sodium 1g",
    strength: "1g vial with sterile water",
    therapeuticClass: "Broad Spectrum 3rd Gen Cephalosporin",
    dosage: "1g reconstituted vial",
    frequency: "Once daily",
    duration: "3 Days",
    instructions: "Reconstitute and administer slow IV over 2-4 minutes",
  }),
  inj("Monocef 1g injection", "Intravenous", {
    genericName: "Ceftriaxone Sodium 1g",
    strength: "1g",
    therapeuticClass: "Injectable Cephalosporin",
    dosage: "1g vial",
    frequency: "Once daily",
    duration: "3 Days",
  }),
  inj("Inj. Amoxicillin + Potassium Clavulanate 1.2g IV", "Intravenous", {
    genericName: "Amoxicillin 1000 mg + Potassium Clavulanate 200 mg",
    strength: "1.2g vial",
    therapeuticClass: "Injectable Antibiotic Combo",
    frequency: "Twice daily",
    duration: "3 Days",
    instructions: "Slow IV injection over 3-4 minutes",
  }),
  inj("Augmentin 1.2g injection", "Intravenous", {
    genericName: "Amoxicillin + Clavulanic Acid 1.2g",
    strength: "1.2g",
    therapeuticClass: "Injectable Antibiotic",
    frequency: "Twice daily",
    duration: "3 Days",
  }),
  inj("Inj. Dexamethasone 4 mg / 1 ml", "Intravenous", {
    genericName: "Dexamethasone Sodium Phosphate",
    strength: "4 mg / ml (2 ml ampoule)",
    therapeuticClass: "Injectable Glucocorticoid",
    frequency: "Stat (Single dose)",
    duration: "1 Day",
    instructions: "IV or IM for severe allergy / acute inflammation",
  }),
  inj("Inj. Hydrocortisone Sodium Succinate 100 mg vial", "Intravenous", {
    genericName: "Hydrocortisone 100 mg",
    strength: "100 mg vial",
    therapeuticClass: "Emergency Corticosteroid",
    frequency: "Stat (Single dose)",
    duration: "1 Day",
    instructions: "Emergency IV push for anaphylaxis / acute asthma / septic shock",
  }),
  inj("Inj. Tetanus Toxoid (TT) 0.5 ml", "Intramuscular", {
    genericName: "Tetanus Toxoid Vaccine Adsorbed",
    strength: "0.5 ml ampoule",
    therapeuticClass: "Active Immunization / Prophylaxis",
    frequency: "Stat (Single dose)",
    duration: "1 Day",
    instructions: "Deep IM injection in deltoid for dirty wound / injury prophylaxis",
  }),
  inj("Inj. Vitamin B12 / Neurobion 2 ml", "Intramuscular", {
    genericName: "Vitamin B1 + B6 + B12 (Mecobalamin 1000 mcg)",
    strength: "2 ml ampoule",
    therapeuticClass: "Injectable Neurotropic B-Vitamins",
    frequency: "Alternate day for 5 doses",
    duration: "10 Days",
    instructions: "Deep intragluteal IM injection",
  }),

  /* ====================================================================
   * 12. INTRAVENOUS FLUIDS (IV FLUIDS & INFUSIONS)
   * ==================================================================== */
  ivFluid("Normal Saline (NS 0.9%) 500 ml IV infusion", {
    genericName: "Sodium Chloride 0.9% w/v",
    strength: "500 ml bottle",
    therapeuticClass: "Isotonic Crystalloid IV Fluid",
    instructions: "Intravenous infusion at 30-40 drops/min for rehydration / drug dilution",
  }),
  ivFluid("Ringer Lactate (RL) 500 ml IV infusion", {
    genericName: "Sodium Lactate + Sodium Chloride + Potassium Chloride + Calcium Chloride",
    strength: "500 ml bottle",
    therapeuticClass: "Balanced Electrolyte Fluid / Resuscitation",
    instructions: "IV infusion for trauma, dehydration, perioperative volume maintenance",
  }),
  ivFluid("Dextrose 5% (D5) 500 ml IV infusion", {
    genericName: "Dextrose 5% w/v (Anhydrous Glucose)",
    strength: "500 ml bottle",
    therapeuticClass: "Hypoglycemia & Free Water Hydration",
    instructions: "IV infusion for hypoglycemia or maintenance calories",
  }),
  ivFluid("Dextrose Normal Saline (DNS) 500 ml IV infusion", {
    genericName: "Dextrose 5% + Sodium Chloride 0.9%",
    strength: "500 ml bottle",
    therapeuticClass: "Maintenance IV Fluid",
    instructions: "IV infusion for maintenance hydration and caloric support",
  }),

  /* ====================================================================
   * 13. VITAMINS, MINERALS, NUTRITION & HEMATINICS
   * ==================================================================== */
  capsule("Vitamin B-Complex with Vitamin C & Zinc", {
    genericName: "Vitamin B-Complex + Vitamin C 50 mg + Zinc Sulphate",
    strength: "Multivitamin capsule",
    therapeuticClass: "Nutritional Supplement / Immunity",
    dosage: "1 capsule",
    frequency: "Once daily",
    duration: "30 Days",
    instructions: "After breakfast or lunch",
  }),
  capsule("Becosules capsule", {
    genericName: "Vitamin B-Complex with Vitamin C",
    strength: "B-Complex + Vit C",
    therapeuticClass: "Mouth Ulcers & Vitamin B Supplement",
    dosage: "1 capsule",
    frequency: "Once daily",
    duration: "15 Days",
    instructions: "After meals",
  }),
  oral("Neurobion Forte tablet", {
    genericName: "Vitamin B1 + B6 + B12 (Mecobalamin)",
    strength: "B1 10mg + B6 3mg + B12 15mcg",
    therapeuticClass: "Neurotropic Vitamin Supplement",
    frequency: "Once daily",
    duration: "30 Days",
    instructions: "After meals for nerve health and tingling",
  }),
  capsule("Nurokind-Plus RF capsule", {
    genericName: "Mecobalamin 1500 mcg + Alpha Lipoic Acid + Pyridoxine + Folic Acid",
    strength: "1500 mcg combo",
    therapeuticClass: "Diabetic Neuropathy / Antioxidant",
    dosage: "1 capsule",
    frequency: "Once daily",
    duration: "30 Days",
    instructions: "After dinner",
  }),
  oral("Methylcobalamin 1500 mcg tablet", {
    genericName: "Methylcobalamin (Active Vitamin B12)",
    strength: "1500 mcg",
    therapeuticClass: "Vitamin B12 Supplement",
    frequency: "Once daily",
    duration: "30 Days",
    instructions: "After meals",
  }),
  oral("Ferrous ascorbate + Folic acid tablet", {
    genericName: "Ferrous Ascorbate 100 mg + Folic Acid 1.5 mg",
    strength: "100 mg elemental Fe / 1.5 mg",
    therapeuticClass: "Iron Deficiency Anemia Therapy",
    frequency: "Once daily",
    duration: "30 Days",
    instructions: "After meals with water or citrus juice (avoid milk / tea / coffee)",
  }),
  oral("Orofer-XT tablet", {
    genericName: "Ferrous Ascorbate 100 mg + Folic Acid 1.5 mg",
    strength: "100 mg / 1.5 mg",
    therapeuticClass: "Hematinic / Iron Supplement",
    frequency: "Once daily",
    duration: "30 Days",
    instructions: "After meals with water",
  }),
  oral("Folic acid 5 mg tablet", {
    genericName: "Folic Acid",
    strength: "5 mg",
    therapeuticClass: "Folate Supplement / Prenatal",
    frequency: "Once daily",
    duration: "30 Days",
    instructions: "After meals",
  }),
  oral("Vitamin C 500 mg chewable tablet", {
    genericName: "Ascorbic Acid 100 mg + Sodium Ascorbate 450 mg",
    strength: "500 mg",
    therapeuticClass: "Antioxidant & Tissue Repair",
    dosage: "1 tablet (chewable)",
    frequency: "Once daily",
    duration: "15 Days",
    instructions: "Chew tablet thoroughly after food",
  }),
  oral("Limcee 500 mg chewable tablet", {
    genericName: "Vitamin C 500 mg",
    strength: "500 mg",
    therapeuticClass: "Vitamin C Supplement",
    dosage: "1 tablet (chewable)",
    frequency: "Once daily",
    duration: "15 Days",
  }),
  capsule("Vitamin E 400 IU capsule", {
    genericName: "dl-Alpha Tocopheryl Acetate",
    strength: "400 IU",
    therapeuticClass: "Lipid-Soluble Antioxidant",
    dosage: "1 capsule",
    frequency: "Once daily",
    duration: "30 Days",
    instructions: "After meals with water",
  }),
  capsule("Evion 400 capsule", {
    genericName: "Vitamin E 400 IU",
    strength: "400 IU",
    therapeuticClass: "Vitamin E Supplement",
    dosage: "1 capsule",
    frequency: "Once daily",
    duration: "30 Days",
  }),
  oral("Zinc 20 mg tablet", {
    genericName: "Zinc Sulphate / Gluconate",
    strength: "20 mg elemental Zn",
    therapeuticClass: "Trace Mineral & Wound Healing",
    frequency: "Once daily",
    duration: "14 Days",
  }),
  oral("Zincovit tablet", {
    genericName: "Multivitamin + Multimineral + Grape Seed Extract",
    strength: "Multivitamin tablet",
    therapeuticClass: "Daily General Health Supplement",
    frequency: "Once daily",
    duration: "30 Days",
    instructions: "After breakfast",
  }),

  /* ====================================================================
   * 14. UROLOGY, MEN'S & WOMEN'S HEALTH
   * ==================================================================== */
  capsule("Tamsulosin 0.4 mg capsule", {
    genericName: "Tamsulosin HCl",
    strength: "0.4 mg MR",
    therapeuticClass: "Alpha-1 Blocker / BPH Therapy",
    dosage: "1 capsule",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
    instructions: "30 minutes after dinner at bedtime",
  }),
  capsule("Urimax 0.4 capsule", {
    genericName: "Tamsulosin 0.4 mg",
    strength: "0.4 mg",
    therapeuticClass: "Prostate & Urinary Flow Agent",
    dosage: "1 capsule",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
    instructions: "Take 30 minutes after the same meal every day",
  }),
  capsule("Silodosin 8 mg capsule", {
    genericName: "Silodosin",
    strength: "8 mg",
    therapeuticClass: "Uroselective Alpha-1A Blocker",
    dosage: "1 capsule",
    frequency: "Once daily",
    duration: "30 Days",
    instructions: "Take with food at dinner",
  }),
  oral("Tranexamic acid 500 mg tablet", {
    genericName: "Tranexamic Acid",
    strength: "500 mg",
    therapeuticClass: "Antifibrinolytic Hemostatic Agent",
    frequency: "Three times daily",
    duration: "3 Days",
    instructions: "For heavy bleeding / post-extraction hemorrhage",
  }),
  oral("Pause 500 tablet", {
    genericName: "Tranexamic Acid 500 mg",
    strength: "500 mg",
    therapeuticClass: "Hemostatic Agent",
    frequency: "Three times daily",
    duration: "3 Days",
  }),
  oral("Mefenamic Acid 500 mg + Tranexamic Acid 500 mg tablet", {
    genericName: "Mefenamic Acid + Tranexamic Acid",
    strength: "500 mg / 500 mg",
    therapeuticClass: "Menorrhagia & Dysmenorrhea Combo",
    frequency: "Three times daily",
    duration: "3 Days",
    instructions: "During menstrual flow for excessive bleeding and cramps",
  }),
  oral("Trapic-MF tablet", {
    genericName: "Tranexamic Acid 500 mg + Mefenamic Acid 250 mg",
    strength: "500 mg / 250 mg",
    therapeuticClass: "Antifibrinolytic / Antispasmodic",
    frequency: "Three times daily",
    duration: "3 Days",
  }),
  oral("Norethisterone 5 mg tablet", {
    genericName: "Norethisterone",
    strength: "5 mg",
    therapeuticClass: "Synthetic Progestogen",
    frequency: "Twice daily",
    duration: "10 Days",
    instructions: "For dysfunctional uterine bleeding / cycle regulation",
  }),
  oral("Primolut-N 5 mg tablet", {
    genericName: "Norethisterone 5 mg",
    strength: "5 mg",
    therapeuticClass: "Progestogen Therapy",
    frequency: "Twice daily",
    duration: "10 Days",
  }),
  suppository("Clotrimazole 100 mg vaginal pessary", "Vaginal", {
    genericName: "Clotrimazole",
    strength: "100 mg",
    therapeuticClass: "Vaginal Antifungal",
    frequency: "At bedtime",
    duration: "6 Days",
    instructions: "Insert 1 pessary deeply into vagina at bedtime using applicator",
  }),

  /* ====================================================================
   * 15. NEUROLOGY, MIGRAINE, PSYCHIATRIC & SLEEP
   * ==================================================================== */
  oral("Levothyroxine 50 mcg tablet", {
    genericName: "Levothyroxine Sodium",
    strength: "50 mcg",
    therapeuticClass: "Thyroid Hormone Replacement",
    frequency: "Once daily",
    duration: "Ongoing / continuous",
    instructions: "On an empty stomach at least 30-60 minutes before morning tea/breakfast",
  }),
  oral("Prednisolone 5 mg tablet", {
    genericName: "Prednisolone",
    strength: "5 mg",
    therapeuticClass: "Systemic Glucocorticoid",
    frequency: "Once daily",
    duration: "5 Days",
    instructions: "After meals in the morning; taper as advised",
  }),
  oral("Propranolol 20 mg tablet", {
    genericName: "Propranolol HCl",
    strength: "20 mg",
    therapeuticClass: "Non-Selective Beta Blocker / Migraine",
    frequency: "Twice daily",
    duration: "30 Days",
    instructions: "For migraine prophylaxis / essential tremors",
  }),
  oral("Inderal 20 tablet", {
    genericName: "Propranolol 20 mg",
    strength: "20 mg",
    therapeuticClass: "Beta Blocker / Migraine Prophylaxis",
    frequency: "Twice daily",
    duration: "30 Days",
  }),
  oral("Amitriptyline 10 mg tablet", {
    genericName: "Amitriptyline HCl",
    strength: "10 mg",
    therapeuticClass: "Tricyclic / Neuropathic Pain & Sleep",
    frequency: "Once daily at bedtime",
    duration: "30 Days",
    instructions: "Take 1-2 hours before sleeping for tension headaches / fibromyalgia",
  }),
  oral("Escitalopram 10 mg tablet", {
    genericName: "Escitalopram Oxalate",
    strength: "10 mg",
    therapeuticClass: "SSRI Antidepressant & Anxiolytic",
    frequency: "Once daily in the morning",
    duration: "30 Days",
    instructions: "Take at regular time daily after breakfast",
  }),
  oral("Nexito 10 tablet", {
    genericName: "Escitalopram 10 mg",
    strength: "10 mg",
    therapeuticClass: "SSRI Anxiolytic / Antidepressant",
    frequency: "Once daily",
    duration: "30 Days",
  }),
  oral("Clonazepam 0.5 mg tablet", {
    genericName: "Clonazepam",
    strength: "0.5 mg",
    therapeuticClass: "Benzodiazepine / Anxiolytic",
    frequency: "At bedtime as needed",
    duration: "7 Days",
    instructions: "Take at bedtime for severe acute panic / insomnia",
  }),
  oral("Zolpidem 10 mg tablet", {
    genericName: "Zolpidem Tartrate",
    strength: "10 mg",
    therapeuticClass: "Non-Benzodiazepine Hypnotic (Sedative)",
    frequency: "At bedtime as needed",
    duration: "5 Days",
    instructions: "Take immediately before going to bed; avoid alcohol",
  }),
  oral("Levetiracetam 500 mg tablet", {
    genericName: "Levetiracetam",
    strength: "500 mg",
    therapeuticClass: "Antiepileptic / Anticonvulsant",
    frequency: "Twice daily",
    duration: "Ongoing / continuous",
    instructions: "Take at 12-hour intervals strictly",
  }),

  /* ====================================================================
   * 16. RECTAL SUPPOSITORIES
   * ==================================================================== */
  suppository("Bisacodyl 10 mg suppository", "Rectal", {
    genericName: "Bisacodyl",
    strength: "10 mg",
    therapeuticClass: "Rectal Laxative / Enema Alternative",
    frequency: "Once stat / As needed",
    duration: "1 Day",
    instructions: "Unwrap and insert into rectum; acts within 15-30 minutes for acute constipation",
  }),
  suppository("Paracetamol 170 mg suppository", "Rectal", {
    genericName: "Paracetamol 170 mg Pediatric Suppository",
    strength: "170 mg",
    therapeuticClass: "Pediatric Rectal Antipyretic",
    frequency: "As needed",
    duration: "1 Day",
    instructions: "For high pediatric fever when child is actively vomiting oral medicine",
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

/** Look up a built-in common medicine by name or generic name (normalized). */
export function findCommonDrugByName(name: string): CommonDrug | null {
  const key = normalizeDrugName(name);
  if (!key) return null;
  return (
    COMMON_DRUGS.find(
      (drug) =>
        normalizeDrugName(drug.name) === key ||
        (drug.genericName && normalizeDrugName(drug.genericName) === key)
    ) ?? null
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
  const common =
    findCommonDrugByName(entry.name) ||
    (entry.genericName ? findCommonDrugByName(entry.genericName) : null);
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
      stockQuantity: entry.stockQuantity,
      reorderLevel: entry.reorderLevel,
      genericName: entry.genericName,
      category: entry.category,
      strength: entry.strength,
      batchNumber: entry.batchNumber,
      expiryDate: entry.expiryDate,
      unitPrice: entry.unitPrice,
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
      genericName: drug.genericName ?? null,
      category: drug.category ?? null,
      strength: drug.strength ?? null,
      defaults: defaultsFromCommonDrug(drug),
    });
  });

  return suggestions;
}

/**
 * Filter suggestions matching brand name, generic salt composition, category, or strength.
 * Scores exact matches and prefix matches highest.
 */
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
      const normalizedGeneric = suggestion.genericName
        ? normalizeDrugName(suggestion.genericName)
        : "";
      const normalizedCat = suggestion.category
        ? normalizeDrugName(suggestion.category)
        : "";

      const nameIndex = normalizedName.indexOf(normalizedQuery);
      const genericIndex = normalizedGeneric.indexOf(normalizedQuery);
      const catIndex = normalizedCat.indexOf(normalizedQuery);

      const isMatch = nameIndex >= 0 || genericIndex >= 0 || catIndex >= 0;
      const nameStarts = normalizedName.startsWith(normalizedQuery);

      return {
        suggestion,
        index,
        isMatch,
        nameStarts,
        nameIndex,
        genericIndex,
        catIndex,
      };
    })
    .filter((item) => item.isMatch)
    .sort((a, b) => {
      // 1. Medicines whose name begins with the search query come first
      if (a.nameStarts !== b.nameStarts) {
        return a.nameStarts ? -1 : 1;
      }

      // 2. High-usage clinic medicines rank next
      if (b.suggestion.usageCount !== a.suggestion.usageCount) {
        return b.suggestion.usageCount - a.suggestion.usageCount;
      }

      // 3. Name matches before generic matches
      const aNameHas = a.nameIndex >= 0;
      const bNameHas = b.nameIndex >= 0;
      if (aNameHas !== bNameHas) {
        return aNameHas ? -1 : 1;
      }

      // 4. Earlier match index in name
      if (a.nameIndex !== b.nameIndex) {
        return a.nameIndex - b.nameIndex;
      }

      // 5. Generic matches
      if (a.genericIndex !== b.genericIndex) {
        return a.genericIndex - b.genericIndex;
      }

      return a.index - b.index;
    })
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

/**
 * Calculates the quantity of units (tablets, capsules, bottles, etc.)
 * dispensed from a prescribed medicine line item.
 */
export function parsePrescriptionQuantity(medicine: Medicine): number {
  if (medicine.quantity) {
    const match = medicine.quantity.match(/\d+/);
    if (match) {
      const parsed = parseInt(match[0], 10);
      if (parsed > 0) return parsed;
    }
  }

  // Calculate daily frequency count
  const freq = (medicine.frequency || "").toLowerCase();
  let dailyDose = 1;
  if (
    freq.includes("three times") ||
    freq.includes("thrice") ||
    freq.includes("1-1-1") ||
    freq.includes("tds") ||
    freq.includes("tid")
  ) {
    dailyDose = 3;
  } else if (
    freq.includes("four times") ||
    freq.includes("1-1-1-1") ||
    freq.includes("qid")
  ) {
    dailyDose = 4;
  } else if (
    freq.includes("twice") ||
    freq.includes("1-0-1") ||
    freq.includes("0-1-1") ||
    freq.includes("1-1-0") ||
    freq.includes("bd") ||
    freq.includes("bid")
  ) {
    dailyDose = 2;
  } else if (
    freq.includes("once") ||
    freq.includes("1-0-0") ||
    freq.includes("0-0-1") ||
    freq.includes("0-1-0") ||
    freq.includes("od")
  ) {
    dailyDose = 1;
  } else if (freq.includes("alternate") || freq.includes("every other day")) {
    dailyDose = 0.5;
  } else if (freq.includes("sos") || freq.includes("needed") || freq.includes("prn")) {
    dailyDose = 1;
  }

  // Parse duration days
  const dur = (medicine.duration || "").toLowerCase();
  let days = 5;
  const durMatch = dur.match(/(\d+)\s*(day|days|week|weeks|month|months)?/);
  if (durMatch) {
    const num = parseInt(durMatch[1], 10);
    const unit = durMatch[2] || "days";
    if (unit.startsWith("week")) {
      days = num * 7;
    } else if (unit.startsWith("month")) {
      days = num * 30;
    } else {
      days = num;
    }
  }

  const route = (medicine.route || "").toLowerCase();
  if (
    route.includes("topical") ||
    route.includes("inhal") ||
    route.includes("drop") ||
    route.includes("spray") ||
    route.includes("ointment") ||
    route.includes("gel")
  ) {
    return 1;
  }

  return Math.max(1, Math.ceil(dailyDose * days));
}

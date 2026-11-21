export type ClinicalMacro = {
  id: string;
  code: string;
  category: "complaints" | "examination" | "advice" | "plan" | "all";
  description: string;
  isBuiltIn?: boolean;
};

export const BUILTIN_CLINICAL_MACROS: ClinicalMacro[] = [
  // --- EXAMINATION MACROS (seen in Apollo SOM EMR video at 00:51, 00:54) ---
  {
    id: "macro-lumbar",
    code: "LUMBAR",
    category: "examination",
    description:
      "LS SPINE: LUMBER LORDOSIS MAINTAINED, ACTIVE SLR POSSIBLE, NO STRETCH PAIN PRESENT, FIG OF 4 FREE & PAINLESS, BACK SPASM ++, NO TENDERNESS, NO DEFORMITY, ROM OF FLEXION, ROTATIONS - PAINLESS AND FREE, EXTENSION IS PAINFUL, ADP WELL FELT, ABLE TO WALKS ON TOES AND HEELS, NO NVD",
    isBuiltIn: true,
  },
  {
    id: "macro-knee",
    code: "KNEE",
    category: "examination",
    description:
      "KNEE: ACTIVE/SLR POSSIBLE, PAINLESS/CREPITUS PRESENT ON MOV... JOINT LINE TENDERNESS: PRESENT OVER (M/L/B), NO SWELLING, EFFUSION, LAXITY: VARUS/VALGUS, LACHMAN: NEGATIVE, NO INSTABILITY, ADP WELL FELT, NO POPLITEAL REGION FULLNESS, NVL: NVD",
    isBuiltIn: true,
  },
  {
    id: "macro-hip",
    code: "HIP",
    category: "examination",
    description:
      "HIP BOTH SIDES: ACTIVE SLR PAINLESS & FULL ROM, EXTERNAL ROTATION- PAINLESS AND FREE, NO TROCHANTERIC TENDERNESS, ROM OF HIP FLEXION/EXTENSION- PAINLESS AND FREE, NO DEFORMITY, ADP WELL FELT, ABLE TO STAND ON HEELS AND TOES, NO NVD",
    isBuiltIn: true,
  },
  {
    id: "macro-shoulder",
    code: "SHOULDER",
    category: "examination",
    description:
      "SHOULDER: ROM - PAINLESS, ELEVATION 160°, INTERNAL ROTATION- RESTRICTED TERMINALLY, NO INSTABILITY, SUBACROMIAL TENDERNESS (+), IMPINGEMENT SIGN NEGATIVE, DELTOID POWER 5/5, DISTAL NV INTACT",
    isBuiltIn: true,
  },
  {
    id: "macro-cervical",
    code: "CERVICAL",
    category: "examination",
    description:
      "NECK: LORDOSIS MAINTAINED, NO TENDERNESS, SHOULDER MOV: ALSO FREE AND PAINLESS, HAND GRIP: OK NO NVD DISTALLY, PARASPINAL SPASM MILD, SPURLING NEGATIVE",
    isBuiltIn: true,
  },
  {
    id: "macro-carpal-tunnel",
    code: "CARPAL TUNNEL",
    category: "examination",
    description:
      "CS SPINE: LORDOSIS MAINTAINED, NO SWELLING, NO TENDERNESS, OTHER ROAM PAINLESS AND FREE, HAND GRIP: SYMMETRICAL, MOTOR: OK - BOTH SIDES, SENSATION: LOSS OVER LATERAL 3 AND 1/2 FINGERS, TINEL'S SIGN-POSITIVE, PHALEN'S TEST-POSITIVE, OTHER ROAM: PAINLESS",
    isBuiltIn: true,
  },
  {
    id: "macro-ankle-sprain",
    code: "ANKLE SPRAIN",
    category: "examination",
    description:
      "ANKLE: ACTIVE/SLR: PAINLESS, LATERAL ANKLE TENDERNESS (+) OVER ATFL, MILD EDEMA/SWELLING, PAIN DURING MOVEMENT, ANTERIOR DRAWER NEGATIVE, EHL/FDL POWER: 5/5, DISTAL PULSES PALPABLE, NO NVD",
    isBuiltIn: true,
  },

  // --- COMPLAINTS & HISTORY MACROS (seen in Apollo SOM EMR video at 00:43) ---
  {
    id: "macro-lower-back-pain",
    code: "LOWER BACK PAIN 2026",
    category: "complaints",
    description:
      "LOWER BACK PAIN WITHOUT RADICULOPATHY TO TBL(L/R) NO NUMBNESS, NO WEAKNESS, NO CLAUDICATION, GETTING UP AFTER SITTING IS DIFFICULT, WHILE TURNING IN BED, MORNING STIFFNESS, ABLE TO WALK FOR... - MRS/BOWEL BLADDER INVOLVEMENT",
    isBuiltIn: true,
  },
  {
    id: "macro-ankle-twist-complaint",
    code: "ANKLE TWIST INJURY",
    category: "complaints",
    description:
      "Left ankle pain for 4 days; Swelling after twisting injury; Difficulty walking. No open wounds, no history of fever or prior fractures.",
    isBuiltIn: true,
  },
  {
    id: "macro-sciatica-complaint",
    code: "SCIATICA RADICULOPATHY",
    category: "complaints",
    description:
      "Lower back pain with radiating shooting pain down posterior thigh and calf for 2 weeks, aggravated by coughing, forward bending, and prolonged sitting.",
    isBuiltIn: true,
  },
  {
    id: "macro-knee-oa-complaint",
    code: "KNEE OA COMPLAINT",
    category: "complaints",
    description:
      "Bilateral knee joint pain, aggravated by prolonged standing, squatting, and stairs. Morning joint stiffness lasting < 30 minutes, audible crepitus on movement.",
    isBuiltIn: true,
  },

  // --- ADVICE MACROS (seen in Apollo SOM EMR video at 01:35, 01:38) ---
  {
    id: "macro-teriparat",
    code: "TERIPARAT",
    category: "advice",
    description:
      "INJ FORTEO / TERIFRAC: MR VISHAL RUNWAL (BENIZIA SUN PHARMA) - 9049855777. REFRIGERATED STORAGE REQUIRED (2-8°C).",
    isBuiltIn: true,
  },
  {
    id: "macro-forsteo-inj",
    code: "FORSTEO INJ",
    category: "advice",
    description:
      "ONCE A WEEK IN THE MORNING IN AN EMPTY STOMACH WITH FULL GLASS OF WATER - NOT TO LIE DOWN OR BEND FORWARD FOR 30 MIN",
    isBuiltIn: true,
  },
  {
    id: "macro-diet-exerc",
    code: "DIET/EXERC",
    category: "advice",
    description:
      "DIET: HIGH PROTEIN, MILK & CURD, HYDRATION (3L/DAY), AVOID SMOKING/ALCOHOL. EXERCISES: ISOMETRIC QUADRICEPS, CORE STRENGTHENING, HAMSTRING STRETCH, POSTURE AWARENESS",
    isBuiltIn: true,
  },
  {
    id: "macro-osteoporos",
    code: "OSTEOPOROS",
    category: "advice",
    description:
      "CALCIUM 500MG DAILY AFTER LUNCH + VITAMIN D3 60K WEEKLY FOR 8 WEEKS, REGULAR WEIGHT BEARING WALKING 30 MINS DAILY, SUNLIGHT EXPOSURE IN MORNING, PREVENT FALLS AT HOME",
    isBuiltIn: true,
  },
  {
    id: "macro-surgical-instructions",
    code: "SURGICAL INSTRUCTIONS",
    category: "advice",
    description:
      "POST-OP WOUND CARE: KEEP DRESSING CLEAN & DRY, ELEVATE LIMB, COLD PACK 15 MINS 3 TIMES A DAY, REPORT IMMEDIATELY IF EXCESSIVE SWELLING, PERSISTENT FEVER, OR NUMBNESS",
    isBuiltIn: true,
  },
  {
    id: "macro-telemedicine-clinic",
    code: "TELEMEDICINE / CLINIC",
    category: "advice",
    description:
      "ORTHOS CLINIC - BESIDES MKCL OFFICE, SHOP NO 3-6, OM NEELKANTH, KRSNAA DIAGNOSTICS LTD, HEALTH EXPRESS, PLOT NO. 31, SEAWOODS WEST, SECTOR 42A, SEAWOODS, NAVI MUMBAI, MAHARASHTRA 400706",
    isBuiltIn: true,
  },
  {
    id: "macro-rice-protocol",
    code: "RICE PROTOCOL",
    category: "advice",
    description:
      "REST THE AFFECTED JOINT, ICE APPLICATION 15-20 MINS 3-4 TIMES DAILY, COMPRESSION WITH CREPE BANDAGE, ELEVATION ON PILLOWS ABOVE HEART LEVEL",
    isBuiltIn: true,
  },
  {
    id: "macro-knee-oa-advice",
    code: "KNEE OA ADVICE",
    category: "advice",
    description:
      "AVOID SQUATTING, SITTING CROSS-LEGGED, AND FREQUENT STAIR CLIMBING. USE WESTERN COMMODE. WEAR CUSHIONED FOOTWEAR. QUADRICEPS ISOMETRIC EXERCISES 2 TIMES DAILY.",
    isBuiltIn: true,
  },
  {
    id: "macro-spine-care",
    code: "SPINE CARE",
    category: "advice",
    description:
      "AVOID FORWARD BENDING AND LIFTING HEAVY WEIGHTS. USE LUMBAR SACRAL BELT WHILE TRAVELLING. SLEEP ON A FIRM MATTRESS WITH KNEE SUPPORT PILLOW. REGULAR BACK EXTENSION EXERCISES.",
    isBuiltIn: true,
  },
  {
    id: "macro-gout-diet",
    code: "GOUT DIET CHART",
    category: "advice",
    description:
      "STRICTLY AVOID HIGH PURINE FOODS: RED MEAT, ORGAN MEATS, SEAFOOD, BEER & ALCOHOL, SWEETENED DRINKS. DRINK AT LEAST 3-4 LITERS OF WATER DAILY. REGULAR 30 MIN WALKING ONCE ACUTE FLARE SUBSIDES.",
    isBuiltIn: true,
  },

  // --- TREATMENT PLAN MACROS ---
  {
    id: "macro-plan-ankle-sprain",
    code: "ANKLE SPRAIN PLAN",
    category: "plan",
    description:
      "• Rest and protection\n• Ice application (15 mins 3-4 times daily)\n• Compression with elastic bandage and limb elevation\n• Supportive ankle brace if indicated by pain on weight-bearing",
    isBuiltIn: true,
  },
  {
    id: "macro-plan-sciatica",
    code: "SCIATICA CONSERVATIVE",
    category: "plan",
    description:
      "• Conservative management with short-term NSAID & neuropathic agent\n• Lumbar spinal support belt while standing/travelling\n• Physical therapy & core stabilization once acute spasm subsides\n• MRI screening if radicular pain persists after 2 weeks",
    isBuiltIn: true,
  },
  {
    id: "macro-plan-knee-oa",
    code: "KNEE OA MANAGEMENT",
    category: "plan",
    description:
      "• Medical symptom control: NSAID + Gastroprotection for 5-7 days\n• Lifestyle modification: avoid deep squatting and stairs\n• Isometric quadriceps strengthening daily\n• Consider intra-articular Viscosupplementation / PRP if conservative management yields incomplete relief",
    isBuiltIn: true,
  },
];

const CUSTOM_MACROS_STORAGE_KEY = "dr_orthos_custom_clinical_macros_v1";

export function loadAllClinicalMacros(): ClinicalMacro[] {
  if (typeof window === "undefined") {
    return BUILTIN_CLINICAL_MACROS;
  }
  try {
    const raw = localStorage.getItem(CUSTOM_MACROS_STORAGE_KEY);
    if (!raw) return BUILTIN_CLINICAL_MACROS;
    const custom: ClinicalMacro[] = JSON.parse(raw);
    return [...BUILTIN_CLINICAL_MACROS, ...custom];
  } catch {
    return BUILTIN_CLINICAL_MACROS;
  }
}

export function saveCustomClinicalMacro(macro: Omit<ClinicalMacro, "id" | "isBuiltIn">): ClinicalMacro {
  const newMacro: ClinicalMacro = {
    id: "custom-macro-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
    code: macro.code.trim().toUpperCase(),
    category: macro.category,
    description: macro.description.trim(),
    isBuiltIn: false,
  };

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(CUSTOM_MACROS_STORAGE_KEY);
      const existing: ClinicalMacro[] = raw ? JSON.parse(raw) : [];
      const updated = [newMacro, ...existing];
      localStorage.setItem(CUSTOM_MACROS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save custom macro:", e);
    }
  }

  return newMacro;
}

export function deleteCustomClinicalMacro(macroId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(CUSTOM_MACROS_STORAGE_KEY);
    if (!raw) return;
    const existing: ClinicalMacro[] = JSON.parse(raw);
    const updated = existing.filter((m) => m.id !== macroId);
    localStorage.setItem(CUSTOM_MACROS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to delete custom macro:", e);
  }
}

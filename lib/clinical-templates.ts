import type { Medicine } from "@/lib/types";

export type ClinicalIllnessCategory =
  | "Respiratory & ENT"
  | "Orthopedics & Pain"
  | "Gastrointestinal"
  | "General Medicine"
  | "Infections"
  | "Chronic Care";

export type ClinicalTemplate = {
  id: string;
  name: string;
  category: ClinicalIllnessCategory;
  illness: string;
  description: string;
  medicines: Medicine[];
  advice?: string;
  followUp?: string;
  isBuiltIn: true;
};

export const COMMON_ILLNESS_TEMPLATES: readonly ClinicalTemplate[] = [
  {
    id: "builtin-cold-flu",
    name: "Common Cold & Flu (Viral URTI)",
    category: "Respiratory & ENT",
    illness: "Acute viral upper respiratory tract infection with fever, rhinorrhea, and malaise",
    description: "Standard symptomatic regimen: Antipyretic + Antihistamine + Antibiotic coverage + Zinc/Vitamin C",
    medicines: [
      {
        name: "Paracetamol 650 mg",
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Three times daily",
        duration: "3 days",
        instructions: "After meals (SOS for fever and body ache)",
      },
      {
        name: "Levocetirizine 5 mg + Montelukast 10 mg",
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Once daily",
        duration: "5 days",
        instructions: "At bedtime for runny nose and sneezing",
      },
      {
        name: "Azithromycin 500 mg",
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Once daily",
        duration: "3 days",
        instructions: "1 hour before food or 2 hours after meals",
      },
      {
        name: "Vitamin C 500 mg + Zinc Chewable",
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Once daily",
        duration: "5 days",
        instructions: "Chew after breakfast for immune support",
      },
    ],
    advice:
      "• Steam inhalation 2-3 times daily.\n• Warm saline water gargles twice daily.\n• Drink plenty of warm fluids (soups, herbal tea, warm water).\n• Adequate physical rest.",
    followUp: "Review after 3-5 days if fever, persistent cough, or breathing difficulty develops.",
    isBuiltIn: true,
  },
  {
    id: "builtin-knee-oa",
    name: "Knee Osteoarthritis / Joint Flare",
    category: "Orthopedics & Pain",
    illness: "Acute symptomatic flare of knee osteoarthritis with joint stiffness and pain",
    description: "NSAID + Gastroprotection + Muscle relaxant + Topical analgesic + Calcium & Vitamin D3",
    medicines: [
      {
        name: "Aceclofenac 100 mg + Paracetamol 325 mg",
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Twice daily",
        duration: "5 days",
        instructions: "Always after food",
      },
      {
        name: "Pantoprazole 40 mg",
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Once daily",
        duration: "5 days",
        instructions: "30 minutes before breakfast on empty stomach",
      },
      {
        name: "Thiocolchicoside 4 mg",
        dosage: "1 capsule",
        route: "Oral",
        frequency: "Twice daily",
        duration: "5 days",
        instructions: "After food (for muscle spasm relief)",
      },
      {
        name: "Diclofenac Diethylamine Gel",
        dosage: "Gentle application",
        route: "Topical",
        frequency: "Three times daily",
        duration: "7 days",
        instructions: "Apply gently over knee joint; do not rub vigorously",
      },
      {
        name: "Calcium 500 mg + Vitamin D3",
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Once daily",
        duration: "30 days",
        instructions: "After dinner",
      },
    ],
    advice:
      "• Avoid squatting, sitting cross-legged, and frequent stair climbing.\n• Apply cold/ice pack for 15 minutes twice daily during acute flare.\n• Start isometric quadriceps strengthening exercises once pain subsides.\n• Wear comfortable, cushioned footwear.",
    followUp: "Review after 7 days for clinical assessment and physiotherapy planning.",
    isBuiltIn: true,
  },
  {
    id: "builtin-low-back-pain",
    name: "Acute Low Back Pain & Muscle Spasm (Sciatica)",
    category: "Orthopedics & Pain",
    illness: "Mechanical low back pain with paravertebral muscle spasm and radicular discomfort",
    description: "Selective COX-2 NSAID + Centrally acting muscle relaxant + Neuropathic agent + PPI",
    medicines: [
      {
        name: "Etoricoxib 90 mg",
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Once daily",
        duration: "5 days",
        instructions: "After lunch",
      },
      {
        name: "Tolperisone 150 mg",
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Twice daily",
        duration: "5 days",
        instructions: "After meals (muscle relaxant)",
      },
      {
        name: "Pregabalin 75 mg",
        dosage: "1 capsule",
        route: "Oral",
        frequency: "Once daily",
        duration: "10 days",
        instructions: "At bedtime (for radiating nerve pain)",
      },
      {
        name: "Pantoprazole 40 mg",
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Once daily",
        duration: "5 days",
        instructions: "Empty stomach in the morning",
      },
    ],
    advice:
      "• Sleep on a firm mattress with a pillow under your knees.\n• Strictly avoid lifting heavy weights and forward bending from the waist.\n• Use a lumbar support cushion while sitting.\n• Gentle core stability exercises once acute pain recedes.",
    followUp: "Review after 7 days, or immediately if leg weakness or bladder symptoms occur.",
    isBuiltIn: true,
  },
  {
    id: "builtin-gerd-acidity",
    name: "Acid Peptic Disease / GERD / Gastritis",
    category: "Gastrointestinal",
    illness: "Gastroesophageal reflux disease, heartburn, and epigastric burning",
    description: "Proton pump inhibitor + Prokinetic + Mucosal barrier suspension",
    medicines: [
      {
        name: "Pantoprazole 40 mg + Domperidone 30 mg SR",
        dosage: "1 capsule",
        route: "Oral",
        frequency: "Once daily",
        duration: "14 days",
        instructions: "30 minutes before breakfast on empty stomach",
      },
      {
        name: "Sucralfate + Oxetacaine Suspension",
        dosage: "10 ml",
        route: "Oral",
        frequency: "Three times daily",
        duration: "7 days",
        instructions: "1 hour before principal meals and at bedtime",
      },
    ],
    advice:
      "• Avoid spicy, fried, sour, and excessively greasy food.\n• Avoid tea, coffee, carbonated drinks, and smoking.\n• Take smaller, more frequent meals; do not skip breakfast.\n• Do not lie down within 2 hours of eating dinner.\n• Elevate the head end of your bed by 6 inches.",
    followUp: "Review after 2 weeks if symptoms persist.",
    isBuiltIn: true,
  },
  {
    id: "builtin-gastroenteritis",
    name: "Acute Gastroenteritis / Diarrhea & Vomiting",
    category: "Gastrointestinal",
    illness: "Acute infectious enteritis with loose watery stools, cramping, and mild dehydration",
    description: "Antimicrobial coverage + Oral rehydration + Antiemetic + Spore probiotic",
    medicines: [
      {
        name: "Ofloxacin 200 mg + Ornidazole 500 mg",
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Twice daily",
        duration: "3 days",
        instructions: "After meals",
      },
      {
        name: "ORS Sachets",
        dosage: "1 sachet in 1 liter clean water",
        route: "Oral",
        frequency: "As needed",
        duration: "3 days",
        instructions: "Sip continuously after every loose stool",
      },
      {
        name: "Ondansetron 4 mg",
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Twice daily as needed",
        duration: "2 days",
        instructions: "30 minutes before food if nausea occurs",
      },
      {
        name: "Probiotic Spores Capsule",
        dosage: "1 capsule",
        route: "Oral",
        frequency: "Twice daily",
        duration: "5 days",
        instructions: "After meals to restore gut flora",
      },
    ],
    advice:
      "• Drink only boiled or filtered water.\n• Consume bland diet: curd rice, bananas, soft khichdi, coconut water.\n• Strictly avoid milk, dairy products (except fresh yogurt), spicy, and street food.",
    followUp: "Review after 2 days or immediately if signs of dehydration, high fever, or blood in stool occur.",
    isBuiltIn: true,
  },
  {
    id: "builtin-allergic-rhinitis",
    name: "Allergic Rhinitis & Sinusitis",
    category: "Respiratory & ENT",
    illness: "Seasonal/perennial allergic rhinitis, sneezing, nasal congestion, and sinus headache",
    description: "Non-sedating antihistamine + Topical corticosteroid nasal spray + Mild analgesic",
    medicines: [
      {
        name: "Fexofenadine 120 mg",
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Once daily",
        duration: "7 days",
        instructions: "After dinner",
      },
      {
        name: "Fluticasone Furoate Nasal Spray",
        dosage: "1 spray each nostril",
        route: "Nasal",
        frequency: "Once daily",
        duration: "14 days",
        instructions: "In the morning; blow nose gently before application",
      },
      {
        name: "Paracetamol 650 mg",
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Twice daily as needed",
        duration: "3 days",
        instructions: "For sinus headache or facial heaviness",
      },
    ],
    advice:
      "• Steam inhalation twice daily.\n• Avoid known allergens: dust, pollen, pet dander, and abrupt air-conditioner exposure.\n• Use a protective face mask during dusty work.",
    followUp: "Review after 7 to 10 days.",
    isBuiltIn: true,
  },
  {
    id: "builtin-sprain-strain",
    name: "Soft Tissue Sprain / Ankle Strain (R.I.C.E.)",
    category: "Orthopedics & Pain",
    illness: "Acute ligament sprain or muscle strain with localized edema and tenderness",
    description: "NSAID + Anti-edema proteolytic enzyme + Gastroprotection + Topical spray",
    medicines: [
      {
        name: "Aceclofenac 100 mg + Paracetamol 325 mg + Serratiopeptidase 15 mg",
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Twice daily",
        duration: "5 days",
        instructions: "After meals",
      },
      {
        name: "Pantoprazole 40 mg",
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Once daily",
        duration: "5 days",
        instructions: "30 minutes before breakfast",
      },
      {
        name: "Chymoral Forte",
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Three times daily",
        duration: "5 days",
        instructions: "30 minutes before meals for swelling reduction",
      },
      {
        name: "Diclofenac Spray",
        dosage: "Local spray",
        route: "Topical",
        frequency: "Three times daily",
        duration: "5 days",
        instructions: "Spray over affected joint from 5 cm distance; do not rub",
      },
    ],
    advice:
      "• R.I.C.E. protocol:\n  - Rest: Minimize weight bearing\n  - Ice: Cold pack for 15-20 mins 3 times a day\n  - Compression: Crepe bandage wrap (firm, not overly tight)\n  - Elevation: Keep limb elevated above hip level while resting.",
    followUp: "Review after 5 days with an X-ray if weight-bearing pain persists.",
    isBuiltIn: true,
  },
  {
    id: "builtin-uti",
    name: "Uncomplicated Urinary Tract Infection (UTI)",
    category: "Infections",
    illness: "Acute dysuria, urinary frequency, burning micturition, and suprapubic discomfort",
    description: "Urinary antiseptic/antibiotic + Urine alkalinizer + Antipyretic",
    medicines: [
      {
        name: "Nitrofurantoin 100 mg SR",
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Twice daily",
        duration: "5 days",
        instructions: "Take with meals or a glass of milk",
      },
      {
        name: "Disodium Hydrogen Citrate Syrup",
        dosage: "2 teaspoons (10 ml) in 1 glass water",
        route: "Oral",
        frequency: "Three times daily",
        duration: "5 days",
        instructions: "Dilute in a full glass of water, drink after meals",
      },
      {
        name: "Paracetamol 650 mg",
        dosage: "1 tablet",
        route: "Oral",
        frequency: "As needed",
        duration: "3 days",
        instructions: "For lower abdominal discomfort or low-grade fever",
      },
    ],
    advice:
      "• Drink at least 3 liters of water per day.\n• Do not hold urine; empty bladder completely.\n• Complete the full 5-day antibiotic course even if burning subsides.",
    followUp: "Review after 5 days with repeat Urine Routine test if symptoms persist.",
    isBuiltIn: true,
  },
  {
    id: "builtin-hypertension",
    name: "Hypertension Routine Maintenance",
    category: "Chronic Care",
    illness: "Essential hypertension maintenance therapy",
    description: "ARB + Calcium Channel Blocker combination with cardiovascular protection",
    medicines: [
      {
        name: "Telmisartan 40 mg + Amlodipine 5 mg",
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Once daily",
        duration: "30 days",
        instructions: "Every morning after breakfast at the same time",
      },
    ],
    advice:
      "• Restrict dietary salt to less than 5 g/day (avoid pickles, papad, processed foods).\n• 30 minutes of brisk walking or moderate exercise daily.\n• Monitor and log blood pressure once a week.",
    followUp: "Monthly blood pressure review with blood pressure log.",
    isBuiltIn: true,
  },
  {
    id: "builtin-type2-diabetes",
    name: "Type 2 Diabetes Mellitus Protocol",
    category: "Chronic Care",
    illness: "Uncomplicated Type 2 Diabetes Mellitus glycemic control",
    description: "First-line biguanide insulin sensitizer regimen",
    medicines: [
      {
        name: "Metformin 500 mg SR",
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Twice daily",
        duration: "30 days",
        instructions: "Take with or immediately after principal meals",
      },
    ],
    advice:
      "• Low glycemic index diet: avoid sweets, table sugar, potatoes, and refined flour.\n• 30-45 minutes of daily physical activity.\n• Maintain a bi-weekly fasting & post-meal blood sugar log.\n• Proper daily foot care and inspection.",
    followUp: "Review in 1 month with Fasting Blood Sugar, PPBS, and HbA1c reports.",
    isBuiltIn: true,
  },
] as const;

export function findCommonTemplateById(id: string): ClinicalTemplate | undefined {
  return COMMON_ILLNESS_TEMPLATES.find((tpl) => tpl.id === id);
}

export function searchCommonTemplates(query: string): ClinicalTemplate[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...COMMON_ILLNESS_TEMPLATES];

  return COMMON_ILLNESS_TEMPLATES.filter((tpl) => {
    return (
      tpl.name.toLowerCase().includes(q) ||
      tpl.illness.toLowerCase().includes(q) ||
      tpl.category.toLowerCase().includes(q) ||
      tpl.medicines.some((m) => m.name.toLowerCase().includes(q))
    );
  });
}

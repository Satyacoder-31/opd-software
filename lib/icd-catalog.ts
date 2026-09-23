export type IcdCode = {
  code: string;
  display: string;
};

/** Common Orthopedic & General OPD ICD-10 codes for Dr Orthos clinic search. */
export const ICD10_COMMON: IcdCode[] = [
  // Orthopedics: Knee & Hip
  { code: "M17.11", display: "Primary osteoarthritis of right knee" },
  { code: "M17.12", display: "Primary osteoarthritis of left knee" },
  { code: "M17.0", display: "Bilateral primary osteoarthritis of knee" },
  { code: "M17.9", display: "Osteoarthritis of knee, unspecified" },
  { code: "M16.1", display: "Primary osteoarthritis of hip" },
  { code: "M16.9", display: "Osteoarthritis of hip, unspecified" },
  { code: "S83.51", display: "Sprain / tear of anterior cruciate ligament (ACL) of knee" },
  { code: "S83.52", display: "Sprain / tear of posterior cruciate ligament (PCL) of knee" },
  { code: "S83.2", display: "Tear of meniscus, acute injury of knee" },
  { code: "M23.2", display: "Derangement of meniscus due to old tear, knee" },
  { code: "M22.2", display: "Patellofemoral disorders / Chondromalacia patellae" },
  { code: "M25.56", display: "Pain in knee joint" },

  // Orthopedics: Spine & Back
  { code: "M54.5", display: "Low back pain (Lumbago)" },
  { code: "M54.4", display: "Lumbago with sciatica" },
  { code: "M51.26", display: "Other intervertebral disc displacement, lumbar region" },
  { code: "M48.06", display: "Spinal stenosis, lumbar region" },
  { code: "M54.2", display: "Cervicalgia (Neck pain)" },
  { code: "M50.20", display: "Cervical disc displacement with radiculopathy" },
  { code: "M47.816", display: "Spondylosis without myelopathy or radiculopathy, lumbar" },

  // Orthopedics: Shoulder & Upper Extremity
  { code: "M75.1", display: "Rotator cuff tear or capsule rupture" },
  { code: "M75.0", display: "Adhesive capsulitis of shoulder (Frozen shoulder)" },
  { code: "M75.4", display: "Impingement syndrome of shoulder" },
  { code: "M75.5", display: "Bursitis of shoulder" },
  { code: "M77.1", display: "Lateral epicondylitis (Tennis elbow)" },
  { code: "M77.0", display: "Medial epicondylitis (Golfer's elbow)" },
  { code: "G56.0", display: "Carpal tunnel syndrome" },
  { code: "M65.4", display: "Radial styloid tenosynovitis (De Quervain's disease)" },
  { code: "M70.6", display: "Trochanteric bursitis" },

  // Orthopedics: Foot, Ankle & Bone Health
  { code: "S93.4", display: "Sprain of ankle ligament" },
  { code: "M72.2", display: "Plantar fascial fibromatosis (Plantar fasciitis)" },
  { code: "M76.6", display: "Achilles tendinitis" },
  { code: "M81.0", display: "Age-related osteoporosis without current fracture" },
  { code: "M10.9", display: "Gouty arthritis, unspecified" },
  { code: "M25.50", display: "Pain in unspecified joint" },

  // Orthopedics: Fractures & Trauma
  { code: "S52.50", display: "Fracture of lower end of radius (Colles / Distal radius)" },
  { code: "S82.8", display: "Fracture of other parts of lower leg (Bimalleolar / Ankle)" },
  { code: "S42.0", display: "Fracture of clavicle" },
  { code: "S72.0", display: "Fracture of neck of femur (Hip fracture)" },
  { code: "T14.9", display: "Musculoskeletal injury, unspecified" },

  // General & Medical OPD
  { code: "I10", display: "Essential (primary) hypertension" },
  { code: "E11.9", display: "Type 2 diabetes mellitus without complications" },
  { code: "E78.5", display: "Hyperlipidemia, unspecified" },
  { code: "E03.9", display: "Hypothyroidism, unspecified" },
  { code: "E55.9", display: "Vitamin D deficiency, unspecified" },
  { code: "E53.8", display: "Deficiency of other specified B group vitamins (Vitamin B12)" },
  { code: "K21.0", display: "Gastro-esophageal reflux disease" },
  { code: "K29.7", display: "Gastritis, unspecified" },
  { code: "R50.9", display: "Fever, unspecified" },
  { code: "Z00.0", display: "General adult medical examination" },
];

export type DiagnosisCodeEntry = {
  code: string;
  display: string;
  type: "primary" | "secondary";
};

export function searchIcdCodes(query: string, limit = 12): IcdCode[] {
  const q = query.trim().toLowerCase();
  if (!q) return ICD10_COMMON.slice(0, limit);

  const scored = ICD10_COMMON.map((item) => {
    const code = item.code.toLowerCase();
    const display = item.display.toLowerCase();
    let score = 0;
    if (code === q) score = 100;
    else if (code.startsWith(q)) score = 80;
    else if (display.startsWith(q)) score = 70;
    else if (code.includes(q)) score = 50;
    else if (display.includes(q)) score = 40;
    return { item, score };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((row) => row.item);
}

export const searchIcd10 = searchIcdCodes;

export function formatDiagnosisCodesSummary(
  codes: DiagnosisCodeEntry[] | undefined | null
): string {
  if (!codes?.length) return "";
  return codes
    .map((c) => `${c.code} — ${c.display}`)
    .join("; ");
}

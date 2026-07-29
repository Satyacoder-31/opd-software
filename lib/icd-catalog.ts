export type IcdCode = {
  code: string;
  display: string;
};

/** Common OPD ICD-10 codes for India clinic search. */
export const ICD10_COMMON: IcdCode[] = [
  { code: "J06.9", display: "Acute upper respiratory infection, unspecified" },
  { code: "J02.9", display: "Acute pharyngitis, unspecified" },
  { code: "J00", display: "Acute nasopharyngitis (common cold)" },
  { code: "J18.9", display: "Pneumonia, unspecified" },
  { code: "J45.9", display: "Asthma, unspecified" },
  { code: "I10", display: "Essential (primary) hypertension" },
  { code: "E11.9", display: "Type 2 diabetes mellitus without complications" },
  { code: "E78.5", display: "Hyperlipidemia, unspecified" },
  { code: "E03.9", display: "Hypothyroidism, unspecified" },
  { code: "K21.0", display: "Gastro-esophageal reflux disease with esophagitis" },
  { code: "K29.7", display: "Gastritis, unspecified" },
  { code: "K59.0", display: "Constipation" },
  { code: "A09", display: "Infectious gastroenteritis and colitis, unspecified" },
  { code: "N39.0", display: "Urinary tract infection, site not specified" },
  { code: "N30.0", display: "Acute cystitis" },
  { code: "M54.5", display: "Low back pain" },
  { code: "M25.5", display: "Pain in joint" },
  { code: "M79.3", display: "Panniculitis, unspecified" },
  { code: "G43.9", display: "Migraine, unspecified" },
  { code: "G44.1", display: "Vascular headache, not elsewhere classified" },
  { code: "R51", display: "Headache" },
  { code: "R50.9", display: "Fever, unspecified" },
  { code: "R05", display: "Cough" },
  { code: "R10.4", display: "Other and unspecified abdominal pain" },
  { code: "L30.9", display: "Dermatitis, unspecified" },
  { code: "L20.9", display: "Atopic dermatitis, unspecified" },
  { code: "B35.1", display: "Tinea unguium" },
  { code: "H66.9", display: "Otitis media, unspecified" },
  { code: "H10.9", display: "Conjunctivitis, unspecified" },
  { code: "Z00.0", display: "General adult medical examination" },
  { code: "Z71.1", display: "Person with feared health complaint in whom no diagnosis is made" },
  { code: "F41.9", display: "Anxiety disorder, unspecified" },
  { code: "F32.9", display: "Major depressive disorder, single episode, unspecified" },
  { code: "J30.9", display: "Allergic rhinitis, unspecified" },
  { code: "B34.9", display: "Viral infection, unspecified" },
  { code: "S93.4", display: "Sprain of ankle" },
  { code: "T14.9", display: "Injury, unspecified" },
  { code: "O80", display: "Encounter for full-term uncomplicated delivery" },
  { code: "Z23", display: "Encounter for immunization" },
  { code: "E66.9", display: "Obesity, unspecified" },
  { code: "D50.9", display: "Iron deficiency anemia, unspecified" },
  { code: "N76.0", display: "Acute vaginitis" },
  { code: "B37.3", display: "Candidiasis of vulva and vagina" },
  { code: "J20.9", display: "Acute bronchitis, unspecified" },
  { code: "K35.8", display: "Other acute appendicitis" },
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

export function formatDiagnosisCodesSummary(
  codes: DiagnosisCodeEntry[] | undefined | null
): string {
  if (!codes?.length) return "";
  return codes
    .map((c) => `${c.code} — ${c.display}`)
    .join("; ");
}

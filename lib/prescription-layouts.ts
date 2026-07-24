/**
 * Visual layout registry for printed prescriptions.
 *
 * Pure data — safe to import from both server (PDF renderer) and client
 * (settings preview UI). Each layout is a deliberate combination of
 * typography, header treatment, patient-info presentation, and medicine
 * formatting, so every template prints with a distinct personality while
 * sharing one renderer.
 */

export type PrescriptionLayoutId =
  | "classic"
  | "modern"
  | "minimal"
  | "azure"
  | "heritage"
  | "sideband"
  | "slate"
  | "terra"
  | "executive"
  | "verdant"
  | "ruled"
  | "orchid";

export type LayoutHeaderStyle =
  | "centered"
  | "split"
  | "banner"
  | "sideband"
  | "minimal"
  | "double-rule";

export type LayoutPatientInfoStyle = "strip" | "grid" | "boxed";

export type LayoutMedicinesStyle = "table" | "list" | "cards";

export type LayoutFont = "Helvetica" | "Times-Roman";

export type PrescriptionLayoutColors = {
  /** Primary brand color: clinic name, section titles, table rules. */
  accent: string;
  /** Main body text. */
  ink: string;
  /** Secondary text: labels, qualifications, footers. */
  muted: string;
  /** Divider and border lines. */
  rule: string;
  /** Light fill for strips, cards, and boxed sections. */
  soft: string;
  /** Text color on top of banner headers. */
  headerText?: string;
};

export type PrescriptionLayoutConfig = {
  id: PrescriptionLayoutId;
  name: string;
  description: string;
  font: LayoutFont;
  header: LayoutHeaderStyle;
  patientInfo: LayoutPatientInfoStyle;
  medicines: LayoutMedicinesStyle;
  colors: PrescriptionLayoutColors;
};

export const DEFAULT_PRESCRIPTION_LAYOUT: PrescriptionLayoutId = "classic";

export const PRESCRIPTION_LAYOUTS: PrescriptionLayoutConfig[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Traditional centered letterhead with serif type and a navy accent.",
    font: "Times-Roman",
    header: "centered",
    patientInfo: "grid",
    medicines: "list",
    colors: {
      accent: "#1C3D5A",
      ink: "#1F2933",
      muted: "#5C6B7A",
      rule: "#C9D4DE",
      soft: "#F1F5F9",
    },
  },
  {
    id: "modern",
    name: "Modern",
    description: "Split header with a bright blue accent and a structured medicine table.",
    font: "Helvetica",
    header: "split",
    patientInfo: "strip",
    medicines: "table",
    colors: {
      accent: "#2563EB",
      ink: "#111827",
      muted: "#6B7280",
      rule: "#D6DDE8",
      soft: "#EFF4FE",
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Near-monochrome, hairline rules, and generous whitespace.",
    font: "Helvetica",
    header: "minimal",
    patientInfo: "grid",
    medicines: "list",
    colors: {
      accent: "#111827",
      ink: "#111827",
      muted: "#737B87",
      rule: "#E2E5EA",
      soft: "#F5F6F8",
    },
  },
  {
    id: "azure",
    name: "Azure Banner",
    description: "Full-width sky-blue banner header with a clean tabular body.",
    font: "Helvetica",
    header: "banner",
    patientInfo: "strip",
    medicines: "table",
    colors: {
      accent: "#1A85C8",
      ink: "#1A2332",
      muted: "#5C6B7A",
      rule: "#CBDDEA",
      soft: "#EDF5FB",
      headerText: "#FFFFFF",
    },
  },
  {
    id: "heritage",
    name: "Heritage",
    description: "Double-ruled serif letterhead with a warm bronze accent.",
    font: "Times-Roman",
    header: "double-rule",
    patientInfo: "grid",
    medicines: "list",
    colors: {
      accent: "#8A6D3B",
      ink: "#2B2820",
      muted: "#6E6858",
      rule: "#D8CFBC",
      soft: "#F7F4EC",
    },
  },
  {
    id: "sideband",
    name: "Teal Sideband",
    description: "A slim teal band along the page edge with boxed patient details.",
    font: "Helvetica",
    header: "sideband",
    patientInfo: "boxed",
    medicines: "table",
    colors: {
      accent: "#0F766E",
      ink: "#132A28",
      muted: "#5A6B69",
      rule: "#CBDBD9",
      soft: "#EDF5F4",
    },
  },
  {
    id: "slate",
    name: "Slate Compact",
    description: "Quiet slate grey, tight spacing, and an efficient medicine table.",
    font: "Helvetica",
    header: "split",
    patientInfo: "strip",
    medicines: "table",
    colors: {
      accent: "#334155",
      ink: "#1E293B",
      muted: "#64748B",
      rule: "#D5DBE3",
      soft: "#F1F4F8",
    },
  },
  {
    id: "terra",
    name: "Terracotta",
    description: "Warm terracotta accent with medicines set in soft cards.",
    font: "Helvetica",
    header: "centered",
    patientInfo: "strip",
    medicines: "cards",
    colors: {
      accent: "#B4532A",
      ink: "#2C221C",
      muted: "#7A6A60",
      rule: "#E3D4CB",
      soft: "#F9F1EC",
    },
  },
  {
    id: "executive",
    name: "Executive",
    description: "Charcoal banner header and formal tabular presentation.",
    font: "Helvetica",
    header: "banner",
    patientInfo: "grid",
    medicines: "table",
    colors: {
      accent: "#1F2937",
      ink: "#1F2937",
      muted: "#6B7280",
      rule: "#D7DBE1",
      soft: "#F2F4F6",
      headerText: "#FFFFFF",
    },
  },
  {
    id: "verdant",
    name: "Verdant",
    description: "Fresh green accent with boxed details and medicine cards.",
    font: "Helvetica",
    header: "split",
    patientInfo: "boxed",
    medicines: "cards",
    colors: {
      accent: "#15803D",
      ink: "#14231A",
      muted: "#5D6E62",
      rule: "#CFE0D4",
      soft: "#EFF7F1",
    },
  },
  {
    id: "ruled",
    name: "Ruled",
    description: "Serif classic with boxed patient details and steady ruled sections.",
    font: "Times-Roman",
    header: "centered",
    patientInfo: "boxed",
    medicines: "list",
    colors: {
      accent: "#234E70",
      ink: "#22303C",
      muted: "#5E6E7C",
      rule: "#C7D3DD",
      soft: "#F0F4F8",
    },
  },
  {
    id: "orchid",
    name: "Orchid",
    description: "Contemporary violet accent with a split header and clean table.",
    font: "Helvetica",
    header: "split",
    patientInfo: "strip",
    medicines: "table",
    colors: {
      accent: "#6D28D9",
      ink: "#1E1B2E",
      muted: "#6E6786",
      rule: "#DDD6EC",
      soft: "#F4F0FB",
    },
  },
];

export function isPrescriptionLayoutId(
  value: string
): value is PrescriptionLayoutId {
  return PRESCRIPTION_LAYOUTS.some((layout) => layout.id === value);
}

/** Returns the layout config for an id, falling back to the default layout. */
export function resolvePrescriptionLayout(
  id?: string | null
): PrescriptionLayoutConfig {
  const found = id
    ? PRESCRIPTION_LAYOUTS.find((layout) => layout.id === id)
    : undefined;
  if (found) return found;
  const fallback = PRESCRIPTION_LAYOUTS.find(
    (layout) => layout.id === DEFAULT_PRESCRIPTION_LAYOUT
  );
  // The default id always exists in the registry.
  return fallback as PrescriptionLayoutConfig;
}

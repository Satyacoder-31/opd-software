import type { Medicine } from "@/lib/types";
import { FREQUENCY_SHORTCUTS } from "@/lib/prescription-dosing";

/** Common routes of administration offered in the prescription builder. */
export const MEDICINE_ROUTES = [
  "Oral",
  "Inhalation",
  "Topical",
  "Sublingual",
  "Nasal",
  "Rectal",
  "Ophthalmic",
  "Otic",
  "Transdermal",
  "Vaginal",
  "Intravenous",
  "Intramuscular",
  "Subcutaneous",
] as const;

/**
 * Frequency options for dictionary / Rx dropdowns.
 * Full phrases only — OD/BD/TDS live as dosing shortcut chips, not duplicated here.
 */
export const FREQUENCY_OPTIONS = [
  ...FREQUENCY_SHORTCUTS.map((item) => item.label),
  "Every 4 hours",
  "Every 6 hours",
  "Every 8 hours",
  "Every 12 hours",
  "Once weekly",
] as const;

export const INSTRUCTION_OPTIONS = [
  "Before meals",
  "After meals",
  "With meals",
  "On an empty stomach",
  "At bedtime",
] as const;

/** Duration units for the value + unit duration control. */
export const DURATION_UNITS = [
  { value: "days", label: "Days", needsAmount: true },
  { value: "weeks", label: "Weeks", needsAmount: true },
  { value: "months", label: "Months", needsAmount: true },
  { value: "until_review", label: "Until review", needsAmount: false },
  { value: "ongoing", label: "Ongoing / continuous", needsAmount: false },
] as const;

export type DurationUnitValue = (typeof DURATION_UNITS)[number]["value"];

export type DurationParts = {
  amount: string;
  unit: DurationUnitValue | "";
};

const UNIT_ALIASES: Record<string, DurationUnitValue> = {
  day: "days",
  days: "days",
  week: "weeks",
  weeks: "weeks",
  month: "months",
  months: "months",
};

const FIXED_DURATION_LABELS: Record<
  Extract<DurationUnitValue, "until_review" | "ongoing">,
  string
> = {
  until_review: "Until review",
  ongoing: "Ongoing / continuous",
};

export function durationUnitNeedsAmount(unit: DurationParts["unit"]): boolean {
  if (!unit) return true;
  const match = DURATION_UNITS.find((item) => item.value === unit);
  return match?.needsAmount ?? true;
}

export function parseDuration(duration: string): DurationParts {
  const trimmed = duration.trim();
  if (!trimmed) return { amount: "", unit: "" };

  const lower = trimmed.toLocaleLowerCase();

  if (
    lower === "until review" ||
    lower === "until reviewed" ||
    lower === "till review"
  ) {
    return { amount: "", unit: "until_review" };
  }

  if (
    lower === "ongoing" ||
    lower === "continuous" ||
    lower === "ongoing/continuous" ||
    lower === "ongoing / continuous"
  ) {
    return { amount: "", unit: "ongoing" };
  }

  const match = trimmed.match(
    /^(\d+(?:\.\d+)?)\s*(days?|weeks?|months?)$/i
  );
  if (match?.[1] && match[2]) {
    const unit = UNIT_ALIASES[match[2].toLocaleLowerCase()];
    if (unit) {
      return { amount: match[1], unit };
    }
  }

  // Free-form custom duration — keep as entered without forcing a unit.
  return { amount: trimmed, unit: "" };
}

export function formatDuration(parts: DurationParts): string {
  const amount = parts.amount.trim();
  const unit = parts.unit;

  if (unit === "until_review" || unit === "ongoing") {
    return FIXED_DURATION_LABELS[unit];
  }

  if (!unit) {
    return amount;
  }

  if (!amount) {
    return "";
  }

  const singular: Record<"days" | "weeks" | "months", string> = {
    days: "Day",
    weeks: "Week",
    months: "Month",
  };
  const plural: Record<"days" | "weeks" | "months", string> = {
    days: "Days",
    weeks: "Weeks",
    months: "Months",
  };

  const label = amount === "1" ? singular[unit] : plural[unit];
  return `${amount} ${label}`;
}

export function medicineTitle(med: Medicine, index: number): string {
  return med.name.trim() || `Medicine ${index + 1}`;
}

export function medicineSummary(med: Medicine): string | undefined {
  const parts = [
    med.dosage,
    med.route,
    med.frequency,
    med.duration,
  ].filter((part) => part?.trim());
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

export function medicineFilled(med: Medicine): boolean {
  return !!med.name?.trim();
}

export function textSectionSummary(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.length > 72 ? `${trimmed.slice(0, 72)}…` : trimmed;
}

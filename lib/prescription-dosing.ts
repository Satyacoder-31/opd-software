/**
 * Indian OPD dosing shortcuts — OD/BD/TDS vernacular mapped to full labels
 * stored on the prescription, plus duration chips and quantity estimation.
 */

export const FREQUENCY_SHORTCUTS = [
  { code: "OD", label: "Once daily", timesPerDay: 1 },
  { code: "BD", label: "Twice daily", timesPerDay: 2 },
  { code: "TDS", label: "Three times daily", timesPerDay: 3 },
  { code: "QID", label: "Four times daily", timesPerDay: 4 },
  { code: "HS", label: "At bedtime", timesPerDay: 1 },
  { code: "SOS", label: "As needed", timesPerDay: null },
  { code: "STAT", label: "Immediately", timesPerDay: null },
] as const;

export type FrequencyShortcutCode =
  (typeof FREQUENCY_SHORTCUTS)[number]["code"];

export const DOSAGE_SHORTCUTS = [
  "1 tablet",
  "½ tablet",
  "2 tablets",
  "5 ml",
  "10 ml",
  "1 sachet",
  "1 capsule",
] as const;

export const DURATION_SHORTCUTS = [
  { label: "3 days", value: "3 Days" },
  { label: "5 days", value: "5 Days" },
  { label: "7 days", value: "7 Days" },
  { label: "10 days", value: "10 Days" },
  { label: "14 days", value: "14 Days" },
] as const;

export const INSTRUCTION_SHORTCUTS = [
  "After meals",
  "Before meals",
  "With meals",
  "At bedtime",
] as const;

/** Resolve a typed/selected frequency string to its shortcut metadata. */
export function matchFrequencyShortcut(frequency: string) {
  const trimmed = frequency.trim();
  if (!trimmed) return null;

  const byCode = FREQUENCY_SHORTCUTS.find(
    (item) => item.code.toLocaleLowerCase() === trimmed.toLocaleLowerCase()
  );
  if (byCode) return byCode;

  return (
    FREQUENCY_SHORTCUTS.find(
      (item) => item.label.toLocaleLowerCase() === trimmed.toLocaleLowerCase()
    ) ?? null
  );
}

/** Expand OD/BD/TDS (and aliases) to the stored full label when recognized. */
export function expandFrequencyInput(frequency: string): string {
  const match = matchFrequencyShortcut(frequency);
  return match ? match.label : frequency;
}

/** Parse day count from common duration strings like "5 Days" or "1 Week". */
export function parseDurationDays(duration: string): number | null {
  const trimmed = duration.trim().toLocaleLowerCase();
  if (!trimmed) return null;

  const dayMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*days?$/);
  if (dayMatch?.[1]) return Number(dayMatch[1]);

  const weekMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*weeks?$/);
  if (weekMatch?.[1]) return Number(weekMatch[1]) * 7;

  const monthMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*months?$/);
  if (monthMatch?.[1]) return Number(monthMatch[1]) * 30;

  return null;
}

/**
 * Estimate dispense quantity from frequency × duration.
 * Returns null when SOS/STAT or duration cannot be counted.
 */
export function estimateQuantity(
  frequency: string,
  duration: string,
  dosesPerIntake = 1
): string | null {
  const shortcut = matchFrequencyShortcut(frequency);
  const timesPerDay = shortcut?.timesPerDay;
  if (timesPerDay == null || timesPerDay <= 0) return null;

  const days = parseDurationDays(duration);
  if (days == null || days <= 0) return null;

  const total = Math.ceil(timesPerDay * days * dosesPerIntake);
  return String(total);
}

/** Best-effort dose units per intake from dosage text (defaults to 1). */
export function parseDosesPerIntake(dosage: string): number {
  const trimmed = dosage.trim().toLocaleLowerCase();
  if (!trimmed) return 1;
  if (trimmed.startsWith("½") || trimmed.startsWith("1/2")) return 0.5;
  const match = trimmed.match(/^(\d+(?:\.\d+)?)/);
  if (!match?.[1]) return 1;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

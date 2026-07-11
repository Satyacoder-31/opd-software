import type { Medicine } from "@/lib/types";

export function medicineTitle(med: Medicine, index: number): string {
  return med.name.trim() || `Medicine ${index + 1}`;
}

export function medicineSummary(med: Medicine): string | undefined {
  const parts = [med.dosage, med.frequency, med.duration].filter((part) =>
    part?.trim()
  );
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

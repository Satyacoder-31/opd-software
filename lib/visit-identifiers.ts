/**
 * Visit identity helpers for clinical headers.
 * UHID maps to the patient MRN; Episode No is derived from the visit.
 */

export function formatUhid(mrn: string): string {
  return mrn.trim();
}

/**
 * Episode format: {clinicCode}/{YY}/{token}
 * Example: OPD/26/0003
 * Pass a clinic code when available for a hospital-style prefix (e.g. 4600).
 */
export function formatEpisodeNo(input: {
  queueDate: Date | string;
  tokenNumber: number;
  clinicCode?: string | null;
}): string {
  const date =
    typeof input.queueDate === "string"
      ? new Date(input.queueDate)
      : input.queueDate;
  const yy = String(date.getFullYear()).slice(-2);
  const token = String(input.tokenNumber).padStart(4, "0");
  const prefix = input.clinicCode?.trim() || "OPD";
  return `${prefix}/${yy}/${token}`;
}

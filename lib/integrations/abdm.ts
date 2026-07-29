import "server-only";

import { logger } from "@/lib/logger";

/**
 * ABDM / ABHA adapter (India).
 * Capture fields live on Patient; full Health Locker / care-context
 * linking is wired here behind sandbox env flags.
 */
export type AbhaIdentity = {
  abhaNumber?: string | null;
  abhaAddress?: string | null;
};

export function formatAbhaDisplay(identity: AbhaIdentity): string | null {
  if (identity.abhaNumber?.trim()) return identity.abhaNumber.trim();
  if (identity.abhaAddress?.trim()) return identity.abhaAddress.trim();
  return null;
}

/** Public QR payload for ABHA number/address display in clinic UI. */
export function abhaQrPayload(identity: AbhaIdentity): string | null {
  const value = formatAbhaDisplay(identity);
  if (!value) return null;
  return `ABHA:${value}`;
}

/**
 * Placeholder for ABDM sandbox care-context link.
 * Enable with ABDM_SANDBOX=1 + credentials when certification work begins.
 */
export async function linkCareContextSandbox(input: {
  clinicId: string;
  patientId: string;
  abhaAddress: string;
  consultationId: string;
}): Promise<{ ok: boolean; message: string }> {
  if (process.env.ABDM_SANDBOX !== "1") {
    return {
      ok: false,
      message: "ABDM sandbox linking is not enabled (set ABDM_SANDBOX=1).",
    };
  }

  logger.info("abdm_care_context_stub", input);
  return {
    ok: true,
    message: "Care context queued for ABDM sandbox (stub).",
  };
}

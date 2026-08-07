export const ONBOARDING_STEPS = [
  {
    id: "identity",
    label: "Identity",
    title: "Clinic identity",
    description: "Clinic type and logo for prescriptions and your workspace.",
  },
  {
    id: "billing",
    label: "Billing",
    title: "Billing & address",
    description: "Address and tax details used on invoices.",
  },
  {
    id: "public",
    label: "Profile",
    title: "Public profile",
    description: "Listing, hours, and phone verification for patient discovery.",
  },
  {
    id: "directory",
    label: "Directory",
    title: "Directory extras",
    description: "Languages and facilities shown on your clinic page.",
  },
  {
    id: "done",
    label: "Finish",
    title: "You're ready",
    description: "Review what you've set up, then go live.",
  },
] as const;

export const ONBOARDING_LAST_STEP = ONBOARDING_STEPS.length - 1;

export type OnboardingProgressClinic = {
  logoUrl: string | null;
  addressLine1: string | null;
  city: string | null;
  pincode: string | null;
  gstin: string | null;
  pan: string | null;
  businessEntity: string | null;
  feeItemCount: number;
  phoneVerifiedAt: Date | string | null;
  description: string | null;
  isPublicListed: boolean;
  website: string | null;
  languages: string[];
  facilities: string[];
};

export type OnboardingProgressInput = {
  clinic: OnboardingProgressClinic;
};

function storageKey(clinicId: string) {
  return `medyx:onboarding-step:${clinicId}`;
}

export function readStoredOnboardingStep(clinicId: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(storageKey(clinicId));
    const n = Number(raw);
    if (!Number.isFinite(n)) return 0;
    return Math.min(Math.max(0, Math.floor(n)), ONBOARDING_LAST_STEP);
  } catch {
    return 0;
  }
}

export function writeStoredOnboardingStep(clinicId: string, step: number) {
  if (typeof window === "undefined") return;
  try {
    const next = Math.min(Math.max(0, Math.floor(step)), ONBOARDING_LAST_STEP);
    window.localStorage.setItem(storageKey(clinicId), String(next));
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearStoredOnboardingStep(clinicId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(clinicId));
  } catch {
    /* ignore */
  }
}

/** Highest step index that already has saved evidence (−1 if none). */
export function deriveHighestCompletedStep(
  state: OnboardingProgressInput,
): number {
  const c = state.clinic;
  let completed = -1;

  const billingDone = Boolean(
    c.addressLine1?.trim() ||
      c.city?.trim() ||
      c.pincode?.trim() ||
      c.gstin?.trim() ||
      c.pan?.trim() ||
      c.businessEntity ||
      c.feeItemCount > 0,
  );
  const publicDone = Boolean(
    c.phoneVerifiedAt ||
      c.description?.trim() ||
      c.isPublicListed ||
      c.website?.trim(),
  );
  const directoryDone = c.languages.length > 0 || c.facilities.length > 0;

  if (c.logoUrl || billingDone || publicDone || directoryDone) {
    completed = 0;
  }
  if (billingDone) completed = Math.max(completed, 1);
  if (publicDone) completed = Math.max(completed, 2);
  if (directoryDone) completed = Math.max(completed, 3);

  return completed;
}

/** Step to open on load: first incomplete, honoring stored progress + skips. */
export function resolveResumeStep(
  storedStep: number,
  state: OnboardingProgressInput,
): number {
  const completed = deriveHighestCompletedStep(state);
  const fromData = completed + 1;
  const resume = Math.max(0, storedStep, fromData);
  return Math.min(resume, ONBOARDING_LAST_STEP);
}

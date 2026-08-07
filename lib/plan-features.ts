import type { Plan } from "@prisma/client";

/** Feature modules unlocked by SaaS plan. */
export type PlanFeature =
  | "scheduling"
  | "icd"
  | "messaging"
  | "referrals"
  | "labs"
  | "patient_portal"
  | "online_payments"
  | "abha"
  | "mis_reports";

/**
 * Engagement-first: portal discovery + booking are available on every plan.
 * Paid extras (online payments, ABHA, MIS) stay on Pro for later monetization.
 */
const PLAN_FEATURES: Record<Plan, readonly PlanFeature[]> = {
  free: ["scheduling", "icd", "referrals", "patient_portal"],
  starter: [
    "scheduling",
    "icd",
    "referrals",
    "messaging",
    "labs",
    "patient_portal",
  ],
  pro: [
    "scheduling",
    "icd",
    "referrals",
    "messaging",
    "labs",
    "patient_portal",
    "online_payments",
    "abha",
    "mis_reports",
  ],
};

export function featuresForPlan(plan: Plan): readonly PlanFeature[] {
  return PLAN_FEATURES[plan] ?? PLAN_FEATURES.free;
}

export function planAllows(plan: Plan, feature: PlanFeature): boolean {
  return featuresForPlan(plan).includes(feature);
}

export const PLAN_LABELS: Record<Plan, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
};

export const PLAN_BLURBS: Record<Plan, string> = {
  free: "Queue, records, prescriptions, and patient portal booking.",
  starter: "Everything in Free, plus messaging and lab orders.",
  pro: "Everything in Starter, plus online payments, ABHA, and MIS reports.",
};

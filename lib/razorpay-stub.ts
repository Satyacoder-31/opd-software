import type { Plan } from "@prisma/client";

export type RazorpaySubscriptionInput = {
  clinicId: string;
  plan: Plan;
  customerEmail: string;
};

export type RazorpaySubscriptionResult = {
  subscriptionId: string;
  status: "created" | "active";
  checkoutUrl: string | null;
};

/** Stub for future Razorpay billing integration */
export async function createSubscription(
  input: RazorpaySubscriptionInput
): Promise<RazorpaySubscriptionResult> {
  console.info("[Razorpay stub] createSubscription", input);
  return {
    subscriptionId: `sub_stub_${input.clinicId.slice(0, 8)}`,
    status: "created",
    checkoutUrl: null,
  };
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  console.info("[Razorpay stub] cancelSubscription", subscriptionId);
}

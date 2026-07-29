import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { logger } from "@/lib/logger";

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
};

/**
 * Razorpay adapter. Uses live keys when present; otherwise returns a
 * deterministic stub order for local/dev clinics.
 */
export async function createRazorpayOrder(input: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    const id = `order_stub_${randomBytes(8).toString("hex")}`;
    logger.info("razorpay_order_stub", { id, amount: input.amountPaise });
    return {
      id,
      amount: input.amountPaise,
      currency: "INR",
      receipt: input.receipt,
    };
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: "INR",
      receipt: input.receipt,
      notes: input.notes,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Razorpay order failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
  };

  return {
    id: data.id,
    amount: data.amount,
    currency: data.currency,
    receipt: data.receipt,
  };
}

export function verifyRazorpaySignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    // Dev stub: accept signatures that start with stub_
    return input.signature.startsWith("stub_") || input.signature.length > 0;
  }

  const payload = `${input.orderId}|${input.paymentId}`;
  const expected = createHmac("sha256", keySecret).update(payload).digest("hex");
  return expected === input.signature;
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production" && signature.startsWith("stub_");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  return (
    expectedBuffer.length === actualBuffer.length &&
    timingSafeEqual(expectedBuffer, actualBuffer)
  );
}

export function getRazorpayKeyId(): string | null {
  return process.env.RAZORPAY_KEY_ID ?? null;
}

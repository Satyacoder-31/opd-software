import { z } from "zod";
import type { LineItem } from "@/lib/types";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const clinicProfileSchema = z.object({
  name: z.string().min(2, "Clinic name must be at least 2 characters"),
  phone: z.string().min(10, "Enter a valid phone number"),
  address: z.string().min(5, "Address must be at least 5 characters").optional(),
  addressLine1: z.string().trim().optional(),
  addressLine2: z.string().trim().optional(),
  area: z.string().trim().optional(),
  state: z.string().trim().optional(),
  pincode: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^[1-9][0-9]{5}$/.test(v), "Enter a valid 6-digit PIN"),
  email: z.union([
    z.literal(""),
    z.string().trim().email("Enter a valid clinic email"),
  ]),
  whatsapp: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || v.length >= 10, "Enter a valid WhatsApp number"),
  clinicType: z.enum([
    "solo",
    "multi_doctor",
    "polyclinic",
    "specialty",
    "hospital_opd",
  ]),
  timezone: z.string().min(1),
  logoUrl: z.string().trim().optional(),
  website: z.string().trim().optional(),
  mapsUrl: z.string().trim().optional(),
  landmark: z.string().trim().optional(),
  city: z.string().trim().optional(),
  latitude: z.string().trim().optional(),
  longitude: z.string().trim().optional(),
  pan: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => !v || /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(v),
      "Enter a valid PAN"
    ),
  businessEntity: z
    .enum(["sole_prop", "partnership", "pvt_ltd", "trust", "other", ""])
    .optional(),
  gstin: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || /^[0-9A-Z]{15}$/i.test(value),
      "GSTIN must be 15 characters"
    ),
});

export function validateBillingInput(params: {
  mode: "flat" | "itemized";
  total: number;
  lineItems: LineItem[];
}): { ok: true } | { ok: false; error: string } {
  if (params.total <= 0) {
    return { ok: false, error: "Total amount must be greater than zero." };
  }

  if (params.mode === "itemized") {
    if (params.lineItems.length === 0) {
      return { ok: false, error: "Add at least one line item." };
    }

    for (const item of params.lineItems) {
      if (!item.description.trim()) {
        return { ok: false, error: "Each line item needs a description." };
      }
      if (item.amount <= 0) {
        return {
          ok: false,
          error: "Each line item needs an amount greater than zero.",
        };
      }
    }
  }

  return { ok: true };
}

export function validateReason(
  reason: string | undefined | null,
  label = "Reason"
): { ok: true; reason: string } | { ok: false; error: string } {
  const trimmed = reason?.trim() ?? "";
  if (trimmed.length < 3) {
    return { ok: false, error: `${label} must be at least 3 characters.` };
  }
  return { ok: true, reason: trimmed };
}

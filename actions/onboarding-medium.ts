"use server";

import { randomInt } from "crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { BusinessEntity } from "@prisma/client";
import { prisma } from "@/lib/db";
import { permissionDenied, requireSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { seedDefaultFeeItems } from "@/actions/fees";
import {
  BUSINESS_ENTITY_OPTIONS,
  CLINIC_FACILITY_OPTIONS,
  CLINIC_LANGUAGE_OPTIONS,
  formatClinicAddress,
  isValidIndianPincode,
  isValidPan,
  mapsUrlFromCoords,
  parseOptionalCoord,
  type BusinessEntityValue,
} from "@/lib/clinic-onboarding";
import type { MessagingConfig } from "@/lib/integrations/messaging";
import { sendClinicNotification } from "@/lib/integrations/messaging";
import { NotificationChannel } from "@prisma/client";
import {
  isPrescriptionLayoutId,
} from "@/lib/prescription-layouts";
import { hashOtp, normalizePhone } from "@/lib/portal-session";
import { can } from "@/lib/rbac";
import type { ActionResult, VoidActionResult } from "@/lib/types";

const entitySet = new Set(
  BUSINESS_ENTITY_OPTIONS.map((o) => o.value as string),
);
const languageSet = new Set<string>(CLINIC_LANGUAGE_OPTIONS);
const facilitySet = new Set<string>(CLINIC_FACILITY_OPTIONS);
const OTP_TTL_MS = 10 * 60 * 1000;

function optionalText(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function saveOnboardingBillingAddress(
  formData: FormData,
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "clinic.manage")) return permissionDenied();

  const addressLine1 = optionalText(formData.get("addressLine1"));
  const addressLine2 = optionalText(formData.get("addressLine2"));
  const area = optionalText(formData.get("area"));
  const state = optionalText(formData.get("state"));
  const pincode = optionalText(formData.get("pincode"));
  const city = optionalText(formData.get("city"));
  const landmark = optionalText(formData.get("landmark"));
  const mapsUrlRaw = optionalText(formData.get("mapsUrl"));
  const latitudeRaw = optionalText(formData.get("latitude"));
  const longitudeRaw = optionalText(formData.get("longitude"));
  const gstin = optionalText(formData.get("gstin"));
  const pan = optionalText(formData.get("pan"));
  const entityRaw = optionalText(formData.get("businessEntity"));
  const seedFees =
    formData.get("seedFees") === "on" || formData.get("seedFees") === "true";

  if (addressLine1 && addressLine1.length < 3) {
    return { success: false, error: "Enter a valid address line 1." };
  }
  if (pincode && !isValidIndianPincode(pincode)) {
    return {
      success: false,
      error: "Enter a valid 6-digit Indian PIN code.",
      fieldErrors: { pincode: "Invalid PIN code" },
    };
  }
  if (pan && !isValidPan(pan)) {
    return {
      success: false,
      error: "Enter a valid PAN (e.g. ABCDE1234F).",
      fieldErrors: { pan: "Invalid PAN" },
    };
  }
  if (gstin && !/^[0-9A-Z]{15}$/i.test(gstin)) {
    return {
      success: false,
      error: "GSTIN must be 15 characters.",
      fieldErrors: { gstin: "Invalid GSTIN" },
    };
  }
  if (entityRaw && !entitySet.has(entityRaw)) {
    return { success: false, error: "Select a valid business entity." };
  }

  const lat = parseOptionalCoord(latitudeRaw, "lat");
  const lng = parseOptionalCoord(longitudeRaw, "lng");
  if ((latitudeRaw && lat == null) || (longitudeRaw && lng == null)) {
    return {
      success: false,
      error: "Invalid map coordinates. Use GPS or paste a Maps link.",
      fieldErrors: { latitude: "Invalid coordinates" },
    };
  }

  let mapsUrl: string | null = null;
  if (mapsUrlRaw) {
    try {
      const url = new URL(mapsUrlRaw);
      if (url.protocol === "http:" || url.protocol === "https:") {
        mapsUrl = url.toString();
      }
    } catch {
      mapsUrl = null;
    }
    if (!mapsUrl) {
      return {
        success: false,
        error: "Enter a valid Maps URL (https://…).",
        fieldErrors: { mapsUrl: "Enter a valid https URL" },
      };
    }
  } else if (lat != null && lng != null) {
    mapsUrl = mapsUrlFromCoords(lat, lng);
  }

  const existing = await prisma.clinic.findUniqueOrThrow({
    where: { id: session.clinicId },
    select: {
      city: true,
      landmark: true,
      address: true,
      mapsUrl: true,
    },
  });

  const nextCity = city ?? existing.city;
  const nextLandmark = landmark ?? existing.landmark;
  const displayAddress = formatClinicAddress({
    addressLine1,
    addressLine2,
    area,
    city: nextCity,
    state,
    pincode,
    landmark: nextLandmark,
  });

  await prisma.clinic.update({
    where: { id: session.clinicId },
    data: {
      addressLine1: addressLine1 || null,
      addressLine2: addressLine2 || null,
      area: area || null,
      state: state || null,
      pincode: pincode || null,
      city: nextCity,
      landmark: nextLandmark,
      address: displayAddress || existing.address,
      mapsUrl: mapsUrl ?? existing.mapsUrl,
      latitude: lat,
      longitude: lng,
      gstin: gstin ? gstin.toUpperCase() : undefined,
      pan: pan ? pan.toUpperCase() : null,
      businessEntity: entityRaw
        ? (entityRaw as BusinessEntity)
        : null,
    },
  });

  if (seedFees) {
    await seedDefaultFeeItems();
  }

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "clinic",
    resourceId: session.clinicId,
    metadata: { onboarding: "billing_address", seedFees },
  });

  revalidatePath("/onboarding");
  revalidatePath("/settings/clinic");
  revalidateTag("clinic-profile");
  return { success: true };
}

export async function saveOnboardingOpsDefaults(
  formData: FormData,
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "clinic.manage")) return permissionDenied();

  const layout = String(formData.get("prescriptionLayout") ?? "classic").trim();
  if (!isPrescriptionLayoutId(layout)) {
    return { success: false, error: "Select a valid prescription layout." };
  }

  const senderId = optionalText(formData.get("senderId"));
  const smsEnabled =
    formData.get("smsEnabled") === "on" ||
    formData.get("smsEnabled") === "true";
  const whatsappEnabled =
    formData.get("whatsappEnabled") === "on" ||
    formData.get("whatsappEnabled") === "true";
  const appointmentReminders =
    formData.get("appointmentReminders") === "on" ||
    formData.get("appointmentReminders") === "true";
  const dryRun =
    formData.get("dryRun") === "on" || formData.get("dryRun") === "true";

  const razorpayKeyId = optionalText(formData.get("razorpayKeyId"));
  if (razorpayKeyId && !/^rzp_(live|test)_[A-Za-z0-9]+$/.test(razorpayKeyId)) {
    return {
      success: false,
      error: "Enter a valid Razorpay key id (rzp_live_… or rzp_test_…).",
      fieldErrors: { razorpayKeyId: "Invalid key id" },
    };
  }

  const existing = await prisma.clinic.findUniqueOrThrow({
    where: { id: session.clinicId },
    select: { messagingConfig: true },
  });
  const prev = (existing.messagingConfig ?? {}) as MessagingConfig;
  const messagingConfig: MessagingConfig = {
    ...prev,
    smsEnabled,
    whatsappEnabled,
    appointmentReminders,
    dryRun,
    senderId: senderId ?? prev.senderId,
  };

  await prisma.clinic.update({
    where: { id: session.clinicId },
    data: {
      prescriptionLayout: layout,
      messagingConfig,
      razorpayKeyId: razorpayKeyId || null,
    },
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "clinic",
    resourceId: session.clinicId,
    metadata: { onboarding: "ops_defaults", layout },
  });

  revalidatePath("/onboarding");
  revalidatePath("/settings/prescriptions");
  revalidatePath("/settings/notifications");
  revalidatePath("/settings/subscription");
  revalidateTag("clinic-profile");
  return { success: true };
}

export async function saveOnboardingDirectoryExtras(
  formData: FormData,
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "clinic.manage")) return permissionDenied();

  const languages = formData
    .getAll("languages")
    .map((v) => String(v).trim())
    .filter((v) => languageSet.has(v))
    .slice(0, 12);
  const facilities = formData
    .getAll("facilities")
    .map((v) => String(v).trim())
    .filter((v) => facilitySet.has(v))
    .slice(0, 20);

  await prisma.clinic.update({
    where: { id: session.clinicId },
    data: { languages, facilities },
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "clinic",
    resourceId: session.clinicId,
    metadata: { onboarding: "directory_extras" },
  });

  revalidatePath("/onboarding");
  revalidatePath("/clinics");
  revalidatePath("/settings/availability");
  return { success: true };
}

export async function requestClinicPhoneOtp(): Promise<
  ActionResult<{ sent: true; dryRunHint?: string }>
> {
  const session = await requireSessionUser();
  if (!can(session, "clinic.manage")) return permissionDenied();

  const clinic = await prisma.clinic.findUniqueOrThrow({
    where: { id: session.clinicId },
    select: { phone: true, name: true, phoneVerifiedAt: true, plan: true },
  });

  if (clinic.phoneVerifiedAt) {
    return { success: true, data: { sent: true, dryRunHint: "Already verified." } };
  }

  const phone = normalizePhone(clinic.phone);
  const code = String(randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.portalOtp.create({
    data: {
      clinicId: session.clinicId,
      phone,
      codeHash: hashOtp(code),
      expiresAt,
    },
  });

  const result = await sendClinicNotification({
    clinicId: session.clinicId,
    clinicPlan: clinic.plan,
    phone,
    channel: NotificationChannel.sms,
    templateKey: "portal_otp",
    vars: { clinicName: clinic.name, code },
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "create",
    resourceType: "clinic",
    resourceId: session.clinicId,
    metadata: { onboarding: "phone_otp_sent", status: result.status },
  });

  const showCode =
    !result.sent ||
    result.status === "skipped" ||
    process.env.NODE_ENV !== "production";

  return {
    success: true,
    data: {
      sent: true,
      dryRunHint: showCode ? `OTP: ${code}` : undefined,
    },
  };
}

export async function verifyClinicPhoneOtp(
  formData: FormData,
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "clinic.manage")) return permissionDenied();

  const code = String(formData.get("code") ?? "").trim();
  if (!/^\d{6}$/.test(code)) {
    return { success: false, error: "Enter the 6-digit OTP." };
  }

  const clinic = await prisma.clinic.findUniqueOrThrow({
    where: { id: session.clinicId },
    select: { phone: true },
  });
  const phone = normalizePhone(clinic.phone);
  const codeHash = hashOtp(code);

  const otp = await prisma.portalOtp.findFirst({
    where: {
      clinicId: session.clinicId,
      phone,
      codeHash,
      consumedAt: null,
      expiresAt: { gt: new Date() },
      portalAccountId: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return { success: false, error: "Invalid or expired OTP." };
  }

  await prisma.$transaction([
    prisma.portalOtp.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    }),
    prisma.clinic.update({
      where: { id: session.clinicId },
      data: { phoneVerifiedAt: new Date() },
    }),
  ]);

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "clinic",
    resourceId: session.clinicId,
    metadata: { onboarding: "phone_verified" },
  });

  revalidatePath("/onboarding");
  revalidatePath("/settings/availability");
  revalidatePath("/settings/clinic");
  return { success: true };
}

export async function saveClinicRazorpayKeyId(
  formData: FormData,
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "clinic.manage")) return permissionDenied();

  const razorpayKeyId = optionalText(formData.get("razorpayKeyId"));
  if (razorpayKeyId && !/^rzp_(live|test)_[A-Za-z0-9]+$/.test(razorpayKeyId)) {
    return {
      success: false,
      error: "Enter a valid Razorpay key id (rzp_live_… or rzp_test_…).",
      fieldErrors: { razorpayKeyId: "Invalid key id" },
    };
  }

  await prisma.clinic.update({
    where: { id: session.clinicId },
    data: { razorpayKeyId: razorpayKeyId || null },
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "clinic",
    resourceId: session.clinicId,
    metadata: { razorpayKeyId: Boolean(razorpayKeyId) },
  });

  revalidatePath("/settings/subscription");
  revalidatePath("/onboarding");
  return { success: true };
}

export type { BusinessEntityValue };

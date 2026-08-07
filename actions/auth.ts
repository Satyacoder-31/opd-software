"use server";

import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { Plan, Role, SubscriptionStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ensureUserFromAuth,
  PENDING_AUTH_PREFIX,
  requireSessionUser,
} from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { zodFieldErrors } from "@/lib/form-utils";
import { loginSchema, clinicProfileSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validation";
import { CLINIC_SPECIALTIES } from "@/lib/clinic-specialties";
import {
  cancelCutoffForClinicType,
  formatClinicAddress,
  mapsUrlFromCoords,
  parseOptionalCoord,
  TERMS_VERSION,
  type ClinicTypeValue,
} from "@/lib/clinic-onboarding";
import { logger } from "@/lib/logger";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import {
  can,
  isInvitableRole,
  ROLE_LABELS,
} from "@/lib/rbac";
import type { ActionResult, VoidActionResult } from "@/lib/types";

const specialtySet = new Set<string>(CLINIC_SPECIALTIES);

const signupSchema = z
  .object({
    clinicName: z.string().min(2),
    clinicPhone: z.string().min(10),
    clinicEmail: z.string().email(),
    specialties: z.array(z.string().min(1)).min(1, "Select at least one specialty"),
    adminName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    isConsultingDoctor: z.boolean(),
    doctorSpecialty: z.string().optional(),
    qualifications: z.string().optional(),
    registrationNo: z.string().optional(),
    consultationFee: z.string().optional(),
    acceptTerms: z.boolean().refine((value) => value === true, {
      message: "You must accept the Terms and Privacy Policy",
    }),
  })
  .superRefine((data, ctx) => {
    for (const s of data.specialties) {
      if (!specialtySet.has(s)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid specialty",
          path: ["specialties"],
        });
        break;
      }
    }
    if (data.isConsultingDoctor) {
      if (!data.doctorSpecialty?.trim() || !specialtySet.has(data.doctorSpecialty)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select your specialty",
          path: ["doctorSpecialty"],
        });
      }
      const feeRaw = data.consultationFee?.trim() ?? "";
      const fee = feeRaw === "" ? NaN : Number(feeRaw);
      if (!feeRaw || Number.isNaN(fee) || fee < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a valid consultation fee",
          path: ["consultationFee"],
        });
      }
    }
  });

async function enforceAuthRateLimit(
  action: "login" | "signup" | "forgot-password"
): Promise<{ success: false; error: string } | null> {
  const headerStore = await headers();
  const ip = getClientIp(
    headerStore.get("x-forwarded-for"),
    headerStore.get("x-real-ip"),
    headerStore.get("x-vercel-forwarded-for")
  );
  const limit = action === "login" ? 10 : 5;
  const result = rateLimit(`${action}:${ip}`, limit, 60_000);

  if (!result.ok) {
    const retryAfterSec = Math.ceil((result.retryAfterMs ?? 60_000) / 1000);
    return {
      success: false,
      error: `Too many attempts. Please wait ${retryAfterSec} seconds and try again.`,
    };
  }

  return null;
}

export async function signup(
  formData: FormData
): Promise<ActionResult<{ email: string }>> {
  const rateLimited = await enforceAuthRateLimit("signup");
  if (rateLimited) return rateLimited;

  const parsed = signupSchema.safeParse({
    clinicName: formData.get("clinicName"),
    clinicPhone: formData.get("clinicPhone"),
    clinicEmail: formData.get("clinicEmail"),
    specialties: formData
      .getAll("specialties")
      .map((value) => String(value).trim())
      .filter(Boolean),
    adminName: formData.get("adminName"),
    email: formData.get("email"),
    password: formData.get("password"),
    isConsultingDoctor:
      formData.get("isConsultingDoctor") === "on" ||
      formData.get("isConsultingDoctor") === "true",
    doctorSpecialty: optionalText(formData.get("doctorSpecialty")),
    qualifications: optionalText(formData.get("qualifications")),
    registrationNo: optionalText(formData.get("registrationNo")),
    consultationFee: optionalText(formData.get("consultationFee")),
    acceptTerms:
      formData.get("acceptTerms") === "on" ||
      formData.get("acceptTerms") === "true"
        ? true
        : false,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Please fill all fields correctly.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const {
    clinicName,
    clinicPhone,
    clinicEmail,
    specialties,
    adminName,
    email,
    password,
    isConsultingDoctor,
    doctorSpecialty,
    qualifications,
    registrationNo,
    consultationFee,
  } = parsed.data;

  const admin = createAdminClient();
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: adminName },
  });

  if (authError || !authData.user) {
    const message = authError?.message ?? "Failed to create account.";
    if (message.toLowerCase().includes("already")) {
      return {
        success: false,
        error: "An account with this email already exists.",
        fieldErrors: {
          email:
            "This email is already registered. Try signing in instead.",
        },
      };
    }
    logger.warn("signup_auth_failed", { email, error: message });
    return {
      success: false,
      error: "Could not create the account. Please try again.",
    };
  }

  try {
    const feeNumber =
      isConsultingDoctor && consultationFee
        ? Number(consultationFee)
        : null;

    const clinic = await prisma.clinic.create({
      data: {
        name: clinicName,
        phone: clinicPhone,
        // Address / GSTIN collected in onboarding (Billing & address step).
        address: "",
        email: clinicEmail,
        specialties,
        termsAcceptedAt: new Date(),
        termsVersion: TERMS_VERSION,
        users: {
          create: {
            name: adminName,
            email,
            role: Role.owner,
            supabaseAuthId: authData.user.id,
            specialty: isConsultingDoctor ? doctorSpecialty ?? null : null,
            qualifications: isConsultingDoctor
              ? qualifications ?? null
              : null,
            registrationNo: isConsultingDoctor
              ? registrationNo ?? null
              : null,
            consultationFee:
              isConsultingDoctor && feeNumber != null && !Number.isNaN(feeNumber)
                ? feeNumber
                : null,
          },
        },
      },
      include: { users: true },
    });

    const adminUser = clinic.users[0];

    await admin.auth.admin.updateUserById(authData.user.id, {
      app_metadata: {
        clinicId: clinic.id,
        role: Role.owner,
        userId: adminUser.id,
      },
      user_metadata: { name: adminName },
    });

    await logAudit({
      clinicId: clinic.id,
      actorId: adminUser.id,
      action: "create",
      resourceType: "clinic",
      resourceId: clinic.id,
    });
  } catch (error) {
    await admin.auth.admin.deleteUser(authData.user.id);
    logger.error("signup_clinic_setup_failed", {
      email,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: "Account setup failed. Please try again or contact support.",
    };
  }

  return { success: true, data: { email } };
}

export async function login(
  formData: FormData
): Promise<ActionResult<{ redirectTo: string }>> {
  const rateLimited = await enforceAuthRateLimit("login");
  if (rateLimited) return rateLimited;

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Please check your login details.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const { email, password } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    logger.warn("login_failed", { email, error: error.message });
    return {
      success: false,
      error: "Invalid email or password.",
      fieldErrors: { email: "Invalid email or password" },
    };
  }

  const dbUser = await prisma.user.findUnique({
    where: { email },
    select: {
      isActive: true,
      role: true,
      clinicId: true,
    },
  });
  if (dbUser && !dbUser.isActive) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "This account has been deactivated. Contact your clinic admin.",
    };
  }

  await ensureUserFromAuth();

  let redirectTo = "/queue";
  if (
    dbUser &&
    (dbUser.role === Role.owner || dbUser.role === Role.admin)
  ) {
    const clinic = await prisma.clinic.findUnique({
      where: { id: dbUser.clinicId },
      select: {
        onboardingCompletedAt: true,
        onboardingSkippedAt: true,
      },
    });
    if (
      clinic &&
      !clinic.onboardingCompletedAt &&
      !clinic.onboardingSkippedAt
    ) {
      redirectTo = "/onboarding";
    }
  }

  return { success: true, data: { redirectTo } };
}

export async function requestPasswordReset(
  formData: FormData
): Promise<VoidActionResult> {
  const rateLimited = await enforceAuthRateLimit("forgot-password");
  if (rateLimited) return rateLimited;

  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Enter a valid email address.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const { email } = parsed.data;
  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/login/reset-password`,
  });

  if (error) {
    logger.warn("password_reset_request_failed", {
      email,
      error: error.message,
    });
  }

  // Always succeed to avoid email enumeration.
  return { success: true };
}

export async function updatePassword(
  formData: FormData
): Promise<VoidActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Please check your new password.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Your reset link is invalid or has expired. Request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    logger.warn("password_update_failed", {
      userId: user.id,
      error: error.message,
    });
    return {
      success: false,
      error: "Could not update password. Request a new reset link and try again.",
    };
  }

  return { success: true };
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(["admin", "doctor", "receptionist"]),
  phone: z.string().optional(),
  specialty: z.string().optional(),
  qualifications: z.string().optional(),
  registrationNo: z.string().optional(),
  consultationFee: z.string().optional(),
  designation: z.string().optional(),
});

function optionalFormText(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function inviteStaff(
  formData: FormData
): Promise<ActionResult<{ email: string }>> {
  const rateLimited = await enforceAuthRateLimit("signup");
  if (rateLimited) return rateLimited;

  const session = await requireSessionUser();
  if (!can(session, "staff.manage")) {
    return { success: false, error: "Only clinic managers can invite staff." };
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    role: formData.get("role"),
    phone: optionalFormText(formData, "phone"),
    specialty: optionalFormText(formData, "specialty"),
    qualifications: optionalFormText(formData, "qualifications"),
    registrationNo: optionalFormText(formData, "registrationNo"),
    consultationFee: optionalFormText(formData, "consultationFee"),
    designation: optionalFormText(formData, "designation"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid invite details.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const { email, name, role, phone, specialty, qualifications, registrationNo, designation } =
    parsed.data;

  if (!isInvitableRole(role)) {
    return { success: false, error: "Invalid staff role." };
  }

  if (role === Role.admin && !can(session, "staff.invite.admin")) {
    return {
      success: false,
      error: "You do not have permission to invite admins.",
    };
  }

  if (role === Role.doctor && !specialty) {
    return {
      success: false,
      error: "Choose a specialty for the doctor.",
      fieldErrors: { specialty: "Specialty is required for doctors." },
    };
  }

  let consultationFee: number | null = null;
  if (role === Role.doctor && parsed.data.consultationFee) {
    consultationFee = Number(parsed.data.consultationFee);
    if (Number.isNaN(consultationFee) || consultationFee < 0) {
      return { success: false, error: "Enter a valid consultation fee." };
    }
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      success: false,
      error: "This email cannot be invited.",
      fieldErrors: { email: "This email cannot be invited." },
    };
  }

  const pendingAuthId = `${PENDING_AUTH_PREFIX}${randomUUID()}`;

  const pendingUser = await prisma.user.create({
    data: {
      clinicId: session.clinicId,
      name,
      email,
      role,
      supabaseAuthId: pendingAuthId,
      phone: phone ?? null,
      specialty: role === Role.doctor ? specialty ?? null : null,
      qualifications: role === Role.doctor ? qualifications ?? null : null,
      registrationNo: role === Role.doctor ? registrationNo ?? null : null,
      consultationFee: role === Role.doctor ? consultationFee : null,
      designation: role !== Role.doctor ? designation ?? null : null,
    },
  });

  const admin = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data: inviteData, error } = await admin.auth.admin.inviteUserByEmail(
    email,
    {
      redirectTo: `${appUrl}/auth/callback`,
      data: { name },
    }
  );

  if (error) {
    await prisma.user.delete({ where: { id: pendingUser.id } });
    logger.warn("invite_failed", { email, error: error.message });
    return {
      success: false,
      error: "Could not send the invite. Please try again.",
    };
  }

  if (inviteData.user) {
    await admin.auth.admin.updateUserById(inviteData.user.id, {
      app_metadata: {
        clinicId: session.clinicId,
        role,
        userId: pendingUser.id,
      },
      user_metadata: { name },
    });

    if (inviteData.user.id !== pendingAuthId) {
      await prisma.user.update({
        where: { id: pendingUser.id },
        data: { supabaseAuthId: inviteData.user.id },
      });
    }
  }

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "create",
    resourceType: "user",
    resourceId: pendingUser.id,
    metadata: { invitedEmail: email, role },
  });

  revalidateTag("clinic-profile");
  revalidatePath("/settings");
  revalidatePath("/settings/staff");
  return { success: true, data: { email } };
}

export async function updateClinicProfile(
  formData: FormData
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "clinic.manage")) {
    return { success: false, error: "Only clinic managers can update clinic profile." };
  }

  const parsed = clinicProfileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    address: optionalText(formData.get("address")),
    addressLine1: optionalText(formData.get("addressLine1")),
    addressLine2: optionalText(formData.get("addressLine2")),
    area: optionalText(formData.get("area")),
    state: optionalText(formData.get("state")),
    pincode: optionalText(formData.get("pincode")),
    city: optionalText(formData.get("city")),
    email: optionalText(formData.get("email")) ?? "",
    whatsapp: optionalText(formData.get("whatsapp")),
    clinicType: formData.get("clinicType") || "solo",
    timezone: formData.get("timezone") || "Asia/Kolkata",
    logoUrl: optionalText(formData.get("logoUrl")),
    website: optionalText(formData.get("website")),
    mapsUrl: optionalText(formData.get("mapsUrl")),
    landmark: optionalText(formData.get("landmark")),
    latitude: optionalText(formData.get("latitude")),
    longitude: optionalText(formData.get("longitude")),
    pan: optionalText(formData.get("pan")),
    businessEntity: optionalText(formData.get("businessEntity")) ?? "",
    gstin: optionalText(formData.get("gstin")),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Please check the clinic profile details.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const {
    name,
    phone,
    address,
    addressLine1,
    addressLine2,
    area,
    state,
    pincode,
    city,
    email,
    whatsapp,
    clinicType,
    timezone,
    logoUrl,
    website,
    mapsUrl,
    landmark,
    latitude,
    longitude,
    pan,
    businessEntity,
    gstin,
  } = parsed.data;

  function asHttpUrl(value: string | undefined): string | null {
    if (!value) return null;
    try {
      const url = new URL(value);
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      return url.toString();
    } catch {
      return null;
    }
  }

  if (logoUrl && !asHttpUrl(logoUrl)) {
    return {
      success: false,
      error: "Invalid logo. Upload an image again.",
      fieldErrors: { logoUrl: "Upload a valid image" },
    };
  }
  if (website && !asHttpUrl(website)) {
    return {
      success: false,
      error: "Enter a valid website URL (https://…).",
      fieldErrors: { website: "Enter a valid https URL" },
    };
  }
  const lat = parseOptionalCoord(latitude, "lat");
  const lng = parseOptionalCoord(longitude, "lng");
  if ((latitude && lat == null) || (longitude && lng == null)) {
    return {
      success: false,
      error: "Invalid map coordinates. Use GPS or paste a Maps link.",
      fieldErrors: { latitude: "Invalid coordinates" },
    };
  }
  if ((lat != null && lng == null) || (lat == null && lng != null)) {
    return {
      success: false,
      error: "Capture both latitude and longitude.",
      fieldErrors: { latitude: "Incomplete coordinates" },
    };
  }

  let resolvedMapsUrl = mapsUrl ? asHttpUrl(mapsUrl) : null;
  if (mapsUrl && !resolvedMapsUrl) {
    return {
      success: false,
      error: "Enter a valid maps URL (https://…).",
      fieldErrors: { mapsUrl: "Enter a valid https URL" },
    };
  }
  if (!resolvedMapsUrl && lat != null && lng != null) {
    resolvedMapsUrl = mapsUrlFromCoords(lat, lng);
  }

  const existing = await prisma.clinic.findUniqueOrThrow({
    where: { id: session.clinicId },
    select: { city: true, address: true },
  });

  const nextCity = city || existing.city;
  const syncedAddress =
    formatClinicAddress({
      addressLine1,
      addressLine2,
      area,
      city: nextCity,
      state,
      pincode,
      landmark,
    }) ||
    address ||
    existing.address;

  if (!syncedAddress || syncedAddress.length < 5) {
    return {
      success: false,
      error: "Enter a street address (line 1) or full address.",
    };
  }

  await prisma.clinic.update({
    where: { id: session.clinicId },
    data: {
      name,
      phone,
      address: syncedAddress,
      addressLine1: addressLine1 || null,
      addressLine2: addressLine2 || null,
      area: area || null,
      state: state || null,
      pincode: pincode || null,
      city: nextCity,
      email: email || null,
      whatsapp: whatsapp || null,
      clinicType,
      timezone,
      logoUrl: asHttpUrl(logoUrl),
      website: asHttpUrl(website),
      mapsUrl: resolvedMapsUrl,
      landmark: landmark || null,
      latitude: lat,
      longitude: lng,
      pan: pan ? pan.toUpperCase() : null,
      businessEntity: businessEntity
        ? (businessEntity as
            | "sole_prop"
            | "partnership"
            | "pvt_ltd"
            | "trust"
            | "other")
        : null,
      gstin: gstin?.toUpperCase() || null,
      cancelCutoffHours: cancelCutoffForClinicType(
        clinicType as ClinicTypeValue,
      ),
    },
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "clinic",
    resourceId: session.clinicId,
  });

  revalidateTag("clinic-profile");
  revalidateTag("clinic-name");
  revalidateTag("clinic-dashboard");
  revalidatePath("/settings");
  revalidatePath("/settings/clinic");
  revalidatePath("/settings/clinic/edit");
  return { success: true };
}

/** Temporary plan switcher until Razorpay billing is live (owner only). */
export async function setClinicPlan(formData: FormData): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "subscription.manage")) {
    return { success: false, error: "Only the clinic owner can change the plan." };
  }

  const parsed = z
    .object({
      plan: z.enum(["free", "starter", "pro"]),
    })
    .safeParse({ plan: formData.get("plan") });

  if (!parsed.success) {
    return { success: false, error: "Choose a valid plan." };
  }

  const nextPlan = parsed.data.plan as Plan;

  await prisma.clinic.update({
    where: { id: session.clinicId },
    data: {
      plan: nextPlan,
      subscriptionStatus:
        nextPlan === Plan.free
          ? SubscriptionStatus.trialing
          : SubscriptionStatus.active,
    },
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "clinic",
    resourceId: session.clinicId,
    metadata: { plan: nextPlan },
  });

  revalidateTag("clinic-profile");
  revalidatePath("/settings/subscription");
  revalidatePath("/settings/availability");
  revalidatePath("/clinics");
  return { success: true };
}

const getCachedClinicProfile = unstable_cache(
  async (clinicId: string) => {
    return prisma.clinic.findUniqueOrThrow({
      where: { id: clinicId },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        email: true,
        whatsapp: true,
        gstin: true,
        clinicType: true,
        timezone: true,
        logoUrl: true,
        website: true,
        mapsUrl: true,
        landmark: true,
        addressLine1: true,
        addressLine2: true,
        area: true,
        state: true,
        pincode: true,
        pan: true,
        businessEntity: true,
        phoneVerifiedAt: true,
        latitude: true,
        longitude: true,
        city: true,
        razorpayKeyId: true,
        prescriptionLayout: true,
        plan: true,
        subscriptionStatus: true,
        createdAt: true,
        updatedAt: true,
        nextInvoiceSeq: true,
      },
    });
  },
  ["clinic-profile"],
  { revalidate: 60, tags: ["clinic-profile"] }
);

export async function getClinicProfile() {
  const session = await requireSessionUser();
  return getCachedClinicProfile(session.clinicId);
}

const staffSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  qualifications: true,
  registrationNo: true,
  specialty: true,
  consultationFee: true,
  designation: true,
  phone: true,
  createdAt: true,
  updatedAt: true,
  clinicId: true,
} as const;

export async function getStaffList() {
  const session = await requireSessionUser();
  if (!can(session, "staff.manage")) {
    return [];
  }

  const rows = await prisma.user.findMany({
    where: { clinicId: session.clinicId },
    orderBy: { createdAt: "asc" },
    select: staffSelect,
  });

  return rows.map(serializeStaffMember);
}

export async function getStaffMember(userId: string) {
  const session = await requireSessionUser();
  if (!can(session, "staff.manage")) {
    return null;
  }

  const row = await prisma.user.findFirst({
    where: { id: userId, clinicId: session.clinicId },
    select: staffSelect,
  });
  return row ? serializeStaffMember(row) : null;
}

function serializeStaffMember(row: {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  qualifications: string | null;
  registrationNo: string | null;
  specialty: string | null;
  consultationFee: { toString(): string } | null;
  designation: string | null;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
  clinicId: string;
}) {
  return {
    ...row,
    consultationFee:
      row.consultationFee != null ? row.consultationFee.toString() : null,
  };
}

/** Update role-specific profile fields for any staff member. */
export async function updateStaffProfile(
  userId: string,
  formData: FormData,
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "staff.manage")) {
    return { success: false, error: "Only clinic managers can update staff profiles." };
  }

  const target = await prisma.user.findFirst({
    where: { id: userId, clinicId: session.clinicId },
    select: { id: true, role: true },
  });
  if (!target) return { success: false, error: "Staff member not found." };

  const phone = optionalFormText(formData, "phone") ?? null;

  if (target.role === Role.doctor) {
    const specialty = optionalFormText(formData, "specialty") ?? null;
    if (!specialty) {
      return {
        success: false,
        error: "Specialty is required for doctors.",
        fieldErrors: { specialty: "Choose a specialty." },
      };
    }
    const feeRaw = optionalFormText(formData, "consultationFee");
    let consultationFee: number | null = null;
    if (feeRaw) {
      consultationFee = Number(feeRaw);
      if (Number.isNaN(consultationFee) || consultationFee < 0) {
        return { success: false, error: "Enter a valid consultation fee." };
      }
    }
    await prisma.user.update({
      where: { id: userId },
      data: {
        phone,
        specialty,
        qualifications: optionalFormText(formData, "qualifications") ?? null,
        registrationNo: optionalFormText(formData, "registrationNo") ?? null,
        consultationFee,
      },
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: {
        phone,
        designation: optionalFormText(formData, "designation") ?? null,
      },
    });
  }

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "user",
    resourceId: userId,
    metadata: { profile: true },
  });

  revalidatePath("/settings/staff");
  revalidatePath(`/settings/staff/${userId}`);
  revalidatePath(`/settings/staff/${userId}/edit`);
  revalidatePath("/settings/availability/schedules");
  revalidatePath("/settings/availability/schedules/edit");
  revalidatePath("/clinics");
  return { success: true };
}

function optionalText(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function setStaffActive(
  userId: string,
  isActive: boolean
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "staff.manage")) {
    return { success: false, error: "Only clinic managers can manage staff." };
  }

  if (userId === session.userId) {
    return { success: false, error: "You cannot deactivate your own account." };
  }

  const target = await prisma.user.findFirst({
    where: { id: userId, clinicId: session.clinicId },
  });

  if (!target) {
    return { success: false, error: "Staff member not found." };
  }

  if (target.role === Role.owner && !isActive) {
    const activeOwners = await prisma.user.count({
      where: {
        clinicId: session.clinicId,
        role: Role.owner,
        isActive: true,
        id: { not: userId },
      },
    });
    if (activeOwners === 0) {
      return { success: false, error: "Keep at least one active owner." };
    }
  }

  if (target.role === Role.admin && !isActive) {
    const activeManagers = await prisma.user.count({
      where: {
        clinicId: session.clinicId,
        role: { in: [Role.owner, Role.admin] },
        isActive: true,
        id: { not: userId },
      },
    });
    if (activeManagers === 0) {
      return {
        success: false,
        error: `Keep at least one active ${ROLE_LABELS[Role.admin].toLowerCase()} or owner.`,
      };
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive },
  });

  if (!target.supabaseAuthId.startsWith(PENDING_AUTH_PREFIX)) {
    const admin = createAdminClient();
    await admin.auth.admin.updateUserById(target.supabaseAuthId, {
      app_metadata: {
        clinicId: target.clinicId,
        role: target.role,
        userId: target.id,
        isActive,
      },
      ban_duration: isActive ? "none" : "876000h",
    });
  }

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "user",
    resourceId: userId,
    metadata: { isActive },
  });

  revalidateTag("clinic-profile");
  revalidatePath("/settings");
  revalidatePath("/settings/staff");
  return { success: true };
}

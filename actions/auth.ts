"use server";

import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
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
import { logger } from "@/lib/logger";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import type { ActionResult, VoidActionResult } from "@/lib/types";

const signupSchema = z.object({
  clinicName: z.string().min(2),
  clinicPhone: z.string().min(10),
  clinicAddress: z.string().min(5),
  adminName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
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
    clinicAddress: formData.get("clinicAddress"),
    adminName: formData.get("adminName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Please fill all fields correctly.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const { clinicName, clinicPhone, clinicAddress, adminName, email, password } =
    parsed.data;

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
    const clinic = await prisma.clinic.create({
      data: {
        name: clinicName,
        phone: clinicPhone,
        address: clinicAddress,
        users: {
          create: {
            name: adminName,
            email,
            role: Role.admin,
            supabaseAuthId: authData.user.id,
          },
        },
      },
      include: { users: true },
    });

    const adminUser = clinic.users[0];

    await admin.auth.admin.updateUserById(authData.user.id, {
      app_metadata: {
        clinicId: clinic.id,
        role: Role.admin,
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
): Promise<VoidActionResult> {
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

  const dbUser = await prisma.user.findUnique({ where: { email } });
  if (dbUser && !dbUser.isActive) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "This account has been deactivated. Contact your clinic admin.",
    };
  }

  await ensureUserFromAuth();
  return { success: true };
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
  role: z.enum(["doctor", "receptionist"]),
});

export async function inviteStaff(
  formData: FormData
): Promise<ActionResult<{ email: string }>> {
  const session = await requireSessionUser();
  if (session.role !== Role.admin) {
    return { success: false, error: "Only admins can invite staff." };
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid invite details.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const { email, name, role } = parsed.data;

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
  return { success: true, data: { email } };
}

export async function updateClinicProfile(
  formData: FormData
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (session.role !== Role.admin) {
    return { success: false, error: "Only admins can update clinic profile." };
  }

  const parsed = clinicProfileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    gstin: optionalText(formData.get("gstin")),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Please check the clinic profile details.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const { name, phone, address, gstin } = parsed.data;

  await prisma.clinic.update({
    where: { id: session.clinicId },
    data: {
      name,
      phone,
      address,
      gstin: gstin?.toUpperCase() || null,
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
  revalidatePath("/settings");
  revalidatePath("/settings/edit");
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
        gstin: true,
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

export async function getStaffList() {
  const session = await requireSessionUser();
  if (session.role !== Role.admin) {
    return [];
  }

  return prisma.user.findMany({
    where: { clinicId: session.clinicId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      qualifications: true,
      registrationNo: true,
      createdAt: true,
      updatedAt: true,
      clinicId: true,
    },
  });
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
  if (session.role !== Role.admin) {
    return { success: false, error: "Only admins can manage staff." };
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

  if (target.role === Role.admin && !isActive) {
    const activeAdmins = await prisma.user.count({
      where: {
        clinicId: session.clinicId,
        role: Role.admin,
        isActive: true,
        id: { not: userId },
      },
    });
    if (activeAdmins === 0) {
      return { success: false, error: "Keep at least one active admin." };
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
  return { success: true };
}

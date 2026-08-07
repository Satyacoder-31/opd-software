"use server";

import { randomUUID } from "crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { ClinicType, Plan } from "@prisma/client";
import { prisma } from "@/lib/db";
import { permissionDenied, requireSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import {
  cancelCutoffForClinicType,
  CLINIC_TYPE_OPTIONS,
  type ClinicHourRow,
  type ClinicTypeValue,
  DEFAULT_CLINIC_HOURS,
  parseClinicHours,
} from "@/lib/clinic-onboarding";
import { logger } from "@/lib/logger";
import { can } from "@/lib/rbac";
import { ensureUniqueSlug, slugify } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult, VoidActionResult } from "@/lib/types";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const LOGO_BUCKET = "clinic-logos";
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

const clinicTypeSet = new Set(
  CLINIC_TYPE_OPTIONS.map((o) => o.value as string),
);

function resolveClinicTimezone(raw: string): string {
  const timezone = raw.trim() || "Asia/Kolkata";
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return timezone;
  } catch {
    return "Asia/Kolkata";
  }
}

async function ensureClinicLogosBucket(
  admin: ReturnType<typeof createAdminClient>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: buckets, error: listError } = await admin.storage.listBuckets();
  if (listError) {
    logger.error("clinic_logo_list_buckets_failed", { error: listError.message });
    return {
      ok: false,
      error:
        "Could not reach Supabase Storage. Check SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const existing = buckets?.find((b) => b.name === LOGO_BUCKET);
  if (existing) {
    // Public logo URLs (/object/public/...) 404 with "Bucket not found"
    // when the bucket exists but is private.
    if (!existing.public) {
      const { error: updateError } = await admin.storage.updateBucket(
        LOGO_BUCKET,
        {
          public: true,
          fileSizeLimit: MAX_LOGO_BYTES,
          allowedMimeTypes: [...ALLOWED_LOGO_TYPES],
        },
      );
      if (updateError) {
        logger.error("clinic_logo_make_public_failed", {
          error: updateError.message,
        });
        return {
          ok: false,
          error:
            "clinic-logos bucket exists but is private. Open Supabase → Storage → clinic-logos → make it Public, then upload again.",
        };
      }
    }
    return { ok: true };
  }

  const { error: createError } = await admin.storage.createBucket(LOGO_BUCKET, {
    public: true,
    fileSizeLimit: MAX_LOGO_BYTES,
    allowedMimeTypes: [...ALLOWED_LOGO_TYPES],
  });

  if (
    createError &&
    !/already exists|duplicate|resource already/i.test(createError.message)
  ) {
    logger.error("clinic_logo_create_bucket_failed", {
      error: createError.message,
    });
    return {
      ok: false,
      error:
        "Could not create the clinic-logos storage bucket. Create a public bucket named clinic-logos in Supabase → Storage, then try again.",
    };
  }

  return { ok: true };
}

export type OnboardingState = {
  clinic: {
    id: string;
    name: string;
    phone: string;
    slug: string | null;
    description: string | null;
    isPublicListed: boolean;
    bookingEnabled: boolean;
    city: string | null;
    specialties: string[];
    onboardingCompletedAt: Date | null;
    onboardingSkippedAt: Date | null;
    clinicType: ClinicType;
    logoUrl: string | null;
    clinicHours: ClinicHourRow[];
    website: string | null;
    mapsUrl: string | null;
    landmark: string | null;
    timezone: string;
    plan: Plan;
    subscriptionStatus: string;
    addressLine1: string | null;
    addressLine2: string | null;
    area: string | null;
    state: string | null;
    pincode: string | null;
    latitude: number | null;
    longitude: number | null;
    gstin: string | null;
    pan: string | null;
    businessEntity: string | null;
    languages: string[];
    facilities: string[];
    phoneVerifiedAt: Date | null;
    feeItemCount: number;
  };
  suggestedSlug: string;
};

function parseHttpUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function parseHoursFromForm(formData: FormData): ClinicHourRow[] {
  const rows: ClinicHourRow[] = [];
  for (let day = 0; day <= 6; day += 1) {
    const closed =
      formData.get(`hoursClosed_${day}`) === "on" ||
      formData.get(`hoursClosed_${day}`) === "true";
    const open = String(formData.get(`hoursOpen_${day}`) ?? "09:00").trim();
    const close = String(formData.get(`hoursClose_${day}`) ?? "18:00").trim();
    rows.push({
      dayOfWeek: day,
      open: TIME_RE.test(open) ? open : "09:00",
      close: TIME_RE.test(close) ? close : "18:00",
      closed,
    });
  }
  return rows;
}

export async function getOnboardingState(): Promise<OnboardingState | null> {
  const session = await requireSessionUser();
  if (!can(session, "clinic.manage")) return null;

  const clinic = await prisma.clinic.findUniqueOrThrow({
    where: { id: session.clinicId },
    select: {
      id: true,
      name: true,
      phone: true,
      slug: true,
      description: true,
      isPublicListed: true,
      bookingEnabled: true,
      city: true,
      specialties: true,
      onboardingCompletedAt: true,
      onboardingSkippedAt: true,
      clinicType: true,
      logoUrl: true,
      clinicHours: true,
      website: true,
      mapsUrl: true,
      landmark: true,
      timezone: true,
      plan: true,
      subscriptionStatus: true,
      addressLine1: true,
      addressLine2: true,
      area: true,
      state: true,
      pincode: true,
      latitude: true,
      longitude: true,
      gstin: true,
      pan: true,
      businessEntity: true,
      languages: true,
      facilities: true,
      phoneVerifiedAt: true,
      _count: { select: { feeItems: true } },
    },
  });

  const taken = new Set(
    (
      await prisma.clinic.findMany({
        where: {
          slug: { startsWith: slugify(clinic.name) || "clinic" },
          NOT: { id: clinic.id },
        },
        select: { slug: true },
      })
    )
      .map((c) => c.slug)
      .filter(Boolean) as string[],
  );

  const hours = parseClinicHours(clinic.clinicHours);
  const { _count, businessEntity, ...clinicRest } = clinic;
  return {
    clinic: {
      ...clinicRest,
      businessEntity: businessEntity,
      clinicHours: hours.length ? hours : DEFAULT_CLINIC_HOURS,
      feeItemCount: _count.feeItems,
    },
    suggestedSlug: clinic.slug || ensureUniqueSlug(clinic.name, taken),
  };
}

export async function saveOnboardingIdentity(
  formData: FormData,
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "clinic.manage")) return permissionDenied();

  const clinicTypeRaw = String(formData.get("clinicType") ?? "solo").trim();
  if (!clinicTypeSet.has(clinicTypeRaw)) {
    return { success: false, error: "Select a valid clinic type." };
  }
  const clinicType = clinicTypeRaw as ClinicTypeValue;

  const timezone = resolveClinicTimezone(
    String(formData.get("timezone") ?? ""),
  );

  await prisma.clinic.update({
    where: { id: session.clinicId },
    data: {
      clinicType: clinicType as ClinicType,
      timezone,
      cancelCutoffHours: cancelCutoffForClinicType(clinicType),
    },
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "clinic",
    resourceId: session.clinicId,
    metadata: { onboarding: "identity", clinicType, timezone },
  });

  revalidatePath("/onboarding");
  revalidatePath("/settings/clinic");
  revalidateTag("clinic-profile");
  revalidateTag("clinic-name");
  revalidateTag("clinic-dashboard");
  return { success: true };
}

export async function uploadClinicLogo(input: {
  fileName: string;
  mimeType: string;
  base64: string;
}): Promise<ActionResult<{ logoUrl: string }>> {
  const session = await requireSessionUser();
  if (!can(session, "clinic.manage")) return permissionDenied();

  if (!ALLOWED_LOGO_TYPES.has(input.mimeType)) {
    return { success: false, error: "Use PNG, JPEG, WebP, or SVG." };
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(input.base64, "base64");
  } catch {
    return { success: false, error: "Invalid image data." };
  }
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_LOGO_BYTES) {
    return { success: false, error: "Logo must be under 2 MB." };
  }

  const ext =
    input.mimeType === "image/png"
      ? "png"
      : input.mimeType === "image/webp"
        ? "webp"
        : input.mimeType === "image/svg+xml"
          ? "svg"
          : "jpg";
  const filePath = `${session.clinicId}/${randomUUID()}.${ext}`;
  const admin = createAdminClient();

  const bucket = await ensureClinicLogosBucket(admin);
  if (!bucket.ok) {
    return { success: false, error: bucket.error };
  }

  let { error: uploadError } = await admin.storage
    .from(LOGO_BUCKET)
    .upload(filePath, buffer, {
      contentType: input.mimeType,
      upsert: true,
    });

  // Retry once if the bucket was created concurrently / race with first check.
  if (uploadError && /bucket not found/i.test(uploadError.message)) {
    const retryBucket = await ensureClinicLogosBucket(admin);
    if (!retryBucket.ok) {
      return { success: false, error: retryBucket.error };
    }
    ({ error: uploadError } = await admin.storage
      .from(LOGO_BUCKET)
      .upload(filePath, buffer, {
        contentType: input.mimeType,
        upsert: true,
      }));
  }

  if (uploadError) {
    logger.error("clinic_logo_upload_failed", {
      clinicId: session.clinicId,
      error: uploadError.message,
    });
    return {
      success: false,
      error:
        uploadError.message.includes("Bucket not found")
          ? "Storage bucket clinic-logos is missing. Create a public bucket named clinic-logos in Supabase → Storage, then try again."
          : "Logo upload failed. Check Supabase Storage (clinic-logos bucket) and try again.",
    };
  }

  const { data } = admin.storage.from(LOGO_BUCKET).getPublicUrl(filePath);
  const logoUrl = data.publicUrl;

  await prisma.clinic.update({
    where: { id: session.clinicId },
    data: { logoUrl },
  });

  revalidatePath("/onboarding");
  revalidatePath("/settings/clinic");
  revalidatePath("/clinics");
  revalidateTag("clinic-profile");
  revalidateTag("clinic-name");
  revalidateTag("clinic-dashboard");
  return { success: true, data: { logoUrl } };
}

export async function clearClinicLogo(): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "clinic.manage")) return permissionDenied();

  await prisma.clinic.update({
    where: { id: session.clinicId },
    data: { logoUrl: null },
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "clinic",
    resourceId: session.clinicId,
    metadata: { logoCleared: true },
  });

  revalidatePath("/onboarding");
  revalidatePath("/settings/clinic");
  revalidatePath("/clinics");
  revalidateTag("clinic-profile");
  revalidateTag("clinic-name");
  revalidateTag("clinic-dashboard");
  return { success: true };
}

export async function saveOnboardingPublicProfile(
  formData: FormData,
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "clinic.manage")) return permissionDenied();

  const description = String(formData.get("description") ?? "").trim() || null;
  const landmark = String(formData.get("landmark") ?? "").trim() || null;
  const websiteRaw = String(formData.get("website") ?? "").trim();
  const mapsRaw = String(formData.get("mapsUrl") ?? "").trim();
  const website = websiteRaw ? parseHttpUrl(websiteRaw) : null;
  const mapsUrl = mapsRaw ? parseHttpUrl(mapsRaw) : null;
  if (websiteRaw && !website) {
    return { success: false, error: "Enter a valid website URL (https://…)." };
  }
  if (mapsRaw && !mapsUrl) {
    return { success: false, error: "Enter a valid maps URL (https://…)." };
  }

  const isPublicListed =
    formData.get("isPublicListed") === "on" ||
    formData.get("isPublicListed") === "true";
  const bookingEnabled =
    formData.get("bookingEnabled") === "on" ||
    formData.get("bookingEnabled") === "true";

  if (isPublicListed) {
    const current = await prisma.clinic.findUniqueOrThrow({
      where: { id: session.clinicId },
      select: { phoneVerifiedAt: true },
    });
    if (!current.phoneVerifiedAt) {
      return {
        success: false,
        error:
          "Verify your clinic phone with OTP before listing publicly.",
      };
    }
  }

  let slug = slugify(String(formData.get("slug") ?? "").trim());
  if (isPublicListed && !slug) {
    const clinic = await prisma.clinic.findUniqueOrThrow({
      where: { id: session.clinicId },
      select: { name: true },
    });
    slug = slugify(clinic.name) || `clinic-${session.clinicId.slice(0, 8)}`;
  }

  if (slug) {
    const conflict = await prisma.clinic.findFirst({
      where: { slug, NOT: { id: session.clinicId } },
      select: { id: true },
    });
    if (conflict) {
      const taken = new Set(
        (
          await prisma.clinic.findMany({
            where: { slug: { startsWith: slug } },
            select: { slug: true },
          })
        )
          .map((c) => c.slug)
          .filter(Boolean) as string[],
      );
      slug = ensureUniqueSlug(slug, taken);
    }
  }

  const clinicHours = parseHoursFromForm(formData);

  await prisma.clinic.update({
    where: { id: session.clinicId },
    data: {
      slug: isPublicListed ? slug : slug || null,
      isPublicListed,
      bookingEnabled,
      description,
      landmark,
      website,
      mapsUrl,
      clinicHours,
    },
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "clinic",
    resourceId: session.clinicId,
    metadata: { onboarding: "public_profile", publicListing: isPublicListed, slug },
  });

  revalidatePath("/onboarding");
  revalidatePath("/settings/availability");
  revalidatePath("/clinics");
  if (slug) revalidatePath(`/clinics/${slug}`);
  return { success: true };
}

export async function completeOnboarding(): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "clinic.manage")) return permissionDenied();

  await prisma.clinic.update({
    where: { id: session.clinicId },
    data: {
      onboardingCompletedAt: new Date(),
      onboardingSkippedAt: null,
    },
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "clinic",
    resourceId: session.clinicId,
    metadata: { onboarding: "completed" },
  });

  revalidateTag("clinic-dashboard");
  revalidatePath("/onboarding");
  revalidatePath("/queue");
  return { success: true };
}

export async function skipOnboarding(): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "clinic.manage")) return permissionDenied();

  await prisma.clinic.update({
    where: { id: session.clinicId },
    data: {
      onboardingSkippedAt: new Date(),
    },
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "clinic",
    resourceId: session.clinicId,
    metadata: { onboarding: "skipped" },
  });

  revalidateTag("clinic-dashboard");
  revalidatePath("/onboarding");
  revalidatePath("/queue");
  return { success: true };
}

export async function getClinicOnboardingBanner() {
  const session = await requireSessionUser();
  if (!can(session, "clinic.manage")) return null;

  const clinic = await prisma.clinic.findUnique({
    where: { id: session.clinicId },
    select: {
      onboardingCompletedAt: true,
      onboardingSkippedAt: true,
      slug: true,
      isPublicListed: true,
    },
  });
  if (!clinic || clinic.onboardingCompletedAt) return null;

  return {
    skipped: Boolean(clinic.onboardingSkippedAt),
    slug: clinic.slug,
    isPublicListed: clinic.isPublicListed,
  };
}

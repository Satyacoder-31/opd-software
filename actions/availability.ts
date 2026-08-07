"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { permissionDenied, requireSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/rbac";
import { parseLocalDateInput } from "@/lib/date-utils";
import { bookableClinicianWhere } from "@/lib/bookable-clinicians";
import { ensureUniqueSlug, slugify } from "@/lib/slug";
import type { ActionResult, VoidActionResult } from "@/lib/types";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function parseDayOfWeek(value: FormDataEntryValue | null): number | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 6) return null;
  return n;
}

export async function updateClinicPublicListing(
  formData: FormData,
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "clinic.manage")) return permissionDenied();

  const description = String(formData.get("description") ?? "").trim() || null;
  const city = String(formData.get("city") ?? "").trim() || null;
  const specialties = formData
    .getAll("specialties")
    .map((value) => String(value).trim())
    .filter(Boolean)
    .slice(0, 30);
  const isPublicListed =
    formData.get("isPublicListed") === "on" ||
    formData.get("isPublicListed") === "true";
  const bookingEnabled =
    formData.get("bookingEnabled") === "on" ||
    formData.get("bookingEnabled") === "true";
  const cancelCutoffHours = Math.min(
    72,
    Math.max(0, Number(formData.get("cancelCutoffHours") ?? 2) || 2),
  );

  if (isPublicListed) {
    const current = await prisma.clinic.findUniqueOrThrow({
      where: { id: session.clinicId },
      select: { phoneVerifiedAt: true },
    });
    if (!current.phoneVerifiedAt) {
      return {
        success: false,
        error:
          "Verify your clinic phone before listing publicly. Use the phone verification step in onboarding or settings.",
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

  await prisma.clinic.update({
    where: { id: session.clinicId },
    data: {
      // Keep a slug whenever listed; clear only when unlisting and no slug left
      slug: isPublicListed ? slug : slug || null,
      isPublicListed,
      bookingEnabled,
      description,
      city,
      specialties,
      cancelCutoffHours,
    },
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "clinic",
    resourceId: session.clinicId,
    metadata: { publicListing: isPublicListed, slug },
  });

  revalidatePath("/settings/availability");
  revalidatePath("/settings/availability/listing");
  revalidatePath("/settings/availability/listing/edit");
  revalidatePath("/settings/clinic");
  revalidatePath("/clinics");
  if (slug) revalidatePath(`/clinics/${slug}`);
  return { success: true };
}

export async function upsertDoctorAvailability(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSessionUser();
  if (!can(session, "appointments.schedule") && !can(session, "clinic.manage")) {
    return permissionDenied();
  }

  const doctorId = String(formData.get("doctorId") ?? "").trim();
  const dayOfWeek = parseDayOfWeek(formData.get("dayOfWeek"));
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const slotDuration = Math.min(120, Math.max(5, Number(formData.get("slotDuration") ?? 15) || 15));
  const maxPerSlot = Math.min(20, Math.max(1, Number(formData.get("maxPerSlot") ?? 1) || 1));

  if (!doctorId || dayOfWeek == null) {
    return { success: false, error: "Doctor and day are required." };
  }
  if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime) || startTime >= endTime) {
    return { success: false, error: "Enter a valid start and end time (HH:mm)." };
  }

  const doctor = await prisma.user.findFirst({
    where: {
      id: doctorId,
      ...bookableClinicianWhere(session.clinicId),
    },
    select: { id: true },
  });
  if (!doctor) return { success: false, error: "Doctor not found." };
  if (session.role === "doctor" && session.userId !== doctorId) {
    return permissionDenied();
  }

  const row = await prisma.doctorAvailability.upsert({
    where: {
      doctorId_dayOfWeek_startTime: { doctorId, dayOfWeek, startTime },
    },
    create: {
      clinicId: session.clinicId,
      doctorId,
      dayOfWeek,
      startTime,
      endTime,
      slotDuration,
      maxPerSlot,
      isActive: true,
    },
    update: {
      endTime,
      slotDuration,
      maxPerSlot,
      isActive: true,
    },
  });

  revalidatePath("/settings/availability/schedules");
  revalidatePath("/settings/availability/schedules/edit");
  return { success: true, data: { id: row.id } };
}

export async function deleteDoctorAvailability(id: string): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "appointments.schedule") && !can(session, "clinic.manage")) {
    return permissionDenied();
  }

  const row = await prisma.doctorAvailability.findFirst({
    where: { id, clinicId: session.clinicId },
    select: { id: true, doctorId: true },
  });
  if (!row) return { success: false, error: "Schedule block not found." };
  if (session.role === "doctor" && session.userId !== row.doctorId) {
    return permissionDenied();
  }

  await prisma.doctorAvailability.delete({ where: { id } });
  revalidatePath("/settings/availability/schedules");
  revalidatePath("/settings/availability/schedules/edit");
  return { success: true };
}

export async function addDoctorLeave(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const session = await requireSessionUser();
  if (!can(session, "appointments.schedule") && !can(session, "clinic.manage")) {
    return permissionDenied();
  }

  const doctorId = String(formData.get("doctorId") ?? "").trim();
  const date = parseLocalDateInput(String(formData.get("date") ?? ""));
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!doctorId || !date) {
    return { success: false, error: "Doctor and date are required." };
  }
  if (session.role === "doctor" && session.userId !== doctorId) {
    return permissionDenied();
  }

  const doctor = await prisma.user.findFirst({
    where: {
      id: doctorId,
      ...bookableClinicianWhere(session.clinicId),
    },
    select: { id: true },
  });
  if (!doctor) return { success: false, error: "Doctor not found." };

  const row = await prisma.doctorLeave.upsert({
    where: { doctorId_date: { doctorId, date } },
    create: {
      clinicId: session.clinicId,
      doctorId,
      date,
      reason,
    },
    update: { reason },
  });

  revalidatePath("/settings/availability/schedules");
  revalidatePath("/settings/availability/schedules/edit");
  return { success: true, data: { id: row.id } };
}

export async function removeDoctorLeave(id: string): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "appointments.schedule") && !can(session, "clinic.manage")) {
    return permissionDenied();
  }

  const row = await prisma.doctorLeave.findFirst({
    where: { id, clinicId: session.clinicId },
    select: { id: true, doctorId: true },
  });
  if (!row) return { success: false, error: "Leave day not found." };
  if (session.role === "doctor" && session.userId !== row.doctorId) {
    return permissionDenied();
  }

  await prisma.doctorLeave.delete({ where: { id } });
  revalidatePath("/settings/availability/schedules");
  revalidatePath("/settings/availability/schedules/edit");
  return { success: true };
}

export async function getClinicPublicListingSettings() {
  const session = await requireSessionUser();
  if (!can(session, "clinic.manage") && !can(session, "settings.access")) {
    return null;
  }
  return prisma.clinic.findUnique({
    where: { id: session.clinicId },
    select: {
      slug: true,
      isPublicListed: true,
      bookingEnabled: true,
      description: true,
      city: true,
      state: true,
      specialties: true,
      cancelCutoffHours: true,
      plan: true,
      name: true,
      phone: true,
      phoneVerifiedAt: true,
      languages: true,
      facilities: true,
    },
  });
}

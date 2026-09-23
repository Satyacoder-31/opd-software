"use server";

import { revalidatePath } from "next/cache";
import {
  AppointmentStatus,
  AppointmentType,
  BookingSource,
  Gender,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sendClinicNotification } from "@/lib/integrations/messaging";
import { planAllows } from "@/lib/plan-features";
import {
  clearPortalSession,
  hashOtp,
  normalizePhone,
  readPortalSession,
  writePortalSession,
} from "@/lib/portal-session";
import { generateDaySlots } from "@/lib/slots";
import { ensureDemoPatient } from "@/lib/demo-accounts";
import { bookableClinicianWhere } from "@/lib/bookable-clinicians";
import {
  ageFromDob,
  clinicTodayDate,
  parseLocalDateInput,
} from "@/lib/date-utils";
import type { ActionResult } from "@/lib/types";
import { randomInt } from "crypto";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_TOKEN_RETRIES = 5;
const ACTIVE_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.waiting,
  AppointmentStatus.in_progress,
];

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}

function dateOnly(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function generateMrn(clinicId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.patient.count({ where: { clinicId } });
  return `MRN-${year}-${String(count + 1).padStart(4, "0")}`;
}

/** Ensure portal account is linked to a clinic Patient record (create if needed). */
async function ensureClinicPatient(args: {
  portalAccountId: string;
  clinicId: string;
  name: string;
  phone: string;
  age?: number | null;
  dateOfBirth?: Date | null;
  gender?: Gender | null;
}) {
  const demographics = {
    ...(args.age != null ? { age: args.age } : {}),
    ...(args.dateOfBirth !== undefined
      ? { dateOfBirth: args.dateOfBirth }
      : {}),
    ...(args.gender ? { gender: args.gender } : {}),
  };

  const existing = await prisma.clinicPatient.findUnique({
    where: {
      portalAccountId_clinicId: {
        portalAccountId: args.portalAccountId,
        clinicId: args.clinicId,
      },
    },
    include: { patient: true },
  });
  if (existing) {
    if (Object.keys(demographics).length || args.name !== existing.patient.name) {
      return prisma.patient.update({
        where: { id: existing.patient.id },
        data: {
          ...demographics,
          ...(args.name.trim().length >= 2 ? { name: args.name.trim() } : {}),
        },
      });
    }
    return existing.patient;
  }

  const byPhone = await prisma.patient.findFirst({
    where: {
      clinicId: args.clinicId,
      phone: { contains: normalizePhone(args.phone) },
    },
  });

  if (byPhone) {
    await prisma.clinicPatient.upsert({
      where: { patientId: byPhone.id },
      create: {
        portalAccountId: args.portalAccountId,
        clinicId: args.clinicId,
        patientId: byPhone.id,
      },
      update: { portalAccountId: args.portalAccountId },
    });
    return prisma.patient.update({
      where: { id: byPhone.id },
      data: {
        ...demographics,
        ...(args.name.trim().length >= 2 && !byPhone.name
          ? { name: args.name.trim() }
          : {}),
      },
    });
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const mrn = await generateMrn(args.clinicId);
    try {
      const patient = await prisma.patient.create({
        data: {
          clinicId: args.clinicId,
          name: args.name,
          phone: normalizePhone(args.phone),
          mrn,
          ...demographics,
        },
      });
      await prisma.clinicPatient.create({
        data: {
          portalAccountId: args.portalAccountId,
          clinicId: args.clinicId,
          patientId: patient.id,
        },
      });
      return patient;
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
    }
  }
  throw new Error("Could not create patient record.");
}

export async function requestPortalOtp(
  phone: string,
): Promise<ActionResult<{ expiresInMinutes: number; developmentCode?: string }>> {
  const normalized = normalizePhone(phone);
  if (normalized.length < 10) {
    return { success: false, error: "Enter a valid 10-digit phone number." };
  }

  const account = await prisma.portalAccount.upsert({
    where: { phone: normalized },
    create: { phone: normalized },
    update: {},
  });

  // Link any existing clinic patients with this phone
  const patients = await prisma.patient.findMany({
    where: { phone: { contains: normalized } },
    select: { id: true, clinicId: true, name: true },
    take: 20,
  });
  for (const patient of patients) {
    await prisma.clinicPatient.upsert({
      where: { patientId: patient.id },
      create: {
        portalAccountId: account.id,
        clinicId: patient.clinicId,
        patientId: patient.id,
      },
      update: {},
    });
    if (!account.name && patient.name) {
      await prisma.portalAccount.update({
        where: { id: account.id },
        data: { name: patient.name },
      });
    }
  }

  const code = String(randomInt(100000, 1000000));
  await prisma.$transaction([
    prisma.portalOtp.updateMany({
      where: { portalAccountId: account.id, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    prisma.portalOtp.create({
      data: {
        portalAccountId: account.id,
        phone: normalized,
        codeHash: hashOtp(code),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    }),
  ]);

  // Prefer messaging via first linked Pro clinic; else dry-run / return dev code
  const link = await prisma.clinicPatient.findFirst({
    where: { portalAccountId: account.id },
    include: { clinic: { select: { id: true, name: true, plan: true } }, patient: true },
  });
  if (link && planAllows(link.clinic.plan, "messaging")) {
    await sendClinicNotification({
      clinicId: link.clinic.id,
      clinicPlan: link.clinic.plan,
      patientId: link.patientId,
      phone: normalized,
      templateKey: "portal_otp",
      vars: {
        patientName: link.patient.name || "Patient",
        code,
        clinicName: link.clinic.name,
      },
    });
  }

  return {
    success: true,
    data: {
      expiresInMinutes: 10,
      ...(process.env.NODE_ENV !== "production" ? { developmentCode: code } : {}),
    },
  };
}

export async function verifyPortalOtp(
  phone: string,
  code: string,
): Promise<ActionResult<{ portalAccountId: string }>> {
  const normalized = normalizePhone(phone);
  const otp = await prisma.portalOtp.findFirst({
    where: {
      phone: { contains: normalized },
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || hashOtp(code.trim()) !== otp.codeHash) {
    return { success: false, error: "The OTP is invalid or has expired." };
  }

  let portalAccountId = otp.portalAccountId;
  if (!portalAccountId) {
    const account = await prisma.portalAccount.upsert({
      where: { phone: normalized },
      create: { phone: normalized },
      update: {},
    });
    portalAccountId = account.id;
  }

  await prisma.portalOtp.update({
    where: { id: otp.id },
    data: { consumedAt: new Date(), portalAccountId },
  });

  await writePortalSession({ portalAccountId });
  return { success: true, data: { portalAccountId } };
}

export async function oneTapPatientLogin(
  phone: string
): Promise<ActionResult<{ portalAccountId: string; redirectTo: string }>> {
  try {
    const { portalAccountId } = await ensureDemoPatient(phone);
    await writePortalSession({ portalAccountId });
    revalidatePath("/portal", "layout");
    return { success: true, data: { portalAccountId, redirectTo: "/portal" } };
  } catch (err) {
    logger.error("one_tap_patient_login_failed", {
      phone,
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to sign in as patient.",
    };
  }
}

export async function logoutPortal() {
  await clearPortalSession();
}

export async function getPortalSessionAccount() {
  const session = await readPortalSession();
  if (!session) return null;
  return prisma.portalAccount.findUnique({
    where: { id: session.portalAccountId },
    select: {
      id: true,
      phone: true,
      name: true,
      email: true,
      clinicLinks: {
        select: {
          clinicId: true,
          patientId: true,
          clinic: {
            select: {
              id: true,
              name: true,
              slug: true,
              city: true,
              plan: true,
            },
          },
          patient: {
            select: { id: true, name: true, mrn: true },
          },
        },
      },
    },
  });
}

export async function updatePortalProfile(formData: FormData): Promise<ActionResult<{ ok: true }>> {
  const session = await readPortalSession();
  if (!session) return { success: false, error: "Sign in to continue." };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  if (name.length < 2) return { success: false, error: "Enter your full name." };

  await prisma.portalAccount.update({
    where: { id: session.portalAccountId },
    data: { name, email },
  });
  return { success: true, data: { ok: true } };
}

export async function getPortalPatientData() {
  const account = await getPortalSessionAccount();
  if (!account) return null;

  const patientIds = account.clinicLinks.map((l) => l.patientId);
  if (!patientIds.length) {
    return {
      account,
      appointments: [] as Awaited<ReturnType<typeof loadPortalAppointments>>,
    };
  }

  const appointments = await loadPortalAppointments(patientIds);
  return { account, appointments };
}

async function loadPortalAppointments(patientIds: string[]) {
  return prisma.appointment.findMany({
    where: { patientId: { in: patientIds } },
    orderBy: [{ scheduledAt: "desc" }, { queueDate: "desc" }],
    take: 40,
    select: {
      id: true,
      queueDate: true,
      scheduledAt: true,
      slotEnd: true,
      status: true,
      type: true,
      bookingSource: true,
      reasonForVisit: true,
      tokenNumber: true,
      clinic: { select: { id: true, name: true, slug: true, logoUrl: true, cancelCutoffHours: true } },
      doctor: { select: { id: true, name: true, specialty: true } },
      patient: { select: { id: true, name: true, mrn: true } },
      consultation: {
        select: {
          id: true,
          diagnosis: true,
          prescription: {
            select: { id: true, medicines: true, advice: true, followUp: true },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              amount: true,
              amountPaid: true,
              status: true,
            },
          },
        },
      },
    },
  });
}

export async function bookPortalAppointment(input: {
  clinicSlug: string;
  doctorId: string;
  slotStartIso: string;
  reasonForVisit?: string;
  patientName?: string;
  age?: number | string;
  dateOfBirth?: string;
  gender?: string;
}): Promise<ActionResult<{ id: string; tokenNumber: number }>> {
  const session = await readPortalSession();
  if (!session) return { success: false, error: "Sign in to book an appointment." };

  const account = await prisma.portalAccount.findUnique({
    where: { id: session.portalAccountId },
  });
  if (!account) return { success: false, error: "Session expired. Sign in again." };

  const name =
    (input.patientName?.trim() || account.name || "").trim();
  if (name.length < 2) {
    return { success: false, error: "Enter your name before booking." };
  }

  const genderRaw = (input.gender ?? "").trim().toLowerCase();
  if (
    genderRaw !== Gender.male &&
    genderRaw !== Gender.female &&
    genderRaw !== Gender.other
  ) {
    return { success: false, error: "Select your gender." };
  }
  const gender = genderRaw as Gender;

  const dobInput = input.dateOfBirth?.trim() || "";
  const dateOfBirth = dobInput ? parseLocalDateInput(dobInput) : null;
  if (dobInput && !dateOfBirth) {
    return { success: false, error: "Enter a valid date of birth." };
  }

  let age: number | null = null;
  if (dateOfBirth) {
    age = ageFromDob(dateOfBirth);
  } else if (input.age !== undefined && String(input.age).trim() !== "") {
    const parsedAge = Number(input.age);
    if (!Number.isInteger(parsedAge) || parsedAge < 0 || parsedAge > 150) {
      return { success: false, error: "Enter a valid age in years." };
    }
    age = parsedAge;
  } else {
    return { success: false, error: "Enter your age or date of birth." };
  }

  const clinic = await prisma.clinic.findFirst({
    where: { slug: input.clinicSlug, isPublicListed: true, bookingEnabled: true },
    select: {
      id: true,
      name: true,
      plan: true,
      cancelCutoffHours: true,
      timezone: true,
    },
  });
  if (!clinic) {
    return { success: false, error: "This clinic is not accepting online bookings." };
  }

  const doctor = await prisma.user.findFirst({
    where: {
      id: input.doctorId,
      ...bookableClinicianWhere(clinic.id),
    },
    select: {
      id: true,
      name: true,
      availabilities: { where: { isActive: true } },
    },
  });
  if (!doctor) return { success: false, error: "Selected doctor is not available." };

  const scheduledAt = new Date(input.slotStartIso);
  if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
    return { success: false, error: "Choose a future time slot." };
  }

  const queueDate = dateOnly(scheduledAt);
  const leave = await prisma.doctorLeave.findUnique({
    where: { doctorId_date: { doctorId: doctor.id, date: queueDate } },
  });
  if (leave) {
    return { success: false, error: "The doctor is on leave that day." };
  }

  const candidates = generateDaySlots({
    date: queueDate,
    windows: doctor.availabilities,
    onLeave: false,
    timeZone: clinic.timezone || "Asia/Kolkata",
  });
  const match = candidates.find((s) => s.start.getTime() === scheduledAt.getTime());
  if (!match) {
    return { success: false, error: "That slot is no longer offered." };
  }

  if (!account.name) {
    await prisma.portalAccount.update({
      where: { id: account.id },
      data: { name },
    });
  }

  const patient = await ensureClinicPatient({
    portalAccountId: account.id,
    clinicId: clinic.id,
    name,
    phone: account.phone,
    age,
    dateOfBirth,
    gender,
  });

  const maxPerSlot = Math.max(
    ...doctor.availabilities
      .filter((w) => w.dayOfWeek === queueDate.getDay())
      .map((w) => w.maxPerSlot),
    1,
  );

  for (let attempt = 0; attempt < MAX_TOKEN_RETRIES; attempt++) {
    try {
      const appointment = await prisma.$transaction(async (tx) => {
        // Lock conflicting rows for this doctor/day
        await tx.$queryRaw`
          SELECT id FROM "Appointment"
          WHERE "doctorId" = ${doctor.id}
            AND "scheduledAt" = ${scheduledAt}
            AND "status" NOT IN ('cancelled', 'no_show')
          FOR UPDATE
        `;

        const occupied = await tx.appointment.count({
          where: {
            doctorId: doctor.id,
            scheduledAt,
            status: { notIn: [AppointmentStatus.cancelled, AppointmentStatus.no_show] },
          },
        });
        if (occupied >= maxPerSlot) {
          return { conflict: true as const };
        }

        const alreadyQueued = await tx.appointment.findFirst({
          where: {
            clinicId: clinic.id,
            patientId: patient.id,
            queueDate,
            status: { in: ACTIVE_STATUSES },
          },
          select: { id: true },
        });
        if (alreadyQueued) {
          return { alreadyQueued: true as const };
        }

        const last = await tx.appointment.findFirst({
          where: { clinicId: clinic.id, queueDate },
          orderBy: { tokenNumber: "desc" },
          select: { tokenNumber: true },
        });
        const tokenNumber = (last?.tokenNumber ?? 0) + 1;

        const created = await tx.appointment.create({
          data: {
            clinicId: clinic.id,
            patientId: patient.id,
            doctorId: doctor.id,
            tokenNumber,
            queueDate,
            type: AppointmentType.scheduled,
            bookingSource: BookingSource.portal,
            scheduledAt,
            slotEnd: match.end,
            reasonForVisit: input.reasonForVisit?.trim() || null,
            createdById: null,
            status: AppointmentStatus.waiting,
          },
        });
        return { created };
      });

      if ("conflict" in appointment && appointment.conflict) {
        return { success: false, error: "That slot was just taken. Pick another time." };
      }
      if ("alreadyQueued" in appointment && appointment.alreadyQueued) {
        return {
          success: false,
          error: "You already have an appointment at this clinic on that day.",
        };
      }
      if (!("created" in appointment) || !appointment.created) {
        return { success: false, error: "Could not complete booking." };
      }

      try {
        await sendClinicNotification({
          clinicId: clinic.id,
          clinicPlan: clinic.plan,
          patientId: patient.id,
          phone: account.phone,
          templateKey: "appointment_booked",
          vars: {
            patientName: patient.name,
            when: scheduledAt.toLocaleString("en-IN"),
            clinicName: clinic.name,
          },
        });
      } catch (error) {
        logger.warn("portal_booking_notification_failed", {
          appointmentId: appointment.created.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      revalidatePath("/portal");
      revalidatePath(`/clinics/${input.clinicSlug}`);
      return {
        success: true,
        data: {
          id: appointment.created.id,
          tokenNumber: appointment.created.tokenNumber,
        },
      };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return { success: false, error: "That slot was just taken. Pick another time." };
      }
      if (attempt === MAX_TOKEN_RETRIES - 1) throw error;
    }
  }

  return { success: false, error: "Could not complete booking. Try again." };
}

export async function cancelPortalAppointment(
  appointmentId: string,
): Promise<ActionResult<{ ok: true }>> {
  const session = await readPortalSession();
  if (!session) return { success: false, error: "Sign in to continue." };

  const links = await prisma.clinicPatient.findMany({
    where: { portalAccountId: session.portalAccountId },
    select: { patientId: true },
  });
  const patientIds = links.map((l) => l.patientId);

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, patientId: { in: patientIds } },
    include: { clinic: { select: { cancelCutoffHours: true, slug: true } } },
  });
  if (!appointment) return { success: false, error: "Appointment not found." };
  if (
    appointment.status === AppointmentStatus.cancelled ||
    appointment.status === AppointmentStatus.done ||
    appointment.status === AppointmentStatus.in_progress
  ) {
    return { success: false, error: "This appointment can no longer be cancelled." };
  }

  const start = appointment.scheduledAt ?? appointment.queueDate;
  const cutoffMs = appointment.clinic.cancelCutoffHours * 60 * 60 * 1000;
  if (start.getTime() - Date.now() < cutoffMs) {
    return {
      success: false,
      error: `Cancellations close ${appointment.clinic.cancelCutoffHours} hour(s) before the visit.`,
    };
  }

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: AppointmentStatus.cancelled },
  });

  revalidatePath("/portal");
  if (appointment.clinic.slug) revalidatePath(`/clinics/${appointment.clinic.slug}`);
  return { success: true, data: { ok: true } };
}

export async function reschedulePortalAppointment(input: {
  appointmentId: string;
  slotStartIso: string;
}): Promise<ActionResult<{ id: string; tokenNumber: number }>> {
  const session = await readPortalSession();
  if (!session) return { success: false, error: "Sign in to continue." };

  const links = await prisma.clinicPatient.findMany({
    where: { portalAccountId: session.portalAccountId },
    select: { patientId: true },
  });
  const patientIds = links.map((l) => l.patientId);

  const existing = await prisma.appointment.findFirst({
    where: { id: input.appointmentId, patientId: { in: patientIds } },
    include: {
      clinic: {
        select: {
          id: true,
          name: true,
          plan: true,
          slug: true,
          cancelCutoffHours: true,
          timezone: true,
        },
      },
      doctor: {
        select: {
          id: true,
          availabilities: { where: { isActive: true } },
        },
      },
    },
  });
  if (!existing?.doctorId || !existing.doctor) {
    return { success: false, error: "Only doctor-assigned appointments can be rescheduled online." };
  }
  if (
    existing.status === AppointmentStatus.cancelled ||
    existing.status === AppointmentStatus.done ||
    existing.status === AppointmentStatus.in_progress
  ) {
    return { success: false, error: "This appointment can no longer be rescheduled." };
  }

  const oldStart = existing.scheduledAt ?? existing.queueDate;
  const cutoffMs = existing.clinic.cancelCutoffHours * 60 * 60 * 1000;
  if (oldStart.getTime() - Date.now() < cutoffMs) {
    return {
      success: false,
      error: `Rescheduling closes ${existing.clinic.cancelCutoffHours} hour(s) before the visit.`,
    };
  }

  const scheduledAt = new Date(input.slotStartIso);
  if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
    return { success: false, error: "Choose a future time slot." };
  }

  const queueDate = dateOnly(scheduledAt);
  const leave = await prisma.doctorLeave.findUnique({
    where: { doctorId_date: { doctorId: existing.doctorId, date: queueDate } },
  });
  if (leave) return { success: false, error: "The doctor is on leave that day." };

  const candidates = generateDaySlots({
    date: queueDate,
    windows: existing.doctor.availabilities,
    onLeave: false,
    timeZone: existing.clinic.timezone || "Asia/Kolkata",
  });
  const match = candidates.find((s) => s.start.getTime() === scheduledAt.getTime());
  if (!match) return { success: false, error: "That slot is no longer offered." };

  const maxPerSlot = Math.max(
    ...existing.doctor.availabilities
      .filter((w) => w.dayOfWeek === queueDate.getDay())
      .map((w) => w.maxPerSlot),
    1,
  );

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id FROM "Appointment"
        WHERE "doctorId" = ${existing.doctorId}
          AND "scheduledAt" = ${scheduledAt}
          AND "status" NOT IN ('cancelled', 'no_show')
          AND id <> ${existing.id}
        FOR UPDATE
      `;

      const occupied = await tx.appointment.count({
        where: {
          doctorId: existing.doctorId,
          scheduledAt,
          status: { notIn: [AppointmentStatus.cancelled, AppointmentStatus.no_show] },
          NOT: { id: existing.id },
        },
      });
      if (occupied >= maxPerSlot) return null;

      let tokenNumber = existing.tokenNumber;
      if (queueDate.getTime() !== dateOnly(existing.queueDate).getTime()) {
        const last = await tx.appointment.findFirst({
          where: { clinicId: existing.clinicId, queueDate },
          orderBy: { tokenNumber: "desc" },
          select: { tokenNumber: true },
        });
        tokenNumber = (last?.tokenNumber ?? 0) + 1;
      }

      return tx.appointment.update({
        where: { id: existing.id },
        data: {
          scheduledAt,
          slotEnd: match.end,
          queueDate,
          tokenNumber,
          status: AppointmentStatus.waiting,
        },
      });
    });

    if (!updated) {
      return { success: false, error: "That slot was just taken. Pick another time." };
    }

    revalidatePath("/portal");
    if (existing.clinic.slug) revalidatePath(`/clinics/${existing.clinic.slug}`);
    return {
      success: true,
      data: { id: updated.id, tokenNumber: updated.tokenNumber },
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: "That slot was just taken. Pick another time." };
    }
    throw error;
  }
}

export async function getQueuePosition(appointmentId: string) {
  const session = await readPortalSession();
  if (!session) return null;

  const links = await prisma.clinicPatient.findMany({
    where: { portalAccountId: session.portalAccountId },
    select: { patientId: true },
  });
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      patientId: { in: links.map((l) => l.patientId) },
    },
    select: {
      id: true,
      tokenNumber: true,
      queueDate: true,
      status: true,
      clinicId: true,
      checkedInAt: true,
    },
  });
  if (!appointment) return null;

  const today = clinicTodayDate();
  if (dateOnly(appointment.queueDate).getTime() !== today.getTime()) {
    return {
      appointmentId: appointment.id,
      tokenNumber: appointment.tokenNumber,
      position: null as number | null,
      status: appointment.status,
      isToday: false,
    };
  }

  const ahead = await prisma.appointment.count({
    where: {
      clinicId: appointment.clinicId,
      queueDate: today,
      status: { in: ACTIVE_STATUSES },
      tokenNumber: { lt: appointment.tokenNumber },
    },
  });

  return {
    appointmentId: appointment.id,
    tokenNumber: appointment.tokenNumber,
    position: ahead + 1,
    status: appointment.status,
    isToday: true,
  };
}

/** Re-export slot helper for booking UI when already authenticated. */
export async function previewSlotsForBooking(args: {
  clinicSlug: string;
  doctorId: string;
  date: string;
}) {
  const { getDoctorAvailableSlots } = await import("@/actions/clinics-public");
  return getDoctorAvailableSlots(args);
}

export async function downloadPortalPrescription(
  consultationId: string,
): Promise<ActionResult<{ pdfBase64: string; filename: string }>> {
  const session = await readPortalSession();
  if (!session) return { success: false, error: "Sign in to continue." };

  const links = await prisma.clinicPatient.findMany({
    where: { portalAccountId: session.portalAccountId },
    select: { patientId: true },
  });
  const patientIds = links.map((l) => l.patientId);

  const consultation = await prisma.consultation.findFirst({
    where: {
      id: consultationId,
      patientId: { in: patientIds },
    },
    include: {
      patient: true,
      doctor: true,
      prescription: true,
      clinic: true,
    },
  });

  if (!consultation?.prescription) {
    return { success: false, error: "Prescription not found." };
  }

  const { renderPrescriptionPdf } = await import("@/lib/pdf");
  const { formatPatientAge } = await import("@/lib/date-utils");
  type Medicine = import("@/lib/types").Medicine;

  const medicines = consultation.prescription.medicines as Medicine[];
  const pdfBytes = await renderPrescriptionPdf({
    clinicName: consultation.clinic.name,
    clinicPhone: consultation.clinic.phone,
    clinicAddress: consultation.clinic.address,
    clinicLogoUrl: consultation.clinic.logoUrl,
    doctorName: consultation.doctor.name,
    doctorQualifications: consultation.doctor.qualifications ?? undefined,
    doctorRegistrationNo: consultation.doctor.registrationNo ?? undefined,
    date: consultation.createdAt.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    patientName: consultation.patient.name,
    patientAge: formatPatientAge(consultation.patient),
    patientGender: consultation.patient.gender
      ? consultation.patient.gender.charAt(0).toUpperCase() +
        consultation.patient.gender.slice(1)
      : undefined,
    patientMrn: consultation.patient.mrn,
    patientPhone: consultation.patient.phone,
    diagnosis: consultation.diagnosis ?? "",
    medicines,
    advice: consultation.prescription.advice ?? undefined,
    followUp: consultation.prescription.followUp ?? undefined,
    layout: consultation.clinic.prescriptionLayout,
  });

  return {
    success: true,
    data: {
      pdfBase64: Buffer.from(pdfBytes).toString("base64"),
      filename: `prescription-${consultation.patient.mrn}.pdf`,
    },
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { AppointmentStatus, AppointmentType, BookingSource, Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { permissionDenied, requireSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";
import {
  parseLocalDateTimeInput,
  parseLocalDateInput,
  clinicTodayDate,
} from "@/lib/date-utils";
import {
  appointmentTransitionError,
  canSetAppointmentStatus,
  canTransitionAppointment,
  isFrontDeskOutcome,
} from "@/lib/appointment-transitions";
import { can } from "@/lib/rbac";
import type { ActionResult } from "@/lib/types";
import { sendClinicNotification } from "@/lib/integrations/messaging";

const MAX_TOKEN_RETRIES = 5;

function todayDate(): Date {
  return clinicTodayDate();
}

function dateOnly(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}

export type CreateAppointmentInput = {
  patientId: string;
  type?: AppointmentType;
  scheduledAt?: string | Date | null;
  doctorId?: string | null;
};

export async function createAppointment(
  patientIdOrInput: string | CreateAppointmentInput,
  type: AppointmentType = AppointmentType.walkin,
  scheduledAt?: Date
): Promise<ActionResult<{ id: string; tokenNumber: number }>> {
  const session = await requireSessionUser();

  const input: CreateAppointmentInput =
    typeof patientIdOrInput === "string"
      ? { patientId: patientIdOrInput, type, scheduledAt }
      : patientIdOrInput;

  const appointmentType = input.type ?? AppointmentType.walkin;
  if (appointmentType === AppointmentType.scheduled) {
    if (!can(session, "appointments.schedule") && !can(session, "queue.manage")) {
      return permissionDenied();
    }
  } else if (!can(session, "queue.manage")) {
    return permissionDenied();
  }

  const patient = await prisma.patient.findFirst({
    where: { id: input.patientId, clinicId: session.clinicId },
  });

  if (!patient) {
    return { success: false, error: "Patient not found." };
  }

  let scheduled: Date | undefined;

  if (input.scheduledAt) {
    scheduled =
      typeof input.scheduledAt === "string"
        ? parseLocalDateTimeInput(input.scheduledAt) ?? undefined
        : input.scheduledAt;
    if (!scheduled) {
      return { success: false, error: "Invalid scheduled date/time." };
    }
  }

  if (appointmentType === AppointmentType.scheduled && !scheduled) {
    return { success: false, error: "Scheduled appointments need a date and time." };
  }

  let doctorId: string | undefined;
  if (input.doctorId) {
    const doctor = await prisma.user.findFirst({
      where: {
        id: input.doctorId,
        clinicId: session.clinicId,
        role: Role.doctor,
        isActive: true,
      },
      select: { id: true },
    });
    if (!doctor) {
      return { success: false, error: "Selected doctor is not available." };
    }
    doctorId = doctor.id;
  }

  const queueDate = scheduled ? dateOnly(scheduled) : todayDate();

  for (let attempt = 0; attempt < MAX_TOKEN_RETRIES; attempt++) {
    try {
      const appointment = await prisma.$transaction(async (tx) => {
        const alreadyQueued = await tx.appointment.findFirst({
          where: {
            clinicId: session.clinicId,
            patientId: input.patientId,
            queueDate,
            status: {
              in: [AppointmentStatus.waiting, AppointmentStatus.in_progress],
            },
          },
          select: { id: true },
        });

        if (alreadyQueued) {
          return null;
        }

        const last = await tx.appointment.findFirst({
          where: { clinicId: session.clinicId, queueDate },
          orderBy: { tokenNumber: "desc" },
          select: { tokenNumber: true },
        });
        const tokenNumber = (last?.tokenNumber ?? 0) + 1;

        return tx.appointment.create({
          data: {
            clinicId: session.clinicId,
            patientId: input.patientId,
            tokenNumber,
            queueDate,
            type: appointmentType,
            bookingSource:
              appointmentType === AppointmentType.scheduled
                ? BookingSource.staff
                : BookingSource.walkin,
            scheduledAt: scheduled,
            doctorId,
            createdById: session.userId,
          },
        });
      });

      if (!appointment) {
        return {
          success: false,
          error: "Patient is already in the queue for that day.",
        };
      }

      await logAudit({
        clinicId: session.clinicId,
        actorId: session.userId,
        action: "create",
        resourceType: "appointment",
        resourceId: appointment.id,
        metadata: {
          type: appointmentType,
          scheduledAt: scheduled?.toISOString(),
          doctorId: doctorId ?? null,
        },
      });

      if (appointmentType === AppointmentType.scheduled && scheduled) {
        try {
          const clinic = await prisma.clinic.findUnique({
            where: { id: session.clinicId },
            select: { plan: true, name: true },
          });
          if (clinic) {
            await sendClinicNotification({
              clinicId: session.clinicId,
              clinicPlan: clinic.plan,
              patientId: patient.id,
              phone: patient.phone,
              templateKey: "appointment_booked",
              vars: {
                patientName: patient.name,
                when: scheduled.toLocaleString("en-IN"),
                clinicName: clinic.name,
              },
            });
          }
        } catch (error) {
          logger.warn("appointment_notification_failed", {
            appointmentId: appointment.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      revalidatePath("/queue");
      revalidatePath("/appointments");
      revalidatePath(`/patients/${input.patientId}`);
      return {
        success: true,
        data: { id: appointment.id, tokenNumber: appointment.tokenNumber },
      };
    } catch (error) {
      if (isUniqueConstraintError(error) && attempt < MAX_TOKEN_RETRIES - 1) {
        continue;
      }

      if (isUniqueConstraintError(error)) {
        return {
          success: false,
          error: "Patient is already in the queue for that day.",
        };
      }

      logger.warn("create_appointment_failed", {
        clinicId: session.clinicId,
        attempt,
        error: error instanceof Error ? error.message : String(error),
      });

      return { success: false, error: "Could not add patient to queue. Please try again." };
    }
  }

  return { success: false, error: "Could not add patient to queue. Please try again." };
}

export async function getActiveQueuePatientIds(): Promise<string[]> {
  const session = await requireSessionUser();
  if (!can(session, "queue.read")) return [];

  const queueDate = todayDate();

  const rows = await prisma.appointment.findMany({
    where: {
      clinicId: session.clinicId,
      queueDate,
      status: { in: [AppointmentStatus.waiting, AppointmentStatus.in_progress] },
    },
    select: { patientId: true },
    distinct: ["patientId"],
  });

  return rows.map((row) => row.patientId);
}

export async function isPatientInActiveQueue(
  patientId: string
): Promise<boolean> {
  const session = await requireSessionUser();
  if (!can(session, "queue.read")) return false;

  const queueDate = todayDate();

  const existing = await prisma.appointment.findFirst({
    where: {
      clinicId: session.clinicId,
      patientId,
      queueDate,
      status: { in: [AppointmentStatus.waiting, AppointmentStatus.in_progress] },
    },
    select: { id: true },
  });

  return Boolean(existing);
}

export async function getQueue() {
  const session = await requireSessionUser();
  if (!can(session, "queue.read")) return [];

  const queueDate = todayDate();

  return prisma.appointment.findMany({
    where: {
      clinicId: session.clinicId,
      queueDate,
      status: { in: [AppointmentStatus.waiting, AppointmentStatus.in_progress] },
    },
    orderBy: [{ scheduledAt: "asc" }, { tokenNumber: "asc" }],
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          phone: true,
          mrn: true,
          age: true,
          dateOfBirth: true,
        },
      },
      consultation: {
        select: { id: true, doctor: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function getCompletedQueue() {
  const session = await requireSessionUser();
  if (!can(session, "queue.read")) return [];

  const queueDate = todayDate();

  return prisma.appointment.findMany({
    where: {
      clinicId: session.clinicId,
      queueDate,
      status: AppointmentStatus.done,
    },
    orderBy: { updatedAt: "desc" },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          phone: true,
          mrn: true,
          age: true,
          dateOfBirth: true,
        },
      },
      consultation: {
        select: {
          id: true,
          doctor: { select: { id: true, name: true } },
          invoice: { select: { id: true, status: true } },
        },
      },
    },
  });
}

export async function listClinicDoctors() {
  const session = await requireSessionUser();
  if (!can(session, "queue.read")) return [];

  return prisma.user.findMany({
    where: {
      clinicId: session.clinicId,
      role: Role.doctor,
      isActive: true,
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
  doctorId?: string
): Promise<ActionResult<{ consultationId?: string }>> {
  const session = await requireSessionUser();
  if (!can(session, "queue.manage")) return permissionDenied();

  if (isFrontDeskOutcome(status)) {
    return setAppointmentOutcome(appointmentId, status);
  }

  if (
    status !== AppointmentStatus.waiting &&
    status !== AppointmentStatus.in_progress &&
    status !== AppointmentStatus.done
  ) {
    return { success: false, error: "Invalid appointment status." };
  }

  if (status === AppointmentStatus.done) {
    return {
      success: false,
      error:
        "Complete the visit from the consultation workspace so clinical notes and prescriptions are saved together.",
    };
  }

  if (!canSetAppointmentStatus(session.role, status)) {
    if (status === AppointmentStatus.in_progress) {
      return { success: false, error: "Receptionists cannot start consultations." };
    }
    return permissionDenied();
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, clinicId: session.clinicId },
    include: { consultation: true },
  });

  if (!appointment) {
    return { success: false, error: "Appointment not found." };
  }

  if (!canTransitionAppointment(appointment.status, status)) {
    return {
      success: false,
      error: appointmentTransitionError(appointment.status, status),
    };
  }

  let resolvedDoctorId: string | undefined;
  if (status === AppointmentStatus.in_progress && !appointment.consultation) {
    if (session.role === Role.doctor) {
      resolvedDoctorId = session.userId;
    } else if (doctorId) {
      const doctor = await prisma.user.findFirst({
        where: {
          id: doctorId,
          clinicId: session.clinicId,
          role: Role.doctor,
          isActive: true,
        },
      });
      if (!doctor) {
        return { success: false, error: "Selected doctor is not available." };
      }
      resolvedDoctorId = doctor.id;
    } else {
      const doctor = await prisma.user.findFirst({
        where: {
          clinicId: session.clinicId,
          role: Role.doctor,
          isActive: true,
        },
        orderBy: { name: "asc" },
      });
      if (!doctor) {
        return {
          success: false,
          error: "No active doctor is available to assign this consultation.",
        };
      }
      resolvedDoctorId = doctor.id;
    }
  }

  let consultationId: string | undefined = appointment.consultation?.id;

  const updated = await prisma.$transaction(async (tx) => {
    const statusUpdate = await tx.appointment.updateMany({
      where: {
        id: appointmentId,
        clinicId: session.clinicId,
        status: appointment.status,
      },
      data: { status },
    });

    if (statusUpdate.count === 0) {
      return { conflict: true as const };
    }

    if (
      status === AppointmentStatus.in_progress &&
      !appointment.consultation &&
      resolvedDoctorId
    ) {
      const consultation = await tx.consultation.create({
        data: {
          clinicId: session.clinicId,
          appointmentId,
          patientId: appointment.patientId,
          doctorId: resolvedDoctorId,
          createdById: session.userId,
        },
      });
      consultationId = consultation.id;
    }

    return { conflict: false as const };
  });

  if (updated.conflict) {
    return {
      success: false,
      error: "This appointment was updated by someone else. Refresh and try again.",
    };
  }

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "appointment",
    resourceId: appointmentId,
    metadata: { status, doctorId: doctorId ?? null },
  });

  revalidatePath("/queue");
  return { success: true, data: { consultationId } };
}

export async function setAppointmentOutcome(
  appointmentId: string,
  status: AppointmentStatus
): Promise<ActionResult<{ consultationId?: string }>> {
  const session = await requireSessionUser();
  if (!can(session, "appointments.cancel")) return permissionDenied();

  if (!isFrontDeskOutcome(status)) {
    return { success: false, error: "Invalid appointment outcome." };
  }

  if (!canSetAppointmentStatus(session.role, status)) {
    return permissionDenied();
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, clinicId: session.clinicId },
    select: { id: true, status: true, patientId: true },
  });

  if (!appointment) {
    return { success: false, error: "Appointment not found." };
  }

  if (!canTransitionAppointment(appointment.status, status)) {
    return {
      success: false,
      error: appointmentTransitionError(appointment.status, status),
    };
  }

  const updated = await prisma.appointment.updateMany({
    where: {
      id: appointmentId,
      clinicId: session.clinicId,
      status: appointment.status,
    },
    data: { status },
  });

  if (updated.count === 0) {
    return {
      success: false,
      error: "This appointment was updated by someone else. Refresh and try again.",
    };
  }

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "appointment",
    resourceId: appointmentId,
    metadata: { status, outcome: status },
  });

  revalidatePath("/queue");
  revalidatePath(`/patients/${appointment.patientId}`);
  return { success: true, data: {} };
}

export async function getAppointmentById(id: string) {
  const session = await requireSessionUser();
  if (!can(session, "queue.read") && !can(session, "appointments.schedule")) {
    return null;
  }

  return prisma.appointment.findFirst({
    where: { id, clinicId: session.clinicId },
    include: {
      patient: true,
      doctor: { select: { id: true, name: true } },
      consultation: {
        include: {
          doctor: { select: { id: true, name: true } },
          prescription: true,
          invoice: true,
        },
      },
    },
  });
}

export async function listScheduledAppointments(input?: {
  date?: string;
  from?: string;
  to?: string;
}) {
  const session = await requireSessionUser();
  if (!can(session, "appointments.schedule") && !can(session, "queue.read")) {
    return [];
  }

  const day =
    (input?.date?.trim()
      ? parseLocalDateInput(input.date.trim())
      : null) ?? todayDate();

  const start = input?.from
    ? parseLocalDateInput(input.from) ?? day
    : day;
  const end = input?.to
    ? parseLocalDateInput(input.to) ?? day
    : day;

  const startDay = dateOnly(start);
  const endDay = dateOnly(end);

  return prisma.appointment.findMany({
    where: {
      clinicId: session.clinicId,
      type: AppointmentType.scheduled,
      queueDate: { gte: startDay, lte: endDay },
      status: {
        in: [
          AppointmentStatus.waiting,
          AppointmentStatus.in_progress,
          AppointmentStatus.done,
          AppointmentStatus.no_show,
          AppointmentStatus.cancelled,
        ],
      },
    },
    orderBy: [{ scheduledAt: "asc" }, { tokenNumber: "asc" }],
    include: {
      patient: {
        select: { id: true, name: true, phone: true, mrn: true },
      },
      doctor: { select: { id: true, name: true } },
      consultation: { select: { id: true } },
    },
  });
}

export async function rescheduleAppointment(
  appointmentId: string,
  scheduledAt: string | Date,
  doctorId?: string | null
): Promise<ActionResult<{ id: string; tokenNumber: number }>> {
  const session = await requireSessionUser();
  if (!can(session, "appointments.schedule")) return permissionDenied();

  const scheduled =
    typeof scheduledAt === "string"
      ? parseLocalDateTimeInput(scheduledAt)
      : scheduledAt;
  if (!scheduled) {
    return { success: false, error: "Invalid scheduled date/time." };
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, clinicId: session.clinicId },
  });

  if (!appointment) {
    return { success: false, error: "Appointment not found." };
  }

  if (
    appointment.status !== AppointmentStatus.waiting &&
    appointment.status !== AppointmentStatus.cancelled
  ) {
    return {
      success: false,
      error: "Only waiting or cancelled appointments can be rescheduled.",
    };
  }

  let resolvedDoctorId = doctorId === undefined ? appointment.doctorId : doctorId;
  if (resolvedDoctorId) {
    const doctor = await prisma.user.findFirst({
      where: {
        id: resolvedDoctorId,
        clinicId: session.clinicId,
        role: Role.doctor,
        isActive: true,
      },
      select: { id: true },
    });
    if (!doctor) {
      return { success: false, error: "Selected doctor is not available." };
    }
    resolvedDoctorId = doctor.id;
  }

  const queueDate = dateOnly(scheduled);

  const updated = await prisma.$transaction(async (tx) => {
    const last = await tx.appointment.findFirst({
      where: { clinicId: session.clinicId, queueDate },
      orderBy: { tokenNumber: "desc" },
      select: { tokenNumber: true },
    });
    const tokenNumber =
      appointment.queueDate.getTime() === queueDate.getTime()
        ? appointment.tokenNumber
        : (last?.tokenNumber ?? 0) + 1;

    return tx.appointment.update({
      where: { id: appointmentId },
      data: {
        type: AppointmentType.scheduled,
        scheduledAt: scheduled,
        queueDate,
        tokenNumber,
        doctorId: resolvedDoctorId,
        status: AppointmentStatus.waiting,
        checkedInAt: null,
      },
    });
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "appointment",
    resourceId: appointmentId,
    metadata: { rescheduledAt: scheduled.toISOString() },
  });

  revalidatePath("/appointments");
  revalidatePath("/queue");
  revalidatePath(`/patients/${appointment.patientId}`);
  return {
    success: true,
    data: { id: updated.id, tokenNumber: updated.tokenNumber },
  };
}

/**
 * Check in a scheduled appointment for today's queue.
 * Moves early arrivals onto today's date with a fresh token when needed.
 */
export async function checkInAppointment(
  appointmentId: string
): Promise<ActionResult<{ id: string; tokenNumber: number }>> {
  const session = await requireSessionUser();
  if (!can(session, "queue.manage") && !can(session, "appointments.schedule")) {
    return permissionDenied();
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, clinicId: session.clinicId },
  });

  if (!appointment) {
    return { success: false, error: "Appointment not found." };
  }

  if (appointment.status !== AppointmentStatus.waiting) {
    return { success: false, error: "Only waiting appointments can be checked in." };
  }

  const today = todayDate();
  const alreadyToday =
    dateOnly(appointment.queueDate).getTime() === today.getTime();

  const updated = await prisma.$transaction(async (tx) => {
    let tokenNumber = appointment.tokenNumber;
    let queueDate = appointment.queueDate;

    if (!alreadyToday) {
      const conflict = await tx.appointment.findFirst({
        where: {
          clinicId: session.clinicId,
          patientId: appointment.patientId,
          queueDate: today,
          status: {
            in: [AppointmentStatus.waiting, AppointmentStatus.in_progress],
          },
          NOT: { id: appointmentId },
        },
        select: { id: true },
      });
      if (conflict) {
        return null;
      }

      const last = await tx.appointment.findFirst({
        where: { clinicId: session.clinicId, queueDate: today },
        orderBy: { tokenNumber: "desc" },
        select: { tokenNumber: true },
      });
      tokenNumber = (last?.tokenNumber ?? 0) + 1;
      queueDate = today;
    }

    return tx.appointment.update({
      where: { id: appointmentId },
      data: {
        queueDate,
        tokenNumber,
        checkedInAt: new Date(),
        status: AppointmentStatus.waiting,
      },
    });
  });

  if (!updated) {
    return {
      success: false,
      error: "Patient is already in today's active queue.",
    };
  }

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "appointment",
    resourceId: appointmentId,
    metadata: { checkedIn: true, tokenNumber: updated.tokenNumber },
  });

  revalidatePath("/queue");
  revalidatePath("/appointments");
  revalidatePath(`/patients/${appointment.patientId}`);
  return {
    success: true,
    data: { id: updated.id, tokenNumber: updated.tokenNumber },
  };
}


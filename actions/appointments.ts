"use server";

import { revalidatePath } from "next/cache";
import { AppointmentStatus, AppointmentType, Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { parseLocalDateTimeInput } from "@/lib/date-utils";
import type { ActionResult } from "@/lib/types";

const MAX_TOKEN_RETRIES = 3;

function todayDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
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

async function nextTokenNumber(
  clinicId: string,
  queueDate: Date
): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const last = await tx.appointment.findFirst({
      where: { clinicId, queueDate },
      orderBy: { tokenNumber: "desc" },
      select: { tokenNumber: true },
    });
    return (last?.tokenNumber ?? 0) + 1;
  });
}

export type CreateAppointmentInput = {
  patientId: string;
  type?: AppointmentType;
  scheduledAt?: string | Date | null;
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

  const patient = await prisma.patient.findFirst({
    where: { id: input.patientId, clinicId: session.clinicId },
  });

  if (!patient) {
    return { success: false, error: "Patient not found." };
  }

  const appointmentType = input.type ?? AppointmentType.walkin;
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

  const queueDate = scheduled ? dateOnly(scheduled) : todayDate();

  const alreadyQueued = await prisma.appointment.findFirst({
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
    return {
      success: false,
      error: "Patient is already in the queue for that day.",
    };
  }

  for (let attempt = 0; attempt < MAX_TOKEN_RETRIES; attempt++) {
    const tokenNumber = await nextTokenNumber(session.clinicId, queueDate);

    try {
      const appointment = await prisma.appointment.create({
        data: {
          clinicId: session.clinicId,
          patientId: input.patientId,
          tokenNumber,
          queueDate,
          type: appointmentType,
          scheduledAt: scheduled,
          createdById: session.userId,
        },
      });

      await logAudit({
        clinicId: session.clinicId,
        actorId: session.userId,
        action: "create",
        resourceType: "appointment",
        resourceId: appointment.id,
        metadata: { type: appointmentType, scheduledAt: scheduled?.toISOString() },
      });

      revalidatePath("/queue");
      revalidatePath(`/patients/${input.patientId}`);
      return {
        success: true,
        data: { id: appointment.id, tokenNumber: appointment.tokenNumber },
      };
    } catch (error) {
      if (isUniqueConstraintError(error) && attempt < MAX_TOKEN_RETRIES - 1) {
        continue;
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

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, clinicId: session.clinicId },
    include: { consultation: true },
  });

  if (!appointment) {
    return { success: false, error: "Appointment not found." };
  }

  if (
    status === AppointmentStatus.in_progress &&
    session.role === Role.receptionist
  ) {
    return { success: false, error: "Receptionists cannot start consultations." };
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
      resolvedDoctorId =
        (
          await prisma.user.findFirst({
            where: {
              clinicId: session.clinicId,
              role: Role.doctor,
              isActive: true,
            },
            orderBy: { name: "asc" },
          })
        )?.id ?? session.userId;
    }
  }

  let consultationId: string | undefined;

  await prisma.$transaction(async (tx) => {
    await tx.appointment.updateMany({
      where: { id: appointmentId, clinicId: session.clinicId },
      data: { status },
    });

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
  });

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

export async function getAppointmentById(id: string) {
  const session = await requireSessionUser();

  return prisma.appointment.findFirst({
    where: { id, clinicId: session.clinicId },
    include: {
      patient: true,
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

"use server";

import { revalidatePath } from "next/cache";
import { Gender } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { zodFieldErrors } from "@/lib/form-utils";
import { logger } from "@/lib/logger";
import { ageFromDob, parseLocalDateInput } from "@/lib/date-utils";
import type { ActionResult, VoidActionResult } from "@/lib/types";

const patientSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  age: z.coerce.number().int().nonnegative().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  address: z.string().optional(),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
});

function optionalText(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parsePatientForm(formData: FormData) {
  return patientSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    age: formData.get("age") || undefined,
    dateOfBirth: optionalText(formData.get("dateOfBirth")),
    gender: formData.get("gender") || undefined,
    address: optionalText(formData.get("address")),
    allergies: optionalText(formData.get("allergies")),
    chronicConditions: optionalText(formData.get("chronicConditions")),
  });
}

function resolveAgeAndDob(data: z.infer<typeof patientSchema>): {
  age: number | undefined;
  dateOfBirth: Date | null;
} {
  const dob = data.dateOfBirth ? parseLocalDateInput(data.dateOfBirth) : null;
  if (dob) {
    return { age: ageFromDob(dob), dateOfBirth: dob };
  }
  return { age: data.age, dateOfBirth: null };
}

const MAX_MRN_RETRIES = 3;

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}

async function generateMrn(clinicId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.patient.count({ where: { clinicId } });
  return `MRN-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function createPatient(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSessionUser();

  const parsed = parsePatientForm(formData);

  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid patient details.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const { age, dateOfBirth } = resolveAgeAndDob(parsed.data);

  for (let attempt = 0; attempt < MAX_MRN_RETRIES; attempt++) {
    const mrn = await generateMrn(session.clinicId);

    try {
      const patient = await prisma.patient.create({
        data: {
          clinicId: session.clinicId,
          mrn,
          name: parsed.data.name,
          phone: parsed.data.phone,
          age,
          dateOfBirth,
          gender: parsed.data.gender as Gender | undefined,
          address: parsed.data.address,
          allergies: parsed.data.allergies ?? null,
          chronicConditions: parsed.data.chronicConditions ?? null,
        },
      });

      await logAudit({
        clinicId: session.clinicId,
        actorId: session.userId,
        action: "create",
        resourceType: "patient",
        resourceId: patient.id,
      });

      revalidatePath("/patients");
      return { success: true, data: { id: patient.id } };
    } catch (error) {
      if (isUniqueConstraintError(error) && attempt < MAX_MRN_RETRIES - 1) {
        continue;
      }

      logger.warn("create_patient_failed", {
        clinicId: session.clinicId,
        attempt,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        error: "Patient with this phone number may already exist.",
      };
    }
  }

  return { success: false, error: "Could not create patient. Please try again." };
}

export async function updatePatient(
  id: string,
  formData: FormData
): Promise<VoidActionResult> {
  const session = await requireSessionUser();

  const parsed = parsePatientForm(formData);

  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid patient details.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const existing = await prisma.patient.findFirst({
    where: { id, clinicId: session.clinicId },
  });

  if (!existing) {
    return { success: false, error: "Patient not found." };
  }

  try {
    const { age, dateOfBirth } = resolveAgeAndDob(parsed.data);
    const result = await prisma.patient.updateMany({
      where: { id, clinicId: session.clinicId },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        age: age ?? null,
        dateOfBirth,
        gender: parsed.data.gender as Gender | undefined,
        address: parsed.data.address ?? null,
        allergies: parsed.data.allergies ?? null,
        chronicConditions: parsed.data.chronicConditions ?? null,
      },
    });

    if (result.count === 0) {
      return { success: false, error: "Patient not found." };
    }

    await logAudit({
      clinicId: session.clinicId,
      actorId: session.userId,
      action: "update",
      resourceType: "patient",
      resourceId: id,
    });

    revalidatePath("/patients");
    revalidatePath(`/patients/${id}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update patient." };
  }
}

export async function searchPatients(query: string, skip = 0, take = 50) {
  const session = await requireSessionUser();

  const patients = !query.trim()
    ? await prisma.patient.findMany({
        where: { clinicId: session.clinicId },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      })
    : await prisma.patient.findMany({
        where: {
          clinicId: session.clinicId,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { phone: { contains: query } },
            { mrn: { contains: query, mode: "insensitive" } },
          ],
        },
        orderBy: { name: "asc" },
        skip,
        take,
      });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "read",
    resourceType: "patient",
    metadata: { query: query.trim() || null, resultCount: patients.length },
  });

  return patients;
}

export async function countPatients(query: string) {
  const session = await requireSessionUser();

  if (!query.trim()) {
    return prisma.patient.count({ where: { clinicId: session.clinicId } });
  }

  return prisma.patient.count({
    where: {
      clinicId: session.clinicId,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
        { mrn: { contains: query, mode: "insensitive" } },
      ],
    },
  });
}

export async function getPatientById(id: string) {
  const session = await requireSessionUser();

  const patient = await prisma.patient.findFirst({
    where: { id, clinicId: session.clinicId },
  });

  if (patient) {
    await logAudit({
      clinicId: session.clinicId,
      actorId: session.userId,
      action: "read",
      resourceType: "patient",
      resourceId: id,
    });
  }

  return patient;
}

export async function getPatientHistory(patientId: string) {
  const session = await requireSessionUser();

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId: session.clinicId },
  });

  if (!patient) return null;

  const appointments = await prisma.appointment.findMany({
    where: { patientId, clinicId: session.clinicId },
    orderBy: { createdAt: "desc" },
    include: {
      consultation: {
        include: {
          doctor: { select: { name: true } },
          prescription: true,
          invoice: true,
        },
      },
    },
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "read",
    resourceType: "patient",
    resourceId: patientId,
    metadata: { history: true },
  });

  return { patient, appointments };
}

export async function findPossibleDuplicatePatients(input: {
  name: string;
  phone: string;
  excludeId?: string;
}) {
  const session = await requireSessionUser();
  const name = input.name.trim();
  const phone = input.phone.trim();

  if (name.length < 2 && phone.length < 5) return [];

  return prisma.patient.findMany({
    where: {
      clinicId: session.clinicId,
      ...(input.excludeId ? { id: { not: input.excludeId } } : {}),
      OR: [
        ...(phone.length >= 5 ? [{ phone: { contains: phone } }] : []),
        ...(name.length >= 2
          ? [{ name: { contains: name, mode: "insensitive" as const } }]
          : []),
      ],
    },
    take: 5,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      mrn: true,
      age: true,
      dateOfBirth: true,
    },
  });
}

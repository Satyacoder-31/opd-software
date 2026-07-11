import type { Patient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { PATIENT_PAGE_SIZE } from "@/lib/constants";

async function fetchPatients(clinicId: string, query: string, skip: number, take: number) {
  if (!query.trim()) {
    return prisma.patient.findMany({
      where: { clinicId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });
  }

  return prisma.patient.findMany({
    where: {
      clinicId,
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
}

async function fetchPatientCount(clinicId: string, query: string) {
  if (!query.trim()) {
    return prisma.patient.count({ where: { clinicId } });
  }

  return prisma.patient.count({
    where: {
      clinicId,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
        { mrn: { contains: query, mode: "insensitive" } },
      ],
    },
  });
}

export async function getInitialPatients(): Promise<{
  patients: Patient[];
  total: number;
}> {
  const session = await requireSessionUser();
  const [patients, total] = await Promise.all([
    fetchPatients(session.clinicId, "", 0, PATIENT_PAGE_SIZE),
    fetchPatientCount(session.clinicId, ""),
  ]);

  return { patients, total };
}

import { Prisma, Role } from "@prisma/client";

/**
 * Users who can appear on the public booking page and hold DoctorAvailability:
 * active doctors, or owners with a consulting specialty set at signup/onboarding.
 */
export function bookableClinicianWhere(
  clinicId?: string
): Prisma.UserWhereInput {
  return {
    ...(clinicId ? { clinicId } : {}),
    isActive: true,
    OR: [
      { role: Role.doctor },
      { role: Role.owner, specialty: { not: null } },
    ],
  };
}

export function isBookableClinicianRole(role: Role): boolean {
  return role === Role.doctor || role === Role.owner;
}

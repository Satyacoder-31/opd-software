import { CLINIC_SPECIALTIES } from "@/lib/clinic-specialties";

export { CLINIC_SPECIALTIES };

/** Doctor specialty options for staff invite / profile. */
export const DOCTOR_SPECIALTY_OPTIONS: { value: string; label: string }[] =
  CLINIC_SPECIALTIES.map((specialty) => ({
    value: specialty,
    label: specialty,
  }));

/**
 * Desk designations for receptionist (covers common OPD support roles —
 * there is no separate nurse role; vitals/nursing desk maps here).
 */
export const RECEPTIONIST_DESIGNATIONS = [
  "Front desk / registration",
  "Appointments desk",
  "Billing & cash",
  "Nursing / vitals",
  "Lab desk",
  "Call center",
] as const;

export const ADMIN_DESIGNATIONS = [
  "Clinic manager",
  "Operations",
  "Accounts",
  "HR / admin",
  "IT / systems",
] as const;

export function designationOptionsForRole(role: string): { value: string; label: string }[] {
  if (role === "receptionist") {
    return RECEPTIONIST_DESIGNATIONS.map((d) => ({ value: d, label: d }));
  }
  if (role === "admin") {
    return ADMIN_DESIGNATIONS.map((d) => ({ value: d, label: d }));
  }
  return [];
}

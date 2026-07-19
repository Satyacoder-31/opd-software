import { AppointmentStatus, Role } from "@prisma/client";

const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  [AppointmentStatus.waiting]: [AppointmentStatus.in_progress],
  [AppointmentStatus.in_progress]: [AppointmentStatus.done],
  [AppointmentStatus.done]: [],
};

export function canTransitionAppointment(
  from: AppointmentStatus,
  to: AppointmentStatus
): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canSetAppointmentStatus(
  role: Role,
  to: AppointmentStatus
): boolean {
  if (to === AppointmentStatus.in_progress) {
    return role === Role.admin || role === Role.doctor;
  }
  if (to === AppointmentStatus.done) {
    // Finalization is owned by clinical submit; queue action allows doctor/admin only.
    return role === Role.admin || role === Role.doctor;
  }
  return false;
}

export function appointmentTransitionError(
  from: AppointmentStatus,
  to: AppointmentStatus
): string {
  if (from === AppointmentStatus.done) {
    return "Finalized visits cannot be reopened. Use the amendment flow to change clinical records.";
  }
  return `Cannot change status from ${from.replaceAll("_", " ")} to ${to.replaceAll("_", " ")}.`;
}

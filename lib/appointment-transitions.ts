import { AppointmentStatus, Role } from "@prisma/client";
import { can } from "@/lib/rbac";

const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  [AppointmentStatus.waiting]: [
    AppointmentStatus.in_progress,
    AppointmentStatus.cancelled,
    AppointmentStatus.no_show,
  ],
  [AppointmentStatus.in_progress]: [AppointmentStatus.done],
  [AppointmentStatus.done]: [],
  [AppointmentStatus.cancelled]: [],
  [AppointmentStatus.no_show]: [],
};

const FRONT_DESK_OUTCOMES: AppointmentStatus[] = [
  AppointmentStatus.cancelled,
  AppointmentStatus.no_show,
];

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
  const session = { role };
  if (to === AppointmentStatus.in_progress) {
    return can(session, "consultations.start");
  }
  if (to === AppointmentStatus.done) {
    // Finalization is owned by Complete Visit inside the consultation workspace.
    return false;
  }
  if (FRONT_DESK_OUTCOMES.includes(to)) {
    return can(session, "appointments.cancel");
  }
  return false;
}

export function isFrontDeskOutcome(
  status: AppointmentStatus
): status is typeof AppointmentStatus.cancelled | typeof AppointmentStatus.no_show {
  return FRONT_DESK_OUTCOMES.includes(status);
}

export function appointmentTransitionError(
  from: AppointmentStatus,
  to: AppointmentStatus
): string {
  if (from === AppointmentStatus.done) {
    return "Finalized visits cannot be reopened. Use the amendment flow to change clinical records.";
  }
  if (
    from === AppointmentStatus.cancelled ||
    from === AppointmentStatus.no_show
  ) {
    return `This appointment is already marked ${from.replaceAll("_", " ")}.`;
  }
  return `Cannot change status from ${from.replaceAll("_", " ")} to ${to.replaceAll("_", " ")}.`;
}

import type { Role } from "@prisma/client";
import type { SessionUser } from "@/lib/types";

/**
 * Clinic-scoped RBAC for OPD EMR / local clinic CMS.
 *
 * Roles are permission templates on the user's clinic membership
 * (`User.clinicId` + `User.role`). Custom per-user overrides can be
 * layered on later without changing call sites that use `can()`.
 *
 * There is no Nurse role — desk / vitals-prep work belongs to Receptionist.
 * Lab desk work also maps to receptionist (or admin) until dedicated roles
 * are added.
 */
export const PERMISSIONS = [
  "patients.read",
  "patients.write",
  "queue.read",
  "queue.manage",
  "appointments.cancel",
  "appointments.schedule",
  "consultations.start",
  "consultations.read",
  "consultations.write",
  "consultations.vitals",
  "prescriptions.write",
  "templates.manage",
  "attachments.manage",
  "billing.read",
  "billing.write",
  "fees.read",
  "fees.manage",
  "drugs.search",
  "drugs.manage",
  "labs.read",
  "labs.manage",
  "labs.results",
  "messaging.send",
  "messaging.manage",
  "reports.read",
  "reports.export.visits",
  "reports.export.patients",
  "settings.access",
  "clinic.manage",
  "staff.manage",
  "staff.invite.admin",
  "audit.read",
  "subscription.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL_PERMISSIONS = [...PERMISSIONS] as Permission[];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS,
  doctor: ALL_PERMISSIONS,
  receptionist: ALL_PERMISSIONS,
};

/** Roles that can be assigned when inviting staff (never owner). */
export const INVITABLE_ROLES = ["admin", "doctor", "receptionist"] as const satisfies readonly Role[];

export type InvitableRole = (typeof INVITABLE_ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Hospital Lead / Owner",
  admin: "Hospital Admin",
  doctor: "Consulting Doctor",
  receptionist: "Front Desk & Billing",
};

export function permissionsFor(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? ALL_PERMISSIONS;
}

export function can(
  session: Pick<SessionUser, "role">,
  permission: Permission
): boolean {
  return permissionsFor(session.role).includes(permission);
}

export function canAny(
  session: Pick<SessionUser, "role">,
  permissions: readonly Permission[]
): boolean {
  return permissions.some((permission) => can(session, permission));
}

export function rolesWith(permission: Permission): Role[] {
  return (Object.keys(ROLE_PERMISSIONS) as Role[]).filter((role) =>
    ROLE_PERMISSIONS[role].includes(permission)
  );
}

/** All hospital staff have clinic operational management access in unified mode. */
export function isClinicManager(_role: Role): boolean {
  return true;
}

/** All hospital staff have clinical capabilities in unified mode. */
export function isClinicalRole(_role: Role): boolean {
  return true;
}

export function isInvitableRole(role: string): role is InvitableRole {
  return (INVITABLE_ROLES as readonly string[]).includes(role);
}

import { Role } from "@prisma/client";
import type { SessionUser } from "@/lib/types";

/**
 * Clinic-scoped RBAC for OPD EMR.
 *
 * Roles are permission templates on the user's clinic membership
 * (`User.clinicId` + `User.role`). Custom per-user overrides can be
 * layered on later without changing call sites that use `can()`.
 *
 * There is no Nurse role — desk / vitals-prep work belongs to Receptionist.
 */
export const PERMISSIONS = [
  "patients.read",
  "patients.write",
  "queue.read",
  "queue.manage",
  "appointments.cancel",
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

/** Owner: full clinic control including subscription and inviting admins. */
const OWNER_PERMISSIONS: Permission[] = ALL_PERMISSIONS;

/**
 * Admin: full operational control. Same clinical/desk powers as owner,
 * but subscription / ownership-sensitive actions stay owner-only.
 */
const ADMIN_PERMISSIONS: Permission[] = ALL_PERMISSIONS.filter(
  (p) => p !== "subscription.manage"
);

const DOCTOR_PERMISSIONS: Permission[] = [
  "patients.read",
  "patients.write",
  "queue.read",
  "queue.manage",
  "consultations.start",
  "consultations.read",
  "consultations.write",
  "consultations.vitals",
  "prescriptions.write",
  "templates.manage",
  "attachments.manage",
  "fees.read",
  "drugs.search",
];

/**
 * Receptionist: front desk + billing + reports.
 * Also covers former nurse/assistant duties (queue, patient prep, vitals).
 * No prescriptions, diagnosis edits, or clinic settings.
 */
const RECEPTIONIST_PERMISSIONS: Permission[] = [
  "patients.read",
  "patients.write",
  "queue.read",
  "queue.manage",
  "appointments.cancel",
  "consultations.vitals",
  "billing.read",
  "billing.write",
  "fees.read",
  "reports.read",
  "reports.export.visits",
];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [Role.owner]: OWNER_PERMISSIONS,
  [Role.admin]: ADMIN_PERMISSIONS,
  [Role.doctor]: DOCTOR_PERMISSIONS,
  [Role.receptionist]: RECEPTIONIST_PERMISSIONS,
};

/** Roles that can be assigned when inviting staff (never owner). */
export const INVITABLE_ROLES = [
  Role.admin,
  Role.doctor,
  Role.receptionist,
] as const;

export type InvitableRole = (typeof INVITABLE_ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  [Role.owner]: "Owner",
  [Role.admin]: "Admin",
  [Role.doctor]: "Doctor",
  [Role.receptionist]: "Receptionist",
};

export function permissionsFor(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
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

/** Owner and admin manage clinic settings / staff. */
export function isClinicManager(role: Role): boolean {
  return role === Role.owner || role === Role.admin;
}

export function isClinicalRole(role: Role): boolean {
  return (
    role === Role.owner || role === Role.admin || role === Role.doctor
  );
}

export function isInvitableRole(role: string): role is InvitableRole {
  return (INVITABLE_ROLES as readonly string[]).includes(role);
}

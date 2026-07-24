import { describe, expect, it } from "vitest";
import { Role } from "@prisma/client";
import {
  can,
  canAny,
  isClinicManager,
  isClinicalRole,
  isInvitableRole,
  permissionsFor,
  rolesWith,
  ROLE_LABELS,
} from "@/lib/rbac";
import type { SessionUser } from "@/lib/types";

function session(role: Role): SessionUser {
  return {
    userId: "u1",
    clinicId: "c1",
    role,
    email: "u@clinic.com",
    name: "User",
  };
}

describe("rbac permissions", () => {
  it("gives owner full clinic control including subscription", () => {
    expect(can(session(Role.owner), "subscription.manage")).toBe(true);
    expect(can(session(Role.owner), "staff.manage")).toBe(true);
    expect(can(session(Role.owner), "consultations.write")).toBe(true);
  });

  it("gives admin operational control but not subscription", () => {
    expect(can(session(Role.admin), "settings.access")).toBe(true);
    expect(can(session(Role.admin), "staff.invite.admin")).toBe(true);
    expect(can(session(Role.admin), "subscription.manage")).toBe(false);
  });

  it("gives doctor clinical access without billing or settings", () => {
    expect(can(session(Role.doctor), "consultations.write")).toBe(true);
    expect(can(session(Role.doctor), "prescriptions.write")).toBe(true);
    expect(can(session(Role.doctor), "billing.write")).toBe(false);
    expect(can(session(Role.doctor), "settings.access")).toBe(false);
  });

  it("gives receptionist desk, billing, reports, and vitals — not clinical write", () => {
    const desk = session(Role.receptionist);
    expect(can(desk, "queue.manage")).toBe(true);
    expect(can(desk, "patients.write")).toBe(true);
    expect(can(desk, "appointments.cancel")).toBe(true);
    expect(can(desk, "billing.write")).toBe(true);
    expect(can(desk, "reports.read")).toBe(true);
    expect(can(desk, "consultations.vitals")).toBe(true);
    expect(can(desk, "consultations.write")).toBe(false);
    expect(can(desk, "prescriptions.write")).toBe(false);
    expect(can(desk, "settings.access")).toBe(false);
  });

  it("does not include a nurse role", () => {
    expect(Object.keys(ROLE_LABELS)).not.toContain("nurse");
    expect(isInvitableRole("nurse")).toBe(false);
  });

  it("rolesWith returns every role that has a permission", () => {
    expect(rolesWith("settings.access").sort()).toEqual(
      [Role.admin, Role.owner].sort()
    );
    expect(rolesWith("billing.write").sort()).toEqual(
      [Role.admin, Role.owner, Role.receptionist].sort()
    );
  });

  it("canAny matches if any permission is granted", () => {
    expect(
      canAny(session(Role.doctor), ["billing.write", "consultations.write"])
    ).toBe(true);
    expect(
      canAny(session(Role.doctor), ["billing.write", "settings.access"])
    ).toBe(false);
  });

  it("isClinicManager / isClinicalRole helpers", () => {
    expect(isClinicManager(Role.owner)).toBe(true);
    expect(isClinicManager(Role.admin)).toBe(true);
    expect(isClinicManager(Role.doctor)).toBe(false);
    expect(isClinicalRole(Role.doctor)).toBe(true);
    expect(isClinicalRole(Role.receptionist)).toBe(false);
  });

  it("exposes inviteable roles without owner", () => {
    expect(isInvitableRole("admin")).toBe(true);
    expect(isInvitableRole("doctor")).toBe(true);
    expect(isInvitableRole("receptionist")).toBe(true);
    expect(isInvitableRole("owner")).toBe(false);
  });

  it("permissionsFor returns a stable list per role", () => {
    expect(permissionsFor(Role.receptionist).length).toBeGreaterThan(0);
    expect(permissionsFor(Role.owner).length).toBeGreaterThan(
      permissionsFor(Role.admin).length
    );
  });
});

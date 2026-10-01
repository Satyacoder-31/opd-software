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

describe("rbac permissions (unified hospital OPD mode)", () => {
  it("gives owner full clinic control including subscription", () => {
    expect(can(session(Role.owner), "subscription.manage")).toBe(true);
    expect(can(session(Role.owner), "staff.manage")).toBe(true);
    expect(can(session(Role.owner), "consultations.write")).toBe(true);
  });

  it("gives hospital roles complete operational access to billing and clinical write", () => {
    expect(can(session(Role.doctor), "consultations.write")).toBe(true);
    expect(can(session(Role.doctor), "prescriptions.write")).toBe(true);
    expect(can(session(Role.doctor), "billing.write")).toBe(true);
    expect(can(session(Role.doctor), "settings.access")).toBe(true);
  });

  it("gives receptionist desk full operational and clinical permissions in unified mode", () => {
    const desk = session(Role.receptionist);
    expect(can(desk, "queue.manage")).toBe(true);
    expect(can(desk, "patients.write")).toBe(true);
    expect(can(desk, "appointments.cancel")).toBe(true);
    expect(can(desk, "appointments.schedule")).toBe(true);
    expect(can(desk, "billing.write")).toBe(true);
    expect(can(desk, "reports.read")).toBe(true);
    expect(can(desk, "consultations.vitals")).toBe(true);
    expect(can(desk, "labs.read")).toBe(true);
    expect(can(desk, "consultations.write")).toBe(true);
    expect(can(desk, "prescriptions.write")).toBe(true);
    expect(can(desk, "settings.access")).toBe(true);
  });

  it("gives doctor scheduling and lab order access", () => {
    expect(can(session(Role.doctor), "appointments.schedule")).toBe(true);
    expect(can(session(Role.doctor), "labs.manage")).toBe(true);
  });

  it("does not include a nurse role", () => {
    expect(Object.keys(ROLE_LABELS)).not.toContain("nurse");
    expect(isInvitableRole("nurse")).toBe(false);
  });

  it("rolesWith returns all hospital roles for core permissions", () => {
    expect(rolesWith("settings.access").sort()).toEqual(
      [Role.admin, Role.doctor, Role.owner, Role.receptionist].sort()
    );
    expect(rolesWith("billing.write").sort()).toEqual(
      [Role.admin, Role.doctor, Role.owner, Role.receptionist].sort()
    );
  });

  it("canAny matches if any permission is granted", () => {
    expect(
      canAny(session(Role.doctor), ["billing.write", "consultations.write"])
    ).toBe(true);
    expect(
      canAny(session(Role.doctor), ["billing.write", "settings.access"])
    ).toBe(true);
  });

  it("isClinicManager / isClinicalRole helpers return true in unified mode", () => {
    expect(isClinicManager(Role.owner)).toBe(true);
    expect(isClinicManager(Role.admin)).toBe(true);
    expect(isClinicManager(Role.doctor)).toBe(true);
    expect(isClinicalRole(Role.doctor)).toBe(true);
    expect(isClinicalRole(Role.receptionist)).toBe(true);
  });

  it("exposes inviteable roles without owner", () => {
    expect(isInvitableRole("admin")).toBe(true);
    expect(isInvitableRole("doctor")).toBe(true);
    expect(isInvitableRole("receptionist")).toBe(true);
    expect(isInvitableRole("owner")).toBe(false);
  });

  it("permissionsFor returns a stable list per role", () => {
    expect(permissionsFor(Role.receptionist).length).toBeGreaterThan(0);
    expect(permissionsFor(Role.owner).length).toBeGreaterThan(0);
  });
});

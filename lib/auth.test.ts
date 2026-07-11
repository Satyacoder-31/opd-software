import { describe, expect, it } from "vitest";
import { Role } from "@prisma/client";
import { roleAllowed, permissionDenied } from "@/lib/auth";
import type { SessionUser } from "@/lib/types";

const doctorSession: SessionUser = {
  userId: "user-1",
  clinicId: "clinic-1",
  role: Role.doctor,
  email: "doctor@clinic.com",
  name: "Dr. Patel",
};

describe("roleAllowed", () => {
  it("allows matching roles", () => {
    expect(roleAllowed(doctorSession, [Role.admin, Role.doctor])).toBe(true);
  });

  it("denies non-matching roles", () => {
    expect(roleAllowed(doctorSession, [Role.receptionist])).toBe(false);
  });
});

describe("permissionDenied", () => {
  it("returns a consistent error shape", () => {
    expect(permissionDenied()).toEqual({
      success: false,
      error: "You do not have permission to perform this action.",
    });
  });
});

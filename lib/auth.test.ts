import { describe, expect, it } from "vitest";
import { Role } from "@prisma/client";
import {
  roleAllowed,
  permissionDenied,
  sessionFromAuthUser,
} from "@/lib/auth";
import type { SessionUser } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

const doctorSession: SessionUser = {
  userId: "user-1",
  clinicId: "clinic-1",
  role: Role.doctor,
  email: "doctor@clinic.com",
  name: "Dr. Patel",
};

function makeAuthUser(
  overrides?: Partial<{
    clinicId: string;
    role: Role;
    userId: string;
    isActive: boolean;
    name: string;
    email: string;
  }>
): User {
  return {
    id: "auth-1",
    email: overrides?.email ?? "doctor@clinic.com",
    app_metadata: {
      clinicId: overrides?.clinicId ?? "clinic-1",
      role: overrides?.role ?? Role.doctor,
      userId: overrides?.userId ?? "user-1",
      ...(overrides?.isActive !== undefined
        ? { isActive: overrides.isActive }
        : {}),
    },
    user_metadata: {
      name: overrides?.name ?? "Dr. Patel",
    },
  } as unknown as User;
}

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

describe("sessionFromAuthUser", () => {
  it("builds a session from complete JWT metadata", () => {
    expect(sessionFromAuthUser(makeAuthUser())).toEqual(doctorSession);
  });

  it("rejects deactivated users even if JWT has clinic claims", () => {
    expect(sessionFromAuthUser(makeAuthUser({ isActive: false }))).toBeNull();
  });

  it("rejects incomplete JWT metadata", () => {
    const user = makeAuthUser();
    user.app_metadata = { role: Role.doctor };
    expect(sessionFromAuthUser(user)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { AppointmentStatus, Role } from "@prisma/client";
import {
  appointmentTransitionError,
  canSetAppointmentStatus,
  canTransitionAppointment,
} from "@/lib/appointment-transitions";

describe("canTransitionAppointment", () => {
  it("allows waiting -> in_progress -> done only", () => {
    expect(
      canTransitionAppointment(
        AppointmentStatus.waiting,
        AppointmentStatus.in_progress
      )
    ).toBe(true);
    expect(
      canTransitionAppointment(
        AppointmentStatus.in_progress,
        AppointmentStatus.done
      )
    ).toBe(true);
    expect(
      canTransitionAppointment(
        AppointmentStatus.done,
        AppointmentStatus.in_progress
      )
    ).toBe(false);
    expect(
      canTransitionAppointment(
        AppointmentStatus.waiting,
        AppointmentStatus.done
      )
    ).toBe(false);
  });
});

describe("canSetAppointmentStatus", () => {
  it("blocks receptionists from starting or finalizing", () => {
    expect(
      canSetAppointmentStatus(Role.receptionist, AppointmentStatus.in_progress)
    ).toBe(false);
    expect(
      canSetAppointmentStatus(Role.receptionist, AppointmentStatus.done)
    ).toBe(false);
  });

  it("allows doctors and admins to start and finalize", () => {
    expect(
      canSetAppointmentStatus(Role.doctor, AppointmentStatus.in_progress)
    ).toBe(true);
    expect(canSetAppointmentStatus(Role.admin, AppointmentStatus.done)).toBe(
      true
    );
  });
});

describe("appointmentTransitionError", () => {
  it("explains reopen is blocked", () => {
    expect(
      appointmentTransitionError(
        AppointmentStatus.done,
        AppointmentStatus.in_progress
      )
    ).toMatch(/amendment/i);
  });
});

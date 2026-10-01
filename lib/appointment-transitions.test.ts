import { describe, expect, it } from "vitest";
import { AppointmentStatus, Role } from "@prisma/client";
import {
  appointmentTransitionError,
  canSetAppointmentStatus,
  canTransitionAppointment,
  isFrontDeskOutcome,
} from "@/lib/appointment-transitions";

describe("canTransitionAppointment", () => {
  it("allows waiting -> in_progress -> done only along the clinical path", () => {
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

  it("allows waiting -> cancelled or no_show", () => {
    expect(
      canTransitionAppointment(
        AppointmentStatus.waiting,
        AppointmentStatus.cancelled
      )
    ).toBe(true);
    expect(
      canTransitionAppointment(
        AppointmentStatus.waiting,
        AppointmentStatus.no_show
      )
    ).toBe(true);
    expect(
      canTransitionAppointment(
        AppointmentStatus.in_progress,
        AppointmentStatus.cancelled
      )
    ).toBe(false);
    expect(
      canTransitionAppointment(
        AppointmentStatus.cancelled,
        AppointmentStatus.waiting
      )
    ).toBe(false);
  });
});

describe("canSetAppointmentStatus", () => {
  it("allows hospital staff to start consultations in unified mode", () => {
    expect(
      canSetAppointmentStatus(Role.receptionist, AppointmentStatus.in_progress)
    ).toBe(true);
    expect(
      canSetAppointmentStatus(Role.doctor, AppointmentStatus.in_progress)
    ).toBe(true);
    expect(
      canSetAppointmentStatus(Role.admin, AppointmentStatus.in_progress)
    ).toBe(true);
    expect(
      canSetAppointmentStatus(Role.owner, AppointmentStatus.in_progress)
    ).toBe(true);
  });

  it("blocks all roles from finalizing directly via the queue action (must finalize in consultation workspace)", () => {
    expect(
      canSetAppointmentStatus(Role.receptionist, AppointmentStatus.done)
    ).toBe(false);
    expect(canSetAppointmentStatus(Role.doctor, AppointmentStatus.done)).toBe(
      false
    );
    expect(canSetAppointmentStatus(Role.admin, AppointmentStatus.done)).toBe(
      false
    );
  });

  it("allows hospital staff to cancel or mark no-show", () => {
    expect(
      canSetAppointmentStatus(Role.admin, AppointmentStatus.cancelled)
    ).toBe(true);
    expect(
      canSetAppointmentStatus(Role.owner, AppointmentStatus.cancelled)
    ).toBe(true);
    expect(
      canSetAppointmentStatus(Role.receptionist, AppointmentStatus.no_show)
    ).toBe(true);
    expect(
      canSetAppointmentStatus(Role.doctor, AppointmentStatus.cancelled)
    ).toBe(true);
  });
});

describe("isFrontDeskOutcome", () => {
  it("identifies cancelled and no_show", () => {
    expect(isFrontDeskOutcome(AppointmentStatus.cancelled)).toBe(true);
    expect(isFrontDeskOutcome(AppointmentStatus.no_show)).toBe(true);
    expect(isFrontDeskOutcome(AppointmentStatus.waiting)).toBe(false);
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

  it("explains terminal front-desk outcomes", () => {
    expect(
      appointmentTransitionError(
        AppointmentStatus.cancelled,
        AppointmentStatus.waiting
      )
    ).toMatch(/cancelled/i);
  });
});

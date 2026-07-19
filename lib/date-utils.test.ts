import { describe, expect, it } from "vitest";
import {
  ageFromDob,
  clinicCalendarParts,
  clinicTodayDate,
  formatPatientAge,
  parseLocalDateInput,
  todayDateStringInClinic,
} from "@/lib/date-utils";

describe("ageFromDob", () => {
  it("computes whole years before birthday", () => {
    const dob = new Date(2000, 5, 15);
    const asOf = new Date(2026, 5, 14);
    expect(ageFromDob(dob, asOf)).toBe(25);
  });

  it("computes whole years on/after birthday", () => {
    const dob = new Date(2000, 5, 15);
    const asOf = new Date(2026, 5, 15);
    expect(ageFromDob(dob, asOf)).toBe(26);
  });
});

describe("formatPatientAge", () => {
  it("prefers DOB over stored age", () => {
    expect(
      formatPatientAge({
        age: 99,
        dateOfBirth: new Date(2010, 0, 1),
      })
    ).toMatch(/^\d+ years$/);
  });

  it("falls back to age", () => {
    expect(formatPatientAge({ age: 42, dateOfBirth: null })).toBe("42 years");
  });
});

describe("parseLocalDateInput", () => {
  it("parses YYYY-MM-DD", () => {
    const date = parseLocalDateInput("2024-03-09");
    expect(date?.getFullYear()).toBe(2024);
    expect(date?.getMonth()).toBe(2);
    expect(date?.getDate()).toBe(9);
  });

  it("rejects invalid dates", () => {
    expect(parseLocalDateInput("not-a-date")).toBeNull();
  });
});

describe("clinic calendar helpers", () => {
  it("formats Asia/Kolkata calendar day as YYYY-MM-DD", () => {
    // 2026-01-01 18:30 UTC is already 2026-01-02 in Kolkata (UTC+5:30)
    const utcEvening = new Date("2026-01-01T18:30:00.000Z");
    expect(todayDateStringInClinic(utcEvening)).toBe("2026-01-02");
    expect(clinicCalendarParts(utcEvening)).toEqual({
      year: 2026,
      month: 1,
      day: 2,
    });
    const local = clinicTodayDate(utcEvening);
    expect(local.getFullYear()).toBe(2026);
    expect(local.getMonth()).toBe(0);
    expect(local.getDate()).toBe(2);
  });
});

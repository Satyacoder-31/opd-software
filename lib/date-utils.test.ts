import { describe, expect, it } from "vitest";
import { ageFromDob, formatPatientAge, parseLocalDateInput } from "@/lib/date-utils";

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
});

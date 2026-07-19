import { describe, expect, it } from "vitest";
import { assertClinicMatch, clinicScope } from "@/lib/clinic-scope";

describe("clinicScope", () => {
  it("builds a clinic where clause", () => {
    expect(clinicScope("clinic-1")).toEqual({ clinicId: "clinic-1" });
  });
});

describe("assertClinicMatch", () => {
  it("accepts matching clinic ids only", () => {
    expect(assertClinicMatch("a", "a")).toBe(true);
    expect(assertClinicMatch("a", "b")).toBe(false);
  });
});

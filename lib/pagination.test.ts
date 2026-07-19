import { describe, expect, it } from "vitest";
import {
  clampPagination,
  DEFAULT_PATIENT_PAGE_SIZE,
  MAX_PATIENT_PAGE_SIZE,
} from "@/lib/pagination";

describe("clampPagination", () => {
  it("uses defaults for invalid input", () => {
    expect(clampPagination(Number.NaN, Number.NaN)).toEqual({
      skip: 0,
      take: DEFAULT_PATIENT_PAGE_SIZE,
    });
  });

  it("clamps take to the max page size", () => {
    expect(clampPagination(-10, 10_000)).toEqual({
      skip: 0,
      take: MAX_PATIENT_PAGE_SIZE,
    });
  });

  it("preserves valid skip/take", () => {
    expect(clampPagination(25, 10)).toEqual({ skip: 25, take: 10 });
  });
});

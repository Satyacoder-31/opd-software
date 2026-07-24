import { describe, expect, it } from "vitest";
import { REPORTS_SECTIONS } from "@/components/reports/reports-nav";

describe("REPORTS_SECTIONS", () => {
  it("keeps daily close and exports on dedicated routes", () => {
    expect(REPORTS_SECTIONS.map((section) => section.href)).toEqual([
      "/reports/daily",
      "/reports/exports",
    ]);
  });

  it("labels each job for the hub", () => {
    expect(REPORTS_SECTIONS.map((section) => section.label)).toEqual([
      "Daily close",
      "Data exports",
    ]);
  });
});

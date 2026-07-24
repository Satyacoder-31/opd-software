import { describe, expect, it } from "vitest";
import {
  matchesBillingHubSearch,
  matchesBillingHubStatus,
} from "@/lib/billing-hub";

describe("matchesBillingHubSearch", () => {
  const row = {
    patientName: "Anita Sharma",
    patientMrn: "MRN-1001",
    invoiceNumber: "INV-2026-0004",
  };

  it("matches name, mrn, or invoice number", () => {
    expect(matchesBillingHubSearch(row, "anita")).toBe(true);
    expect(matchesBillingHubSearch(row, "1001")).toBe(true);
    expect(matchesBillingHubSearch(row, "0004")).toBe(true);
    expect(matchesBillingHubSearch(row, "zzz")).toBe(false);
  });

  it("treats empty query as match-all", () => {
    expect(matchesBillingHubSearch(row, "  ")).toBe(true);
  });
});

describe("matchesBillingHubStatus", () => {
  it("filters unbilled and invoice statuses", () => {
    expect(matchesBillingHubStatus("unbilled", null, "unbilled")).toBe(true);
    expect(matchesBillingHubStatus("invoice", "draft", "unbilled")).toBe(false);
    expect(matchesBillingHubStatus("invoice", "paid", "paid")).toBe(true);
    expect(matchesBillingHubStatus("unbilled", null, "paid")).toBe(false);
    expect(matchesBillingHubStatus("invoice", "void", "all")).toBe(true);
  });
});

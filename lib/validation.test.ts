import { describe, expect, it } from "vitest";
import { validateBillingInput, validateReason } from "@/lib/validation";

describe("validateBillingInput", () => {
  it("rejects zero totals", () => {
    const result = validateBillingInput({
      mode: "flat",
      total: 0,
      lineItems: [],
    });

    expect(result.ok).toBe(false);
  });

  it("accepts a valid flat fee", () => {
    const result = validateBillingInput({
      mode: "flat",
      total: 500,
      lineItems: [],
    });

    expect(result).toEqual({ ok: true });
  });

  it("rejects itemized rows without descriptions", () => {
    const result = validateBillingInput({
      mode: "itemized",
      total: 500,
      lineItems: [{ description: "", amount: 500 }],
    });

    expect(result.ok).toBe(false);
  });
});

describe("validateReason", () => {
  it("rejects short reasons", () => {
    const result = validateReason("no");
    expect(result.ok).toBe(false);
  });

  it("accepts a trimmed reason", () => {
    const result = validateReason("  Wrong amount entered  ");
    expect(result).toEqual({
      ok: true,
      reason: "Wrong amount entered",
    });
  });
});

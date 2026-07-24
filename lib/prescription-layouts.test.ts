import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRESCRIPTION_LAYOUT,
  PRESCRIPTION_LAYOUTS,
  isPrescriptionLayoutId,
  resolvePrescriptionLayout,
} from "@/lib/prescription-layouts";

describe("prescription layouts registry", () => {
  it("exposes twelve unique layouts", () => {
    expect(PRESCRIPTION_LAYOUTS).toHaveLength(12);
    const ids = PRESCRIPTION_LAYOUTS.map((layout) => layout.id);
    expect(new Set(ids).size).toBe(12);
  });

  it("resolves known and unknown layout ids", () => {
    expect(resolvePrescriptionLayout("azure").id).toBe("azure");
    expect(resolvePrescriptionLayout("not-a-layout").id).toBe(
      DEFAULT_PRESCRIPTION_LAYOUT
    );
    expect(resolvePrescriptionLayout(null).id).toBe(DEFAULT_PRESCRIPTION_LAYOUT);
    expect(resolvePrescriptionLayout(undefined).id).toBe(
      DEFAULT_PRESCRIPTION_LAYOUT
    );
  });

  it("type-guards layout ids", () => {
    expect(isPrescriptionLayoutId("classic")).toBe(true);
    expect(isPrescriptionLayoutId("orchid")).toBe(true);
    expect(isPrescriptionLayoutId("")).toBe(false);
    expect(isPrescriptionLayoutId("neon")).toBe(false);
  });
});

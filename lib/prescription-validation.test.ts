import { describe, expect, it } from "vitest";
import {
  filledMedicineCount,
  isBlankMedicineRow,
  isPartialMedicineRow,
  normalizeMedicineRows,
  validatePrescriptionDraft,
} from "@/lib/prescription-validation";
import type { Medicine } from "@/lib/types";

const complete: Medicine = {
  name: "Amoxicillin",
  dosage: "500 mg",
  frequency: "Twice daily",
  duration: "5 days",
};

describe("medicine row helpers", () => {
  it("detects blank and partial rows", () => {
    expect(
      isBlankMedicineRow({
        name: "",
        dosage: "",
        frequency: "",
        duration: "",
      })
    ).toBe(true);
    expect(
      isPartialMedicineRow({
        name: "Paracetamol",
        dosage: "",
        frequency: "",
        duration: "",
      })
    ).toBe(true);
    expect(isPartialMedicineRow(complete)).toBe(false);
  });

  it("drops blank rows when normalizing", () => {
    expect(
      normalizeMedicineRows([
        { name: "", dosage: "", frequency: "", duration: "" },
        complete,
      ])
    ).toEqual([complete]);
  });
});

describe("validatePrescriptionDraft", () => {
  it("accepts empty prescriptions after dropping blank rows", () => {
    const result = validatePrescriptionDraft([
      { name: "  ", dosage: "", frequency: "", duration: "" },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.medicines).toEqual([]);
    }
  });

  it("rejects partial medicine rows", () => {
    const result = validatePrescriptionDraft([
      { name: "Ibuprofen", dosage: "400 mg", frequency: "", duration: "" },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/incomplete/i);
    }
  });

  it("accepts complete medicines with advice", () => {
    const result = validatePrescriptionDraft([complete], {
      advice: "Rest",
      followUp: "5 days",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.medicines).toHaveLength(1);
      expect(result.advice).toBe("Rest");
      expect(result.followUp).toBe("5 days");
    }
  });

  it("counts filled medicines", () => {
    expect(filledMedicineCount([complete, { ...complete, name: "" }])).toBe(1);
  });
});

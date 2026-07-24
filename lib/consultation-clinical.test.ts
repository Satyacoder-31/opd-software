import { describe, expect, it } from "vitest";
import {
  consultationClinicalSchema,
  formatVitalValue,
  hasMedicalCertificateContent,
} from "@/lib/consultation-clinical";

describe("consultationClinicalSchema", () => {
  it("accepts a minimal valid consultation payload", () => {
    const result = consultationClinicalSchema.safeParse({
      chiefComplaint: "Fever",
      diagnosis: "Viral fever",
    });

    expect(result.success).toBe(true);
  });

  it("accepts nested clinical sections", () => {
    const result = consultationClinicalSchema.safeParse({
      vitals: { bp: "120/80", pulse: "72" },
      patientHistory: { allergies: "Penicillin" },
    });

    expect(result.success).toBe(true);
  });
});

describe("formatVitalValue", () => {
  it("appends a unit when missing", () => {
    expect(formatVitalValue("120/80", "mmHg")).toBe("120/80 mmHg");
    expect(formatVitalValue("72", "bpm")).toBe("72 bpm");
  });

  it("does not duplicate an existing unit", () => {
    expect(formatVitalValue("98.6°F", "°F")).toBe("98.6°F");
    expect(formatVitalValue("98 %", "%")).toBe("98 %");
  });
});

describe("hasMedicalCertificateContent", () => {
  it("returns false when certificate is empty", () => {
    expect(hasMedicalCertificateContent({})).toBe(false);
    expect(hasMedicalCertificateContent(null)).toBe(false);
  });

  it("returns true when any certificate field is filled", () => {
    expect(
      hasMedicalCertificateContent({ fitnessStatus: "Fit for duty" })
    ).toBe(true);
  });
});

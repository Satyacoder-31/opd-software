import { describe, expect, it } from "vitest";
import {
  consultationClinicalSchema,
  formatVitalValue,
  hasMedicalCertificateContent,
  sectionCompletion,
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
      examination: {
        general: "Normal",
        jointsAndParts: "Right knee medial tenderness, ROM 0-110",
      },
      advice: "Avoid squatting, take rest",
      adviceDetails: {
        generalAdvice: "Avoid squatting and cross-legged sitting",
        physiotherapyExercises: "Isometric quadriceps strengthening",
      },
      treatmentPlan: {
        treatmentType: "Elective Surgical Management",
        proposedProcedure: "Total Knee Arthroplasty (TKA)",
        laterality: "Right",
        anesthesiaPlanned: "Spinal Anesthesia",
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.examination?.jointsAndParts).toContain("Right knee");
      expect(result.data.treatmentPlan?.proposedProcedure).toBe("Total Knee Arthroplasty (TKA)");
      expect(result.data.adviceDetails?.generalAdvice).toContain("squatting");
    }
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

describe("sectionCompletion", () => {
  it("tracks advice and treatmentPlan completion correctly", () => {
    const emptyResult = sectionCompletion({});
    expect(emptyResult.advice.filled).toBe(false);
    expect(emptyResult.treatmentPlan.filled).toBe(false);

    const filledResult = sectionCompletion({
      advice: "Rest and warm fomentation",
      treatmentPlan: {
        treatmentType: "Elective Surgery",
        proposedProcedure: "Arthroscopic ACL Reconstruction",
      },
    });

    expect(filledResult.advice.filled).toBe(true);
    expect(filledResult.treatmentPlan.filled).toBe(true);
    expect(filledResult.treatmentPlan.count).toBe(2);
  });
});

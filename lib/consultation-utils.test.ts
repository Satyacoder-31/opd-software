import { describe, expect, it } from "vitest";
import { AppointmentStatus } from "@prisma/client";
import {
  isConsultationEditable,
  mergePatientAlertsIntoClinical,
  hasPatientSafetyAlerts,
  resolvePrescriptionPastHistory,
} from "@/lib/consultation-utils";

describe("isConsultationEditable", () => {
  it("allows edits while consultation is in progress", () => {
    expect(isConsultationEditable(AppointmentStatus.in_progress)).toBe(true);
  });

  it("blocks edits after consultation is finalized", () => {
    expect(isConsultationEditable(AppointmentStatus.done)).toBe(false);
    expect(isConsultationEditable(AppointmentStatus.waiting)).toBe(false);
  });
});

describe("patient safety helpers", () => {
  it("detects allergy and chronic condition alerts", () => {
    expect(hasPatientSafetyAlerts({ allergies: "Penicillin" })).toBe(true);
    expect(hasPatientSafetyAlerts({ chronicConditions: "Asthma" })).toBe(true);
    expect(hasPatientSafetyAlerts({})).toBe(false);
  });

  it("ignores NKDA-style allergy notes", () => {
    expect(
      hasPatientSafetyAlerts({ allergies: "No known drug allergies" })
    ).toBe(false);
    expect(hasPatientSafetyAlerts({ allergies: "NKDA" })).toBe(false);
    expect(hasPatientSafetyAlerts({ allergies: "none" })).toBe(false);
  });

  it("prefills empty history fields from patient alerts", () => {
    const merged = mergePatientAlertsIntoClinical(
      { patientHistory: {} },
      { allergies: "Penicillin", chronicConditions: "Hypertension" }
    );

    expect(merged.patientHistory?.allergies).toBe("Penicillin");
    expect(merged.patientHistory?.pastMedical).toBe("Hypertension");
  });

  it("prefills default negative history when no patient alerts exist", () => {
    const merged = mergePatientAlertsIntoClinical(
      { patientHistory: {} },
      {}
    );

    expect(merged.patientHistory?.pastMedical).toBe("No DM, No HTN, No surgery");
  });

  it("does not overwrite explicitly cleared history values", () => {
    const merged = mergePatientAlertsIntoClinical(
      { patientHistory: { pastMedical: "" } },
      { chronicConditions: "Hypertension" }
    );

    expect(merged.patientHistory?.pastMedical).toBe("");
  });

  it("does not overwrite existing history values", () => {
    const merged = mergePatientAlertsIntoClinical(
      { patientHistory: { allergies: "Sulfa", pastMedical: "Diabetes" } },
      { allergies: "Penicillin", chronicConditions: "Hypertension" }
    );

    expect(merged.patientHistory?.allergies).toBe("Sulfa");
    expect(merged.patientHistory?.pastMedical).toBe("Diabetes");
  });
});

describe("resolvePrescriptionPastHistory", () => {
  it("returns empty string when pastMedical is explicitly cleared", () => {
    expect(
      resolvePrescriptionPastHistory("Hypertension", { pastMedical: "" })
    ).toBe("");
  });

  it("returns pastMedical when set to default negative string", () => {
    expect(
      resolvePrescriptionPastHistory(null, {
        pastMedical: "No DM, No HTN, No surgery",
      })
    ).toBe("No DM, No HTN, No surgery");
  });

  it("returns joined conditions and surgery when present", () => {
    expect(
      resolvePrescriptionPastHistory(null, {
        pastMedical: "Known HTN; Known DM",
        pastSurgical: "Appendectomy",
      })
    ).toBe("Known HTN; Known DM; Surgery: Appendectomy");
  });

  it("returns empty string when neither chronicConditions nor patientHistory are present", () => {
    expect(resolvePrescriptionPastHistory(null, null)).toBe("");
  });
});

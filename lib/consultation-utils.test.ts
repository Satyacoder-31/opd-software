import { describe, expect, it } from "vitest";
import { AppointmentStatus } from "@prisma/client";
import {
  isConsultationEditable,
  mergePatientAlertsIntoClinical,
  hasPatientSafetyAlerts,
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

  it("prefills empty history fields from patient alerts", () => {
    const merged = mergePatientAlertsIntoClinical(
      { patientHistory: {} },
      { allergies: "Penicillin", chronicConditions: "Hypertension" }
    );

    expect(merged.patientHistory?.allergies).toBe("Penicillin");
    expect(merged.patientHistory?.pastMedical).toBe("Hypertension");
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

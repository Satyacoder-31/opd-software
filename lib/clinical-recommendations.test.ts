import { describe, expect, it } from "vitest";
import {
  CHIEF_COMPLAINT_RECOMMENDATIONS,
  ONSET_RECOMMENDATIONS,
  DURATION_RECOMMENDATIONS,
  HPI_RECOMMENDATIONS,
  PAST_MEDICAL_RECOMMENDATIONS,
  PAST_SURGICAL_RECOMMENDATIONS,
  ALLERGIES_RECOMMENDATIONS,
  CURRENT_MEDICATIONS_RECOMMENDATIONS,
  FAMILY_HISTORY_RECOMMENDATIONS,
  SOCIAL_HISTORY_RECOMMENDATIONS,
  GENERAL_EXAM_RECOMMENDATIONS,
  CVS_EXAM_RECOMMENDATIONS,
  RESP_EXAM_RECOMMENDATIONS,
  ABDOMEN_EXAM_RECOMMENDATIONS,
  NEURO_EXAM_RECOMMENDATIONS,
  OTHER_EXAM_RECOMMENDATIONS,
  DIAGNOSIS_NOTES_RECOMMENDATIONS,
  ADDITIONAL_NOTES_RECOMMENDATIONS,
  DOSAGE_RECOMMENDATIONS,
  DURATION_PRESETS,
  ADVICE_RECOMMENDATIONS,
  FOLLOW_UP_RECOMMENDATIONS,
  LAB_RESULTS_RECOMMENDATIONS,
  IMAGING_RESULTS_RECOMMENDATIONS,
  OTHER_INVESTIGATION_RECOMMENDATIONS,
  REFERRAL_SPECIALTY_RECOMMENDATIONS,
  REFERRAL_FACILITY_RECOMMENDATIONS,
  REFERRAL_REASON_RECOMMENDATIONS,
  REFERRAL_NOTES_RECOMMENDATIONS,
  MED_CERT_DIAGNOSIS_RECOMMENDATIONS,
  MED_CERT_FITNESS_RECOMMENDATIONS,
  MED_CERT_REMARKS_RECOMMENDATIONS,
} from "./clinical-recommendations";

describe("clinical-recommendations", () => {
  it("provides comprehensive chief complaint, onset, duration, and HPI recommendations", () => {
    expect(CHIEF_COMPLAINT_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(10);
    expect(ONSET_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(5);
    expect(DURATION_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(5);
    expect(HPI_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(5);

    expect(CHIEF_COMPLAINT_RECOMMENDATIONS.some((c) => c.includes("knee"))).toBe(true);
    expect(CHIEF_COMPLAINT_RECOMMENDATIONS.some((c) => c.includes("back"))).toBe(true);
  });

  it("provides patient history recommendations (medical, surgical, allergies, medications)", () => {
    expect(PAST_MEDICAL_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(8);
    expect(PAST_SURGICAL_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(6);
    expect(ALLERGIES_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(5);
    expect(CURRENT_MEDICATIONS_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(5);
    expect(FAMILY_HISTORY_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(4);
    expect(SOCIAL_HISTORY_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(4);
  });

  it("provides systemic physical examination recommendations", () => {
    expect(GENERAL_EXAM_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(3);
    expect(CVS_EXAM_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(2);
    expect(RESP_EXAM_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(2);
    expect(ABDOMEN_EXAM_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(2);
    expect(NEURO_EXAM_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(3);
    expect(OTHER_EXAM_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(4);
  });

  it("provides diagnosis notes and additional counseling recommendations", () => {
    expect(DIAGNOSIS_NOTES_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(8);
    expect(ADDITIONAL_NOTES_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(4);
  });

  it("provides prescription dosage, duration, advice, and follow-up presets", () => {
    expect(DOSAGE_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(8);
    expect(DURATION_PRESETS.length).toBeGreaterThanOrEqual(5);
    expect(ADVICE_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(5);
    expect(FOLLOW_UP_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(5);

    expect(DOSAGE_RECOMMENDATIONS).toContain("1 tablet");
    expect(DOSAGE_RECOMMENDATIONS).toContain("1 capsule");
  });

  it("provides investigation results presets (labs, imaging, other)", () => {
    expect(LAB_RESULTS_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(6);
    expect(IMAGING_RESULTS_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(5);
    expect(OTHER_INVESTIGATION_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(2);

    expect(IMAGING_RESULTS_RECOMMENDATIONS.some((r) => r.includes("X-ray"))).toBe(true);
    expect(IMAGING_RESULTS_RECOMMENDATIONS.some((r) => r.includes("MRI"))).toBe(true);
  });

  it("provides documents referral and medical certificate recommendations", () => {
    expect(REFERRAL_SPECIALTY_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(8);
    expect(REFERRAL_FACILITY_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(4);
    expect(REFERRAL_REASON_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(5);
    expect(REFERRAL_NOTES_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(2);

    expect(MED_CERT_DIAGNOSIS_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(5);
    expect(MED_CERT_FITNESS_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(4);
    expect(MED_CERT_REMARKS_RECOMMENDATIONS.length).toBeGreaterThanOrEqual(4);
  });
});

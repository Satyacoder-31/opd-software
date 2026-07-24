import { describe, expect, it } from "vitest";
import {
  collectPrescriptionSafetyCues,
  emptyPrescriptionCue,
  findAllergyConflicts,
  findDuplicateMedicines,
} from "@/lib/prescription-safety";
import type { Medicine } from "@/lib/types";

const complete = (name: string): Medicine => ({
  name,
  dosage: "1 tablet",
  frequency: "Twice daily",
  duration: "5 Days",
});

describe("prescription safety", () => {
  it("flags duplicate medicines", () => {
    const cues = findDuplicateMedicines([
      complete("Paracetamol 500 mg tablet"),
      complete("paracetamol 500 mg tablet"),
      complete("Cetirizine 10 mg tablet"),
    ]);
    expect(cues).toHaveLength(1);
    expect(cues[0]?.severity).toBe("warning");
    expect(cues[0]?.medicineIndexes).toEqual([0, 1]);
  });

  it("flags allergy token overlaps", () => {
    const cues = findAllergyConflicts(
      [complete("Amoxicillin 500 mg capsule")],
      "Penicillin, Amoxicillin"
    );
    expect(cues).toHaveLength(1);
    expect(cues[0]?.severity).toBe("danger");
  });

  it("ignores NKDA-style allergy notes", () => {
    expect(
      findAllergyConflicts([complete("Amoxicillin")], "NKDA")
    ).toHaveLength(0);
  });

  it("warns when the prescription is empty or partial", () => {
    expect(emptyPrescriptionCue([{ name: "", dosage: "", frequency: "", duration: "" }])?.id).toBe(
      "empty-rx"
    );
    expect(
      emptyPrescriptionCue([
        { name: "Ibuprofen", dosage: "", frequency: "", duration: "" },
      ])?.id
    ).toBe("partial-0");
  });

  it("collects cues in priority order", () => {
    const cues = collectPrescriptionSafetyCues(
      [complete("Amoxicillin"), complete("Amoxicillin")],
      "Amoxicillin"
    );
    expect(cues.some((cue) => cue.id.startsWith("duplicate"))).toBe(true);
    expect(cues.some((cue) => cue.id.startsWith("allergy"))).toBe(true);
  });
});

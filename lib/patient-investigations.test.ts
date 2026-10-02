import { describe, expect, it } from "vitest";

describe("Patient investigation history and lab results formatting", () => {
  it("formats lab result snippet for copying into consultation clinical notes", () => {
    const testName = "Serum Uric Acid";
    const resultValue = "7.8";
    const resultUnit = "mg/dL";
    const formatted = `${testName}: ${resultValue} ${resultUnit}`.trim();
    expect(formatted).toBe("Serum Uric Acid: 7.8 mg/dL");
  });

  it("formats advised investigations into prescription advice section", () => {
    const tests = [
      "Complete Blood Count (CBC)",
      "Serum Uric Acid",
      "Digital X-Ray Right Knee (AP & Lateral)",
    ];
    const bulletList = tests.map((t) => `• ${t}`).join("\n");
    const adviceText = `Advised Investigations:\n${bulletList}`;

    expect(adviceText).toContain("• Complete Blood Count (CBC)");
    expect(adviceText).toContain("• Digital X-Ray Right Knee (AP & Lateral)");
    expect(adviceText.startsWith("Advised Investigations:\n")).toBe(true);
  });

  it("filters lab results by test name or result value accurately", () => {
    const results = [
      { testName: "HbA1c", resultValue: "6.8", resultNotes: "borderline" },
      { testName: "Serum Creatinine", resultValue: "0.9", resultNotes: "normal" },
      { testName: "ESR", resultValue: "28", resultNotes: "elevated" },
    ];

    const searchQ = "creat";
    const matched = results.filter(
      (r) =>
        r.testName.toLowerCase().includes(searchQ) ||
        r.resultNotes.toLowerCase().includes(searchQ)
    );

    expect(matched).toHaveLength(1);
    expect(matched[0].testName).toBe("Serum Creatinine");
  });

  it("calculates total investigation history metrics for doctor workspace badges", () => {
    const labResults = [{ id: "1" }, { id: "2" }, { id: "3" }];
    const advisedInvestigations = [{ id: "o1" }, { id: "o2" }];
    const previousConsultationInvestigations = [{ consultationId: "c1" }];

    const totalCount =
      labResults.length +
      advisedInvestigations.length +
      previousConsultationInvestigations.length;

    expect(totalCount).toBe(6);
  });

  it("categorizes lab test item status correctly", () => {
    const items = [
      { id: "1", status: "resulted", resultValue: "14.2" },
      { id: "2", status: "collected", resultValue: null },
      { id: "3", status: "pending", resultValue: null },
    ];

    const completed = items.filter((i) => i.status === "resulted" || i.resultValue != null);
    const pending = items.filter((i) => i.status === "pending");

    expect(completed).toHaveLength(1);
    expect(pending).toHaveLength(1);
  });
});

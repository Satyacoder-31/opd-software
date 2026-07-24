import { describe, expect, it } from "vitest";
import {
  estimateQuantity,
  expandFrequencyInput,
  matchFrequencyShortcut,
  parseDosesPerIntake,
  parseDurationDays,
} from "@/lib/prescription-dosing";

describe("frequency shortcuts", () => {
  it("maps OD/BD/TDS codes and full labels", () => {
    expect(matchFrequencyShortcut("BD")?.label).toBe("Twice daily");
    expect(matchFrequencyShortcut("twice daily")?.code).toBe("BD");
    expect(expandFrequencyInput("tds")).toBe("Three times daily");
    expect(expandFrequencyInput("custom q8h")).toBe("custom q8h");
  });
});

describe("duration and quantity", () => {
  it("parses day counts from duration labels", () => {
    expect(parseDurationDays("5 Days")).toBe(5);
    expect(parseDurationDays("1 Week")).toBe(7);
    expect(parseDurationDays("2 Months")).toBe(60);
    expect(parseDurationDays("Until review")).toBeNull();
  });

  it("estimates qty from BD × 5 days", () => {
    expect(estimateQuantity("BD", "5 Days")).toBe("10");
    expect(estimateQuantity("Twice daily", "5 Days")).toBe("10");
    expect(estimateQuantity("TDS", "7 Days")).toBe("21");
    expect(estimateQuantity("SOS", "5 Days")).toBeNull();
  });

  it("scales qty by doses per intake", () => {
    expect(parseDosesPerIntake("2 tablets")).toBe(2);
    expect(parseDosesPerIntake("½ tablet")).toBe(0.5);
    expect(estimateQuantity("OD", "10 Days", 2)).toBe("20");
  });
});

import { describe, expect, it } from "vitest";
import {
  durationUnitNeedsAmount,
  formatDuration,
  parseDuration,
} from "@/lib/prescription-utils";

describe("parseDuration", () => {
  it("parses countable durations", () => {
    expect(parseDuration("5 days")).toEqual({ amount: "5", unit: "days" });
    expect(parseDuration("1 Day")).toEqual({ amount: "1", unit: "days" });
    expect(parseDuration("2 weeks")).toEqual({ amount: "2", unit: "weeks" });
    expect(parseDuration("3 Months")).toEqual({ amount: "3", unit: "months" });
  });

  it("parses fixed durations", () => {
    expect(parseDuration("Until review")).toEqual({
      amount: "",
      unit: "until_review",
    });
    expect(parseDuration("ongoing / continuous")).toEqual({
      amount: "",
      unit: "ongoing",
    });
  });

  it("keeps custom free-form text", () => {
    expect(parseDuration("PRN for flare")).toEqual({
      amount: "PRN for flare",
      unit: "",
    });
  });

  it("handles empty values", () => {
    expect(parseDuration("")).toEqual({ amount: "", unit: "" });
    expect(parseDuration("   ")).toEqual({ amount: "", unit: "" });
  });
});

describe("formatDuration", () => {
  it("formats countable durations with singular/plural labels", () => {
    expect(formatDuration({ amount: "1", unit: "days" })).toBe("1 Day");
    expect(formatDuration({ amount: "5", unit: "days" })).toBe("5 Days");
    expect(formatDuration({ amount: "2", unit: "weeks" })).toBe("2 Weeks");
  });

  it("formats fixed durations without an amount", () => {
    expect(formatDuration({ amount: "9", unit: "until_review" })).toBe(
      "Until review"
    );
    expect(formatDuration({ amount: "", unit: "ongoing" })).toBe(
      "Ongoing / continuous"
    );
  });

  it("preserves custom free-form text when no unit is set", () => {
    expect(formatDuration({ amount: "until symptoms settle", unit: "" })).toBe(
      "until symptoms settle"
    );
  });

  it("returns empty when amount is missing for countable units", () => {
    expect(formatDuration({ amount: "", unit: "days" })).toBe("");
  });
});

describe("durationUnitNeedsAmount", () => {
  it("requires an amount for countable units and free-form", () => {
    expect(durationUnitNeedsAmount("days")).toBe(true);
    expect(durationUnitNeedsAmount("")).toBe(true);
    expect(durationUnitNeedsAmount("until_review")).toBe(false);
    expect(durationUnitNeedsAmount("ongoing")).toBe(false);
  });
});

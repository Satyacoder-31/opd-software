import { describe, expect, it } from "vitest";
import {
  applyDrugDefaults,
  buildDrugSuggestions,
  filterDrugSuggestions,
  findDrugSuggestion,
  formatDrugDefaultsSummary,
  normalizeDrugName,
} from "@/lib/drug-catalog";
import type { Medicine } from "@/lib/types";

const blankMedicine = (): Medicine => ({
  name: "",
  dosage: "",
  route: "",
  frequency: "",
  duration: "",
  quantity: "",
  instructions: "",
});

describe("drug catalog", () => {
  it("normalizes spacing and case for duplicate detection", () => {
    expect(normalizeDrugName("  Paracetamol   650 MG ")).toBe(
      "paracetamol 650 mg"
    );
  });

  it("ranks frequently used clinic medicines first and removes duplicates", () => {
    const suggestions = buildDrugSuggestions([
      {
        id: "less-used",
        name: "Clinic medicine",
        normalizedName: "clinic medicine",
        usageCount: 2,
      },
      {
        id: "paracetamol",
        name: "Paracetamol 500 mg tablet",
        normalizedName: "paracetamol 500 mg tablet",
        usageCount: 8,
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Three times daily",
        duration: "3 Days",
        instructions: "After meals",
      },
    ]);

    expect(suggestions[0]).toMatchObject({
      id: "paracetamol",
      source: "clinic",
      defaults: {
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Three times daily",
        duration: "3 Days",
        instructions: "After meals",
      },
    });
    expect(
      suggestions.filter(
        (item) => normalizeDrugName(item.name) === "paracetamol 500 mg tablet"
      )
    ).toHaveLength(1);
  });

  it("includes prescribing defaults on common medicines", () => {
    const suggestions = buildDrugSuggestions([]);
    const pantoprazole = findDrugSuggestion(
      suggestions,
      "Pantoprazole 40 mg tablet"
    );

    expect(pantoprazole?.defaults).toMatchObject({
      dosage: "1 tablet",
      route: "Oral",
      frequency: "Once daily",
      duration: "14 Days",
      instructions: "Before meals",
    });
  });

  it("backfills blank clinic dictionary rows from matching common drugs", () => {
    const suggestions = buildDrugSuggestions([
      {
        id: "legacy-paracetamol",
        name: "Paracetamol 500 mg tablet",
        normalizedName: "paracetamol 500 mg tablet",
        usageCount: 12,
        dosage: null,
        route: null,
        frequency: null,
        duration: null,
        instructions: null,
      },
    ]);

    expect(suggestions[0]).toMatchObject({
      id: "legacy-paracetamol",
      source: "clinic",
      defaults: {
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Three times daily",
        duration: "3 Days",
        instructions: "After meals",
      },
    });
  });

  it("keeps clinic-learned defaults over common-drug fallbacks", () => {
    const suggestions = buildDrugSuggestions([
      {
        id: "clinic-para",
        name: "Paracetamol 500 mg tablet",
        normalizedName: "paracetamol 500 mg tablet",
        usageCount: 4,
        dosage: "2 tablets",
        route: "Oral",
        frequency: "Twice daily",
        duration: "2 Days",
        instructions: "With meals",
      },
    ]);

    expect(suggestions[0].defaults).toMatchObject({
      dosage: "2 tablets",
      frequency: "Twice daily",
      duration: "2 Days",
      instructions: "With meals",
    });
  });

  it("matches midway text while preferring names that start with the query", () => {
    const suggestions = buildDrugSuggestions([
      {
        id: "clinic",
        name: "Vitamin Paracetamol combination",
        normalizedName: "vitamin paracetamol combination",
        usageCount: 20,
      },
    ]);

    const matches = filterDrugSuggestions(suggestions, "para");

    expect(matches[0].name).toBe("Paracetamol 500 mg tablet");
    expect(matches.some((item) => item.id === "clinic")).toBe(true);
  });

  it("applies catalog defaults when selecting a medicine", () => {
    const next = applyDrugDefaults(blankMedicine(), "Pantoprazole 40 mg tablet", {
      dosage: "1 tablet",
      route: "Oral",
      frequency: "Once daily",
      duration: "14 Days",
      instructions: "Before meals",
    });

    expect(next).toMatchObject({
      name: "Pantoprazole 40 mg tablet",
      dosage: "1 tablet",
      route: "Oral",
      frequency: "Once daily",
      duration: "14 Days",
      instructions: "Before meals",
    });
  });

  it("prefers catalog defaults over previously typed empty-row leftovers", () => {
    const next = applyDrugDefaults(
      {
        ...blankMedicine(),
        dosage: "2 tablets",
        route: "Nasal",
      },
      "Azithromycin 500 mg tablet",
      {
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Once daily",
        duration: "3 Days",
      }
    );

    expect(next.dosage).toBe("1 tablet");
    expect(next.route).toBe("Oral");
    expect(next.frequency).toBe("Once daily");
  });

  it("formats a compact defaults summary for dictionary rows", () => {
    expect(
      formatDrugDefaultsSummary({
        route: "Oral",
        dosage: "1 tablet",
        frequency: "Twice daily",
        duration: "5 Days",
      })
    ).toBe("Oral · 1 tablet · Twice daily · 5 Days");
  });
});

import { describe, expect, it } from "vitest";
import {
  COMMON_ILLNESS_TEMPLATES,
  findCommonTemplateById,
  getClinicalTemplatesBySpecialty,
  searchCommonTemplates,
} from "./clinical-templates";

describe("clinical-templates", () => {
  it("contains all core clinical illness regimens with complete medication entries", () => {
    expect(COMMON_ILLNESS_TEMPLATES.length).toBeGreaterThanOrEqual(8);

    for (const tpl of COMMON_ILLNESS_TEMPLATES) {
      expect(tpl.id).toMatch(/^builtin-/);
      expect(tpl.name.length).toBeGreaterThan(3);
      expect(tpl.medicines.length).toBeGreaterThan(0);
      expect(tpl.advice).toBeDefined();
      expect(tpl.followUp).toBeDefined();
      expect(tpl.isBuiltIn).toBe(true);

      for (const med of tpl.medicines) {
        expect(med.name.trim().length).toBeGreaterThan(0);
        expect(med.dosage.trim().length).toBeGreaterThan(0);
        expect(med.frequency.trim().length).toBeGreaterThan(0);
        expect(med.duration.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("finds a common template by id", () => {
    const flu = findCommonTemplateById("builtin-cold-flu");
    expect(flu).toBeDefined();
    expect(flu?.name).toContain("Common Cold & Flu");
    expect(flu?.medicines.some((m) => m.name.includes("Paracetamol"))).toBe(true);

    const missing = findCommonTemplateById("non-existent-id");
    expect(missing).toBeUndefined();
  });

  it("searches common templates by name, category, or medicine", () => {
    const fluResults = searchCommonTemplates("flu");
    expect(fluResults.length).toBeGreaterThan(0);
    expect(fluResults[0].id).toBe("builtin-cold-flu");

    const orthoResults = searchCommonTemplates("Orthopedics");
    expect(orthoResults.length).toBeGreaterThanOrEqual(2);

    const paracetamolResults = searchCommonTemplates("Paracetamol");
    expect(paracetamolResults.length).toBeGreaterThanOrEqual(2);
  });

  it("filters clinical templates separately for orthopedics and general treatment", () => {
    const orthoTemplates = getClinicalTemplatesBySpecialty("orthopedics");
    expect(orthoTemplates.length).toBeGreaterThan(0);
    expect(orthoTemplates.every((t) => t.category === "Orthopedics & Pain")).toBe(true);
    expect(orthoTemplates.some((t) => t.name.includes("Knee Osteoarthritis"))).toBe(true);
    expect(orthoTemplates.some((t) => t.name.includes("Cold & Flu"))).toBe(false);

    const generalTemplates = getClinicalTemplatesBySpecialty("general");
    expect(generalTemplates.length).toBeGreaterThan(0);
    expect(generalTemplates.every((t) => t.category !== "Orthopedics & Pain")).toBe(true);
    expect(generalTemplates.some((t) => t.name.includes("Cold & Flu"))).toBe(true);
    expect(generalTemplates.some((t) => t.name.includes("Knee Osteoarthritis"))).toBe(false);

    const allTemplates = getClinicalTemplatesBySpecialty("all");
    expect(allTemplates.length).toBe(COMMON_ILLNESS_TEMPLATES.length);
  });
});

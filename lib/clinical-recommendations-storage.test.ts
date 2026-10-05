import { describe, it, expect, beforeEach } from "vitest";
import {
  normalizeFieldKey,
  addCustomRecommendation,
  loadCustomRecommendations,
  removeCustomRecommendation,
  toggleFavoriteRecommendation,
  loadFavoriteRecommendations,
  isFavoriteRecommendation,
  sortRecommendationsWithFavorites,
  clearClinicalRecommendationsStorage,
} from "./clinical-recommendations-storage";

describe("clinical-recommendations-storage", () => {
  beforeEach(() => {
    clearClinicalRecommendationsStorage();
  });

  describe("normalizeFieldKey", () => {
    it("normalizes indexed prescription field names", () => {
      expect(normalizeFieldKey("med-dosage-0")).toBe("dosage");
      expect(normalizeFieldKey("med-dosage-3")).toBe("dosage");
      expect(normalizeFieldKey("med-freq-1")).toBe("frequency");
      expect(normalizeFieldKey("med-dur-2")).toBe("duration");
      expect(normalizeFieldKey("med-instr-0")).toBe("instructions");
    });

    it("normalizes clinical section field keys cleanly", () => {
      expect(normalizeFieldKey("advice.physiotherapy")).toBe("advice.physiotherapy");
      expect(normalizeFieldKey("treatmentPlan.proposedProcedure")).toBe(
        "treatmentplan.proposedprocedure"
      );
      expect(normalizeFieldKey("Chief Complaint")).toBe("chief_complaint");
      expect(normalizeFieldKey("")).toBe("general");
      expect(normalizeFieldKey(undefined)).toBe("general");
    });
  });

  describe("custom recommendations", () => {
    it("adds and loads custom recommendations per field", () => {
      const field = "advice.general";
      expect(loadCustomRecommendations(field)).toEqual([]);

      addCustomRecommendation(field, "Avoid lifting weights above 5kg");
      expect(loadCustomRecommendations(field)).toEqual([
        "Avoid lifting weights above 5kg",
      ]);

      // Deduplicates case-insensitively
      addCustomRecommendation(field, "avoid lifting weights above 5kg");
      expect(loadCustomRecommendations(field)).toEqual([
        "Avoid lifting weights above 5kg",
      ]);

      addCustomRecommendation(field, "Ice pack for 15 mins thrice daily");
      const list = loadCustomRecommendations(field);
      expect(list.length).toBe(2);
      expect(list).toContain("Ice pack for 15 mins thrice daily");
    });

    it("removes custom recommendation and cleans up its favorite status", () => {
      const field = "chief_complaint";
      addCustomRecommendation(field, "Bilateral knee clicking without pain");
      toggleFavoriteRecommendation(field, "Bilateral knee clicking without pain");

      expect(loadFavoriteRecommendations(field)).toContain(
        "Bilateral knee clicking without pain"
      );

      removeCustomRecommendation(field, "Bilateral knee clicking without pain");
      expect(loadCustomRecommendations(field)).not.toContain(
        "Bilateral knee clicking without pain"
      );
      expect(loadFavoriteRecommendations(field)).not.toContain(
        "Bilateral knee clicking without pain"
      );
    });
  });

  describe("favorite recommendations", () => {
    it("toggles favorite recommendations on and off", () => {
      const field = "treatmentPlan.proposedProcedure";
      const rec = "Right TKR with cruciate-retaining implant";

      expect(isFavoriteRecommendation(loadFavoriteRecommendations(field), rec)).toBe(
        false
      );

      const toggledOn = toggleFavoriteRecommendation(field, rec);
      expect(toggledOn.isFavorite).toBe(true);
      expect(loadFavoriteRecommendations(field)).toContain(rec);

      const toggledOff = toggleFavoriteRecommendation(field, rec);
      expect(toggledOff.isFavorite).toBe(false);
      expect(loadFavoriteRecommendations(field)).not.toContain(rec);
    });
  });

  describe("sortRecommendationsWithFavorites", () => {
    it("pins favorites to the very top of all recommendations", () => {
      const all = [
        "Normal active & passive ROM",
        "Mild joint effusion with tenderness",
        "Severe crepitus on flexion",
        "Ligament laxity: positive Lachman",
      ];
      const favs = [
        "Severe crepitus on flexion",
        "Ligament laxity: positive Lachman",
      ];

      const result = sortRecommendationsWithFavorites(all, favs);

      expect(result.favoriteOptions).toEqual([
        "Severe crepitus on flexion",
        "Ligament laxity: positive Lachman",
      ]);
      expect(result.standardOptions).toEqual([
        "Normal active & passive ROM",
        "Mild joint effusion with tenderness",
      ]);
      // First 2 items MUST be the favorites!
      expect(result.sortedOptions[0]).toBe("Severe crepitus on flexion");
      expect(result.sortedOptions[1]).toBe("Ligament laxity: positive Lachman");
      expect(result.sortedOptions[2]).toBe("Normal active & passive ROM");
      expect(result.sortedOptions[3]).toBe("Mild joint effusion with tenderness");
    });

    it("handles empty favorites gracefully without changing order", () => {
      const all = ["Item 1", "Item 2", "Item 3"];
      const result = sortRecommendationsWithFavorites(all, []);
      expect(result.favoriteOptions).toEqual([]);
      expect(result.standardOptions).toEqual(["Item 1", "Item 2", "Item 3"]);
      expect(result.sortedOptions).toEqual(["Item 1", "Item 2", "Item 3"]);
    });

    it("handles case-insensitive matching for favorites", () => {
      const all = ["Ice pack 15 mins", "Rest for 3 days"];
      const favs = ["ice pack 15 mins"];
      const result = sortRecommendationsWithFavorites(all, favs);
      expect(result.favoriteOptions).toEqual(["Ice pack 15 mins"]);
      expect(result.standardOptions).toEqual(["Rest for 3 days"]);
      expect(result.sortedOptions[0]).toBe("Ice pack 15 mins");
    });
  });
});

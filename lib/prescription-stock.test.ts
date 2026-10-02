import { describe, it, expect, vi } from "vitest";
import {
  findMatchingDrugItem,
  applyPrescriptionStockMovements,
} from "./prescription-stock.server";
import type { Medicine } from "./types";

describe("Prescription Stock Management", () => {
  describe("findMatchingDrugItem", () => {
    it("finds medicine by exact normalizedName", async () => {
      const mockItem = {
        id: "med-1",
        clinicId: "clinic-1",
        name: "Paracetamol 650 mg",
        normalizedName: "paracetamol 650 mg",
        stockQuantity: 100,
      };

      const mockTx = {
        drugCatalogItem: {
          findFirst: vi.fn().mockResolvedValue(mockItem),
        },
      } as any;

      const result = await findMatchingDrugItem(mockTx, "clinic-1", "Paracetamol 650 mg");
      expect(result).toEqual(mockItem);
      expect(mockTx.drugCatalogItem.findFirst).toHaveBeenCalledWith({
        where: { clinicId: "clinic-1", normalizedName: "paracetamol 650 mg" },
      });
    });

    it("finds medicine with dosage spacing difference like '650mg' vs '650 mg'", async () => {
      const mockItem = {
        id: "med-1",
        clinicId: "clinic-1",
        name: "Paracetamol 650 mg",
        normalizedName: "paracetamol 650 mg",
        stockQuantity: 100,
      };

      const mockTx = {
        drugCatalogItem: {
          findFirst: vi
            .fn()
            .mockResolvedValueOnce(null) // exact normalized 'paracetamol 650mg'
            .mockResolvedValueOnce(null) // exact case-insensitive
            .mockResolvedValueOnce(mockItem), // spaced normalized 'paracetamol 650 mg'
        },
      } as any;

      const result = await findMatchingDrugItem(mockTx, "clinic-1", "Paracetamol 650mg");
      expect(result).toEqual(mockItem);
    });

    it("strips formulation prefix like 'Tab. Dolo 650'", async () => {
      const mockItem = {
        id: "med-2",
        clinicId: "clinic-1",
        name: "Dolo 650",
        normalizedName: "dolo 650",
        stockQuantity: 80,
      };

      const mockTx = {
        drugCatalogItem: {
          findFirst: vi
            .fn()
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(mockItem), // stripped formulation
        },
      } as any;

      const result = await findMatchingDrugItem(mockTx, "clinic-1", "Tab. Dolo 650");
      expect(result).toEqual(mockItem);
    });

    it("finds common drug alias for brand/generic lookup", async () => {
      const mockItem = {
        id: "med-3",
        clinicId: "clinic-1",
        name: "Paracetamol 650 mg",
        normalizedName: "paracetamol 650 mg",
        genericName: "Paracetamol",
        stockQuantity: 50,
      };

      const mockTx = {
        drugCatalogItem: {
          findFirst: vi
            .fn()
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(mockItem), // common drug match
        },
      } as any;

      const result = await findMatchingDrugItem(mockTx, "clinic-1", "Dolo 650");
      expect(result).toEqual(mockItem);
    });
  });

  describe("applyPrescriptionStockMovements", () => {
    it("reverses previous consultation movements and deducts new medicines", async () => {
      const existingMovement = {
        id: "mov-old",
        drugCatalogItemId: "med-1",
        quantity: -10, // previous deduction was 10
      };

      const mockCatalogItem = {
        id: "med-1",
        clinicId: "clinic-1",
        name: "Dolo 650 mg tablet",
        normalizedName: "dolo 650 mg tablet",
        stockQuantity: 90, // was 90 after 10 deducted earlier
      };

      const mockTx = {
        stockMovement: {
          findMany: vi.fn().mockResolvedValue([existingMovement]),
          deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
          create: vi.fn().mockResolvedValue({ id: "mov-new" }),
        },
        drugCatalogItem: {
          update: vi.fn().mockResolvedValue({}),
          findFirst: vi.fn().mockResolvedValue(mockCatalogItem),
        },
      } as any;

      const prescribed: Medicine[] = [
        {
          name: "Dolo 650 mg tablet",
          dosage: "1 tablet",
          frequency: "Twice daily",
          duration: "5 days", // 2 * 5 = 10 units
          quantity: "10",
        },
      ];

      await applyPrescriptionStockMovements(mockTx, {
        clinicId: "clinic-1",
        consultationId: "cons-101",
        patientName: "John Doe",
        patientMrn: "MRN-1001",
        medicines: prescribed,
        userId: "user-1",
      });

      // 1. Verifies reversal of old movement
      expect(mockTx.drugCatalogItem.update).toHaveBeenCalledWith({
        where: { id: "med-1" },
        data: { stockQuantity: { increment: 10 } },
      });
      expect(mockTx.stockMovement.deleteMany).toHaveBeenCalledWith({
        where: {
          clinicId: "clinic-1",
          reference: "cons-101",
          type: "consultation",
        },
      });

      // 2. Verifies deduction of new medicines (90 - 10 = 80)
      expect(mockTx.drugCatalogItem.update).toHaveBeenCalledWith({
        where: { id: "med-1" },
        data: {
          stockQuantity: 80,
          usageCount: { increment: 1 },
        },
      });

      // 3. Verifies creation of new StockMovement record
      expect(mockTx.stockMovement.create).toHaveBeenCalledWith({
        data: {
          clinicId: "clinic-1",
          drugCatalogItemId: "med-1",
          type: "consultation",
          quantity: -10,
          balanceAfter: 80,
          reference: "cons-101",
          notes: "Dispensed to John Doe (MRN-1001) — Dolo 650 mg tablet (10 units)",
          createdById: "user-1",
        },
      });
    });

    it("clamps balanceAfter to 0 if quantity exceeds available stock", async () => {
      const mockCatalogItem = {
        id: "med-2",
        clinicId: "clinic-1",
        name: "Augmentin 625 Duo",
        normalizedName: "augmentin 625 duo",
        stockQuantity: 4, // only 4 left
      };

      const mockTx = {
        stockMovement: {
          findMany: vi.fn().mockResolvedValue([]),
          create: vi.fn().mockResolvedValue({ id: "mov-new" }),
        },
        drugCatalogItem: {
          update: vi.fn().mockResolvedValue({}),
          findFirst: vi.fn().mockResolvedValue(mockCatalogItem),
        },
      } as any;

      const prescribed: Medicine[] = [
        {
          name: "Augmentin 625 Duo",
          dosage: "1 tablet",
          frequency: "Twice daily",
          duration: "5 days",
          quantity: "10", // prescribes 10
        },
      ];

      await applyPrescriptionStockMovements(mockTx, {
        clinicId: "clinic-1",
        consultationId: "cons-102",
        patientName: "Jane Smith",
        patientMrn: "MRN-1002",
        medicines: prescribed,
        userId: "user-1",
      });

      // Stock should clamp to 0
      expect(mockTx.drugCatalogItem.update).toHaveBeenCalledWith({
        where: { id: "med-2" },
        data: {
          stockQuantity: 0,
          usageCount: { increment: 1 },
        },
      });

      expect(mockTx.stockMovement.create).toHaveBeenCalledWith({
        data: {
          clinicId: "clinic-1",
          drugCatalogItemId: "med-2",
          type: "consultation",
          quantity: -10,
          balanceAfter: 0,
          reference: "cons-102",
          notes: "Dispensed to Jane Smith (MRN-1002) — Augmentin 625 Duo (10 units)",
          createdById: "user-1",
        },
      });
    });
  });
});

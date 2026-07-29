-- Remove in-house pharmacy / stock inventory (not part of local clinic EMR scope)

DROP TABLE IF EXISTS "DispenseItem";
DROP TABLE IF EXISTS "Dispense";
DROP TABLE IF EXISTS "StockLot";

DROP TYPE IF EXISTS "DispenseStatus";

ALTER TABLE "DrugCatalogItem" DROP COLUMN IF EXISTS "reorderLevel";

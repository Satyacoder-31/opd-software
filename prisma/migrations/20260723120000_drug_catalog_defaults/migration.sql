-- Default prescribing fields for clinic drug dictionary entries.
ALTER TABLE "DrugCatalogItem"
  ADD COLUMN "dosage" TEXT,
  ADD COLUMN "route" TEXT,
  ADD COLUMN "frequency" TEXT,
  ADD COLUMN "duration" TEXT,
  ADD COLUMN "quantity" TEXT,
  ADD COLUMN "instructions" TEXT;

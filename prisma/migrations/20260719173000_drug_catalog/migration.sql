-- Clinic-specific drug dictionary entries and usage ranking.
CREATE TABLE "DrugCatalogItem" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DrugCatalogItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DrugCatalogItem_clinicId_normalizedName_key"
  ON "DrugCatalogItem"("clinicId", "normalizedName");

CREATE INDEX "DrugCatalogItem_clinicId_isActive_usageCount_idx"
  ON "DrugCatalogItem"("clinicId", "isActive", "usageCount");

CREATE INDEX "DrugCatalogItem_clinicId_name_idx"
  ON "DrugCatalogItem"("clinicId", "name");

ALTER TABLE "DrugCatalogItem"
  ADD CONSTRAINT "DrugCatalogItem_clinicId_fkey"
  FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

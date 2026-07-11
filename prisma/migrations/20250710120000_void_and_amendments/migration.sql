-- AlterTable
ALTER TABLE "Consultation" ADD COLUMN IF NOT EXISTS "amendmentReason" TEXT;
ALTER TABLE "Consultation" ADD COLUMN IF NOT EXISTS "amendedAt" TIMESTAMP(3);
ALTER TABLE "Consultation" ADD COLUMN IF NOT EXISTS "amendedById" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "voidReason" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "voidedAt" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "voidedById" TEXT;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Consultation_amendedById_fkey'
  ) THEN
    ALTER TABLE "Consultation"
      ADD CONSTRAINT "Consultation_amendedById_fkey"
      FOREIGN KEY ("amendedById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Invoice_voidedById_fkey'
  ) THEN
    ALTER TABLE "Invoice"
      ADD CONSTRAINT "Invoice_voidedById_fkey"
      FOREIGN KEY ("voidedById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

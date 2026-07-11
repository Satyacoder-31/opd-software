-- Phase 5 schema additions

ALTER TABLE "Clinic" ADD COLUMN IF NOT EXISTS "gstin" TEXT;
ALTER TABLE "Clinic" ADD COLUMN IF NOT EXISTS "nextInvoiceSeq" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "dateOfBirth" DATE;

ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "taxRate" DECIMAL(5,2);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "taxAmount" DECIMAL(10,2);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "taxableAmount" DECIMAL(10,2);

CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_clinicId_invoiceNumber_key"
  ON "Invoice"("clinicId", "invoiceNumber");

CREATE TABLE IF NOT EXISTS "FeeItem" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FeeItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FeeItem_clinicId_idx" ON "FeeItem"("clinicId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FeeItem_clinicId_fkey'
  ) THEN
    ALTER TABLE "FeeItem"
      ADD CONSTRAINT "FeeItem_clinicId_fkey"
      FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "PrescriptionTemplate" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "doctorId" TEXT,
  "name" TEXT NOT NULL,
  "medicines" JSONB NOT NULL,
  "advice" TEXT,
  "followUp" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PrescriptionTemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PrescriptionTemplate_clinicId_idx" ON "PrescriptionTemplate"("clinicId");
CREATE INDEX IF NOT EXISTS "PrescriptionTemplate_doctorId_idx" ON "PrescriptionTemplate"("doctorId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PrescriptionTemplate_clinicId_fkey'
  ) THEN
    ALTER TABLE "PrescriptionTemplate"
      ADD CONSTRAINT "PrescriptionTemplate_clinicId_fkey"
      FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PrescriptionTemplate_doctorId_fkey'
  ) THEN
    ALTER TABLE "PrescriptionTemplate"
      ADD CONSTRAINT "PrescriptionTemplate_doctorId_fkey"
      FOREIGN KEY ("doctorId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ConsultationAttachment" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "consultationId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "uploadedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConsultationAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ConsultationAttachment_consultationId_idx"
  ON "ConsultationAttachment"("consultationId");
CREATE INDEX IF NOT EXISTS "ConsultationAttachment_clinicId_idx"
  ON "ConsultationAttachment"("clinicId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ConsultationAttachment_clinicId_fkey'
  ) THEN
    ALTER TABLE "ConsultationAttachment"
      ADD CONSTRAINT "ConsultationAttachment_clinicId_fkey"
      FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ConsultationAttachment_consultationId_fkey'
  ) THEN
    ALTER TABLE "ConsultationAttachment"
      ADD CONSTRAINT "ConsultationAttachment_consultationId_fkey"
      FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ConsultationAttachment_uploadedById_fkey'
  ) THEN
    ALTER TABLE "ConsultationAttachment"
      ADD CONSTRAINT "ConsultationAttachment_uploadedById_fkey"
      FOREIGN KEY ("uploadedById") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

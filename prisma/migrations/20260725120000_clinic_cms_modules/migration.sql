-- Excellent Local Clinic CMS: scheduling, ICD, messaging, lab, pharmacy, payments, ABHA

ALTER TYPE "PaymentMode" ADD VALUE IF NOT EXISTS 'online';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'partial';

DO $$ BEGIN
  CREATE TYPE "NotificationChannel" AS ENUM ('sms', 'whatsapp');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationStatus" AS ENUM ('pending', 'sent', 'failed', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "LabOrderStatus" AS ENUM ('ordered', 'collected', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "LabItemStatus" AS ENUM ('pending', 'collected', 'resulted', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DispenseStatus" AS ENUM ('pending', 'dispensed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "InvoicePaymentStatus" AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Clinic" ADD COLUMN IF NOT EXISTS "messagingConfig" JSONB;
ALTER TABLE "Clinic" ADD COLUMN IF NOT EXISTS "razorpayKeyId" TEXT;

ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "abhaNumber" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "abhaAddress" TEXT;

ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "doctorId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "checkedInAt" TIMESTAMP(3);

ALTER TABLE "Consultation" ADD COLUMN IF NOT EXISTS "diagnosisCodes" JSONB;
ALTER TABLE "Consultation" ADD COLUMN IF NOT EXISTS "referral" JSONB;

ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "razorpayOrderId" TEXT;

ALTER TABLE "FeeItem" ADD COLUMN IF NOT EXISTS "hsnSac" TEXT;

ALTER TABLE "DrugCatalogItem" ADD COLUMN IF NOT EXISTS "reorderLevel" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "InvoicePayment" (
  "id" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "paymentMode" "PaymentMode" NOT NULL,
  "status" "InvoicePaymentStatus" NOT NULL DEFAULT 'completed',
  "razorpayPaymentId" TEXT,
  "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvoicePayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StockLot" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "drugCatalogItemId" TEXT NOT NULL,
  "batchNumber" TEXT NOT NULL,
  "expiryDate" DATE NOT NULL,
  "quantity" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockLot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Dispense" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "prescriptionId" TEXT NOT NULL,
  "status" "DispenseStatus" NOT NULL DEFAULT 'pending',
  "dispensedById" TEXT,
  "dispensedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Dispense_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DispenseItem" (
  "id" TEXT NOT NULL,
  "dispenseId" TEXT NOT NULL,
  "medicineName" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "stockLotId" TEXT,
  CONSTRAINT "DispenseItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "NotificationLog" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "patientId" TEXT,
  "channel" "NotificationChannel" NOT NULL,
  "templateKey" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "status" "NotificationStatus" NOT NULL DEFAULT 'pending',
  "payload" JSONB,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LabTest" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "sampleType" TEXT,
  "feeAmount" DECIMAL(10,2),
  "feeItemId" TEXT,
  "hsnSac" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LabTest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LabOrder" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "consultationId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "status" "LabOrderStatus" NOT NULL DEFAULT 'ordered',
  "notes" TEXT,
  "orderedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LabOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LabOrderItem" (
  "id" TEXT NOT NULL,
  "labOrderId" TEXT NOT NULL,
  "labTestId" TEXT NOT NULL,
  "status" "LabItemStatus" NOT NULL DEFAULT 'pending',
  "resultValue" TEXT,
  "resultUnit" TEXT,
  "resultNotes" TEXT,
  "resultedAt" TIMESTAMP(3),
  "resultedById" TEXT,
  CONSTRAINT "LabOrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PortalOtp" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PortalOtp_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Appointment_clinicId_scheduledAt_idx" ON "Appointment"("clinicId", "scheduledAt");
CREATE INDEX IF NOT EXISTS "Appointment_doctorId_idx" ON "Appointment"("doctorId");

CREATE INDEX IF NOT EXISTS "InvoicePayment_invoiceId_idx" ON "InvoicePayment"("invoiceId");
CREATE INDEX IF NOT EXISTS "StockLot_clinicId_drugCatalogItemId_idx" ON "StockLot"("clinicId", "drugCatalogItemId");
CREATE INDEX IF NOT EXISTS "StockLot_clinicId_expiryDate_idx" ON "StockLot"("clinicId", "expiryDate");
CREATE INDEX IF NOT EXISTS "Dispense_clinicId_status_idx" ON "Dispense"("clinicId", "status");
CREATE INDEX IF NOT EXISTS "Dispense_prescriptionId_idx" ON "Dispense"("prescriptionId");
CREATE INDEX IF NOT EXISTS "DispenseItem_dispenseId_idx" ON "DispenseItem"("dispenseId");
CREATE INDEX IF NOT EXISTS "NotificationLog_clinicId_createdAt_idx" ON "NotificationLog"("clinicId", "createdAt");
CREATE INDEX IF NOT EXISTS "NotificationLog_patientId_idx" ON "NotificationLog"("patientId");
CREATE INDEX IF NOT EXISTS "LabTest_clinicId_isActive_idx" ON "LabTest"("clinicId", "isActive");
CREATE INDEX IF NOT EXISTS "LabTest_clinicId_name_idx" ON "LabTest"("clinicId", "name");
CREATE INDEX IF NOT EXISTS "LabOrder_clinicId_status_idx" ON "LabOrder"("clinicId", "status");
CREATE INDEX IF NOT EXISTS "LabOrder_consultationId_idx" ON "LabOrder"("consultationId");
CREATE INDEX IF NOT EXISTS "LabOrder_patientId_idx" ON "LabOrder"("patientId");
CREATE INDEX IF NOT EXISTS "LabOrderItem_labOrderId_idx" ON "LabOrderItem"("labOrderId");
CREATE INDEX IF NOT EXISTS "LabOrderItem_labTestId_idx" ON "LabOrderItem"("labTestId");
CREATE INDEX IF NOT EXISTS "PortalOtp_clinicId_phone_idx" ON "PortalOtp"("clinicId", "phone");
CREATE INDEX IF NOT EXISTS "PortalOtp_expiresAt_idx" ON "PortalOtp"("expiresAt");

DO $$ BEGIN
  ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctorId_fkey"
    FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_invoiceId_fkey"
    FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "StockLot" ADD CONSTRAINT "StockLot_clinicId_fkey"
    FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "StockLot" ADD CONSTRAINT "StockLot_drugCatalogItemId_fkey"
    FOREIGN KEY ("drugCatalogItemId") REFERENCES "DrugCatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Dispense" ADD CONSTRAINT "Dispense_clinicId_fkey"
    FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Dispense" ADD CONSTRAINT "Dispense_prescriptionId_fkey"
    FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Dispense" ADD CONSTRAINT "Dispense_dispensedById_fkey"
    FOREIGN KEY ("dispensedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DispenseItem" ADD CONSTRAINT "DispenseItem_dispenseId_fkey"
    FOREIGN KEY ("dispenseId") REFERENCES "Dispense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DispenseItem" ADD CONSTRAINT "DispenseItem_stockLotId_fkey"
    FOREIGN KEY ("stockLotId") REFERENCES "StockLot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_clinicId_fkey"
    FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LabTest" ADD CONSTRAINT "LabTest_clinicId_fkey"
    FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LabTest" ADD CONSTRAINT "LabTest_feeItemId_fkey"
    FOREIGN KEY ("feeItemId") REFERENCES "FeeItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_clinicId_fkey"
    FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_consultationId_fkey"
    FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_orderedById_fkey"
    FOREIGN KEY ("orderedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LabOrderItem" ADD CONSTRAINT "LabOrderItem_labOrderId_fkey"
    FOREIGN KEY ("labOrderId") REFERENCES "LabOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LabOrderItem" ADD CONSTRAINT "LabOrderItem_labTestId_fkey"
    FOREIGN KEY ("labTestId") REFERENCES "LabTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LabOrderItem" ADD CONSTRAINT "LabOrderItem_resultedById_fkey"
    FOREIGN KEY ("resultedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PortalOtp" ADD CONSTRAINT "PortalOtp_clinicId_fkey"
    FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PortalOtp" ADD CONSTRAINT "PortalOtp_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

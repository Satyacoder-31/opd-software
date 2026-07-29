-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('walkin', 'staff', 'portal');

-- AlterTable Clinic: public listing + booking settings
ALTER TABLE "Clinic"
  ADD COLUMN IF NOT EXISTS "slug" TEXT,
  ADD COLUMN IF NOT EXISTS "isPublicListed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "city" TEXT,
  ADD COLUMN IF NOT EXISTS "bookingEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "cancelCutoffHours" INTEGER NOT NULL DEFAULT 2;

CREATE UNIQUE INDEX IF NOT EXISTS "Clinic_slug_key" ON "Clinic"("slug");

-- AlterTable User: public doctor profile fields
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "specialty" TEXT,
  ADD COLUMN IF NOT EXISTS "consultationFee" DECIMAL(10, 2);

-- AlterTable Appointment
ALTER TABLE "Appointment"
  ADD COLUMN IF NOT EXISTS "bookingSource" "BookingSource" NOT NULL DEFAULT 'walkin',
  ADD COLUMN IF NOT EXISTS "slotEnd" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reasonForVisit" TEXT;

ALTER TABLE "Appointment" ALTER COLUMN "createdById" DROP NOT NULL;

-- Backfill bookingSource from type for existing rows
UPDATE "Appointment"
SET "bookingSource" = CASE
  WHEN "type" = 'scheduled' THEN 'staff'::"BookingSource"
  ELSE 'walkin'::"BookingSource"
END
WHERE "bookingSource" = 'walkin' AND "type" = 'scheduled';

CREATE INDEX IF NOT EXISTS "Appointment_doctorId_scheduledAt_idx" ON "Appointment"("doctorId", "scheduledAt");
CREATE INDEX IF NOT EXISTS "Appointment_patientId_scheduledAt_idx" ON "Appointment"("patientId", "scheduledAt");

-- Partial unique: one active booking per doctor slot
CREATE UNIQUE INDEX IF NOT EXISTS "Appointment_doctor_slot_active_unique"
  ON "Appointment" ("doctorId", "scheduledAt")
  WHERE "doctorId" IS NOT NULL
    AND "scheduledAt" IS NOT NULL
    AND "status" NOT IN ('cancelled', 'no_show');

-- PortalAccount
CREATE TABLE IF NOT EXISTS "PortalAccount" (
  "id" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PortalAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PortalAccount_phone_key" ON "PortalAccount"("phone");

-- ClinicPatient
CREATE TABLE IF NOT EXISTS "ClinicPatient" (
  "id" TEXT NOT NULL,
  "portalAccountId" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClinicPatient_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ClinicPatient_patientId_key" ON "ClinicPatient"("patientId");
CREATE UNIQUE INDEX IF NOT EXISTS "ClinicPatient_portalAccountId_clinicId_key" ON "ClinicPatient"("portalAccountId", "clinicId");
CREATE INDEX IF NOT EXISTS "ClinicPatient_clinicId_idx" ON "ClinicPatient"("clinicId");

ALTER TABLE "ClinicPatient"
  ADD CONSTRAINT "ClinicPatient_portalAccountId_fkey"
  FOREIGN KEY ("portalAccountId") REFERENCES "PortalAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClinicPatient"
  ADD CONSTRAINT "ClinicPatient_clinicId_fkey"
  FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClinicPatient"
  ADD CONSTRAINT "ClinicPatient_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DoctorAvailability
CREATE TABLE IF NOT EXISTS "DoctorAvailability" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "slotDuration" INTEGER NOT NULL DEFAULT 15,
  "maxPerSlot" INTEGER NOT NULL DEFAULT 1,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DoctorAvailability_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DoctorAvailability_doctorId_dayOfWeek_startTime_key"
  ON "DoctorAvailability"("doctorId", "dayOfWeek", "startTime");
CREATE INDEX IF NOT EXISTS "DoctorAvailability_clinicId_doctorId_idx"
  ON "DoctorAvailability"("clinicId", "doctorId");

ALTER TABLE "DoctorAvailability"
  ADD CONSTRAINT "DoctorAvailability_clinicId_fkey"
  FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DoctorAvailability"
  ADD CONSTRAINT "DoctorAvailability_doctorId_fkey"
  FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DoctorLeave
CREATE TABLE IF NOT EXISTS "DoctorLeave" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DoctorLeave_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DoctorLeave_doctorId_date_key" ON "DoctorLeave"("doctorId", "date");
CREATE INDEX IF NOT EXISTS "DoctorLeave_clinicId_doctorId_idx" ON "DoctorLeave"("clinicId", "doctorId");

ALTER TABLE "DoctorLeave"
  ADD CONSTRAINT "DoctorLeave_clinicId_fkey"
  FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DoctorLeave"
  ADD CONSTRAINT "DoctorLeave_doctorId_fkey"
  FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- PortalOtp: make clinic/patient optional; add portalAccountId
ALTER TABLE "PortalOtp" ALTER COLUMN "clinicId" DROP NOT NULL;
ALTER TABLE "PortalOtp" ALTER COLUMN "patientId" DROP NOT NULL;
ALTER TABLE "PortalOtp" ADD COLUMN IF NOT EXISTS "portalAccountId" TEXT;

CREATE INDEX IF NOT EXISTS "PortalOtp_portalAccountId_idx" ON "PortalOtp"("portalAccountId");
CREATE INDEX IF NOT EXISTS "PortalOtp_phone_idx" ON "PortalOtp"("phone");

ALTER TABLE "PortalOtp"
  ADD CONSTRAINT "PortalOtp_portalAccountId_fkey"
  FOREIGN KEY ("portalAccountId") REFERENCES "PortalAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

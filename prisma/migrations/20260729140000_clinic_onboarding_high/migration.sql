-- High clinic onboarding fields
CREATE TYPE "ClinicType" AS ENUM ('solo', 'multi_doctor', 'polyclinic', 'specialty', 'hospital_opd');

ALTER TABLE "Clinic"
  ADD COLUMN IF NOT EXISTS "clinicType" "ClinicType" NOT NULL DEFAULT 'solo',
  ADD COLUMN IF NOT EXISTS "logoUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "clinicHours" JSONB,
  ADD COLUMN IF NOT EXISTS "website" TEXT,
  ADD COLUMN IF NOT EXISTS "mapsUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "landmark" TEXT,
  ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "termsVersion" TEXT;

-- Grandfather existing clinics for DPDP consent
UPDATE "Clinic"
SET
  "termsAcceptedAt" = COALESCE("termsAcceptedAt", "createdAt"),
  "termsVersion" = COALESCE("termsVersion", '2026-07-1')
WHERE "termsAcceptedAt" IS NULL;

-- Medium clinic onboarding fields
CREATE TYPE "BusinessEntity" AS ENUM ('sole_prop', 'partnership', 'pvt_ltd', 'trust', 'other');

ALTER TABLE "Clinic"
  ADD COLUMN IF NOT EXISTS "addressLine1" TEXT,
  ADD COLUMN IF NOT EXISTS "addressLine2" TEXT,
  ADD COLUMN IF NOT EXISTS "area" TEXT,
  ADD COLUMN IF NOT EXISTS "state" TEXT,
  ADD COLUMN IF NOT EXISTS "pincode" TEXT,
  ADD COLUMN IF NOT EXISTS "pan" TEXT,
  ADD COLUMN IF NOT EXISTS "businessEntity" "BusinessEntity",
  ADD COLUMN IF NOT EXISTS "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "facilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "phoneVerifiedAt" TIMESTAMP(3);

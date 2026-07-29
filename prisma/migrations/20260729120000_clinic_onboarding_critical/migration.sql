-- Critical clinic onboarding: contact fields + setup tracking
ALTER TABLE "Clinic"
  ADD COLUMN IF NOT EXISTS "email" TEXT,
  ADD COLUMN IF NOT EXISTS "whatsapp" TEXT,
  ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "onboardingSkippedAt" TIMESTAMP(3);

-- Existing clinics skip the new wizard
UPDATE "Clinic"
SET "onboardingCompletedAt" = "createdAt"
WHERE "onboardingCompletedAt" IS NULL;

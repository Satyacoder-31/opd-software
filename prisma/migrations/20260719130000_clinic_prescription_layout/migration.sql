-- Clinic-wide visual layout for printed prescriptions.
ALTER TABLE "Clinic"
  ADD COLUMN IF NOT EXISTS "prescriptionLayout" TEXT NOT NULL DEFAULT 'classic';

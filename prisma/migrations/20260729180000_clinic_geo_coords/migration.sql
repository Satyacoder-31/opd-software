-- Clinic geo coordinates for genuine location tracking
ALTER TABLE "Clinic"
  ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

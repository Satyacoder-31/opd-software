-- Row-Level Security policies for multi-tenant clinic isolation
-- Run after Prisma migrate: psql $DIRECT_URL -f prisma/migrations/rls.sql

CREATE OR REPLACE FUNCTION auth_clinic_id() RETURNS text AS $$
  SELECT "clinicId" FROM "User"
  WHERE "supabaseAuthId" = auth.uid()::text
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Clinic: users can read their own clinic
ALTER TABLE "Clinic" ENABLE ROW LEVEL SECURITY;
CREATE POLICY clinic_read_own ON "Clinic"
  FOR SELECT USING (id = auth_clinic_id());

-- User: users can read colleagues in same clinic
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_clinic_isolation ON "User"
  FOR ALL USING ("clinicId" = auth_clinic_id())
  WITH CHECK ("clinicId" = auth_clinic_id());

-- Patient
ALTER TABLE "Patient" ENABLE ROW LEVEL SECURITY;
CREATE POLICY patient_clinic_isolation ON "Patient"
  FOR ALL USING ("clinicId" = auth_clinic_id())
  WITH CHECK ("clinicId" = auth_clinic_id());

-- Appointment
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
CREATE POLICY appointment_clinic_isolation ON "Appointment"
  FOR ALL USING ("clinicId" = auth_clinic_id())
  WITH CHECK ("clinicId" = auth_clinic_id());

-- Consultation
ALTER TABLE "Consultation" ENABLE ROW LEVEL SECURITY;
CREATE POLICY consultation_clinic_isolation ON "Consultation"
  FOR ALL USING ("clinicId" = auth_clinic_id())
  WITH CHECK ("clinicId" = auth_clinic_id());

-- Prescription
ALTER TABLE "Prescription" ENABLE ROW LEVEL SECURITY;
CREATE POLICY prescription_clinic_isolation ON "Prescription"
  FOR ALL USING ("clinicId" = auth_clinic_id())
  WITH CHECK ("clinicId" = auth_clinic_id());

-- Invoice
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoice_clinic_isolation ON "Invoice"
  FOR ALL USING ("clinicId" = auth_clinic_id())
  WITH CHECK ("clinicId" = auth_clinic_id());

-- AuditLog
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_log_clinic_isolation ON "AuditLog"
  FOR ALL USING ("clinicId" = auth_clinic_id())
  WITH CHECK ("clinicId" = auth_clinic_id());

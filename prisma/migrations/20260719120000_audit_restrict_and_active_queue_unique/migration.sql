-- Preserve audit history when a user row would be deleted.
-- Soft-deactivate staff instead of hard-deleting users that appear in AuditLog.
ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_actorId_fkey";
ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- At most one active (waiting / in_progress) queue entry per patient per clinic day.
CREATE UNIQUE INDEX IF NOT EXISTS "Appointment_active_patient_day_uidx"
ON "Appointment" ("clinicId", "patientId", "queueDate")
WHERE status IN ('waiting', 'in_progress');

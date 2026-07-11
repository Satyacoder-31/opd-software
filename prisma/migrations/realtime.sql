-- Enable Supabase Realtime for the appointment queue
-- Run after rls.sql: psql $DIRECT_URL -f prisma/migrations/realtime.sql

ALTER PUBLICATION supabase_realtime ADD TABLE "Appointment";

ALTER TABLE "Appointment" REPLICA IDENTITY FULL;

GRANT SELECT ON "Appointment" TO authenticated;

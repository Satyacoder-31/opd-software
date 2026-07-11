-- AlterTable
ALTER TABLE "Consultation" ADD COLUMN "clinicalPresentation" JSONB;
ALTER TABLE "Consultation" ADD COLUMN "patientHistory" JSONB;
ALTER TABLE "Consultation" ADD COLUMN "examination" JSONB;
ALTER TABLE "Consultation" ADD COLUMN "investigationResults" JSONB;
ALTER TABLE "Consultation" ADD COLUMN "medicalCertificate" JSONB;

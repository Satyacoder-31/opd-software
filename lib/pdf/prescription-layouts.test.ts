import { describe, expect, it } from "vitest";
import { renderPrescriptionPdf } from "@/lib/pdf";
import { PRESCRIPTION_LAYOUTS } from "@/lib/prescription-layouts";
import type { Medicine } from "@/lib/types";

const sampleMedicines: Medicine[] = [
  {
    name: "Amoxicillin 500 mg",
    dosage: "1 capsule",
    frequency: "Three times daily",
    duration: "5 days",
    instructions: "After meals",
  },
  {
    name: "Paracetamol 650 mg",
    dosage: "1 tablet",
    frequency: "As needed",
    duration: "3 days",
  },
];

describe("prescription PDF layouts", () => {
  it.each(PRESCRIPTION_LAYOUTS.map((layout) => [layout.id, layout.name]))(
    "renders %s (%s) to a non-empty PDF",
    async (layoutId) => {
      const buffer = await renderPrescriptionPdf({
        clinicName: "Maple Care Multispecialty Clinic",
        clinicPhone: "+91 191 245 6789",
        clinicAddress:
          "2nd Floor, Sunrise Plaza, Gandhi Nagar, Jammu, Jammu & Kashmir – 180004, India",
        clinicEmail: "care@maplecareclinic.com",
        doctorName: "Aditi Sharma",
        doctorQualifications: "MBBS, MD (General Medicine)",
        doctorSpecialization: "Consultant Physician",
        doctorExperience: "12 Years",
        doctorRegistrationNo: "KMC 45218",
        date: "19 Jul 2026",
        patientName: "Rahul Mehta",
        patientAge: "34 yrs",
        patientGender: "Male",
        patientMrn: "MRN-10482",
        patientPhone: "+91 99887 76655",
        diagnosis: "Acute pharyngitis",
        medicines: sampleMedicines,
        advice: "Warm saline gargles\nRest",
        followUp: "Review in 5 days",
        layout: layoutId,
      });

      expect(buffer.byteLength).toBeGreaterThan(1000);
      expect(Buffer.from(buffer).subarray(0, 4).toString()).toBe("%PDF");
    },
    30_000
  );
});

import { describe, expect, it } from "vitest";
import { renderOutpatientSummaryPdf } from "@/lib/pdf";
import type { Medicine } from "@/lib/types";

const sampleMedicines: Medicine[] = [
  {
    name: "Tab ETOSHINE 90 MG",
    dosage: "1 tablet",
    frequency: "1-0-1",
    duration: "5 days",
    instructions: "After meals (खाने के बाद)",
  },
  {
    name: "Tab PAN 40 MG",
    dosage: "1 tablet",
    frequency: "1-0-0",
    duration: "5 days",
    instructions: "30 mins before breakfast (खाली पेट)",
  },
  {
    name: "Sachet CALCIROL 60K",
    dosage: "1 sachet",
    frequency: "Once a week",
    duration: "4 weeks",
    instructions: "With warm milk after dinner",
  },
];

describe("renderOutpatientSummaryPdf", () => {
  it("renders Apollo-standard outpatient summary & prescription to valid PDF bytes", async () => {
    const buffer = await renderOutpatientSummaryPdf({
      clinicName: "Apollo Hospitals - Department of Orthopaedics",
      clinicPhone: "+91 80 2630 4050",
      clinicAddress: "154/11, Opposite IIM-B, Bannerghatta Road, Bangalore - 560076",
      clinicEmail: "ortho@apollohospitals.com",
      doctorName: "Dr. Rajesh Malhotra",
      doctorSpecialty: "Senior Consultant - Joint Replacement & Arthroscopy",
      doctorEmail: "rajesh.m@apollohospitals.com",
      doctorQualifications: "MBBS, MS (Ortho), FRCS (Glasgow)",
      doctorRegistrationNo: "KMC 67890",
      date: "27 Oct 2026",
      patientName: "Sunita Sharma",
      patientDob: "14 May 1974",
      patientAge: "52 yrs",
      patientGender: "Female",
      patientAddress: "Flat 402, Green Glen Layout, Bellandur, Bangalore",
      patientPhone: "+91 98450 12345",
      patientUhid: "AP-BLR-0098421",
      opNumber: "OP-44281",
      visitDate: "27 Oct 2026",
      patientAllergies: "Diclofenac (Severe Skin Rash), Sulfa Drugs",
      chiefComplaints: "Severe pain and morning stiffness in both knees for 6 months\nDifficulty in walking and climbing stairs",
      historyOfPresentIllness: "Gradual onset over 2 years, exacerbated by squatting and cold weather. No history of trauma.",
      currentMedications: "Tab Metformin 500mg BD for Type 2 Diabetes",
      physicalExamination: "Bilateral medial joint line tenderness (+), joint crepitus on passive flexion.\nNo active joint effusion or warmth. ROM: Right 0-110°, Left 0-115°.",
      diagnosis: "Bilateral Osteoarthritis Knee (Grade 2/3) with Acute Joint Flare",
      diagnosisType: "M17.0 - Primary Bilateral Osteoarthritis",
      investigationResults: "X-Ray Both Knees (Standing AP & Lateral): Moderate medial compartment joint space narrowing with subchondral sclerosis.",
      labs: "Serum Uric Acid: 5.2 mg/dL · Serum Creatinine: 0.88 mg/dL · Vitamin D3: 18.4 ng/mL (Deficient)",
      medicines: sampleMedicines,
      advice: "Strictly avoid squatting, sitting cross-legged, and frequent stair climbing.\nCold pack application for 15 minutes twice daily during acute pain.\nStart isometric quadriceps strengthening exercises daily after pain subsides.",
      followUp: "Review after 7 days with repeat symptoms assessment",
      language: "en",
    });

    expect(buffer.byteLength).toBeGreaterThan(1000);
    expect(Buffer.from(buffer).subarray(0, 4).toString()).toBe("%PDF");
  });

  it("renders outpatient summary with safe allergy status and empty labs/imaging", async () => {
    const buffer = await renderOutpatientSummaryPdf({
      clinicName: "Apollo Clinic",
      clinicPhone: "+91 98765 43210",
      clinicAddress: "Sector 14, Gurgaon",
      doctorName: "Dr. Anita Desai",
      date: "27 Oct 2026",
      patientName: "Vikram Singhal",
      patientAge: "28 yrs",
      patientGender: "Male",
      patientPhone: "+91 91234 56789",
      patientUhid: "AP-GGN-11223",
      visitDate: "27 Oct 2026",
      patientAllergies: null,
      diagnosis: "Acute Viral Upper Respiratory Tract Infection",
      medicines: [],
      advice: "Warm saline gargles\nDrink warm water",
      followUp: "SOS if fever persists",
    });

    expect(buffer.byteLength).toBeGreaterThan(1000);
    expect(Buffer.from(buffer).subarray(0, 4).toString()).toBe("%PDF");
  });
});

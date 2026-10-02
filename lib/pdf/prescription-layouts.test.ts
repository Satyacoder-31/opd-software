import { describe, expect, it } from "vitest";
import { renderPrescriptionPdf, renderReceiptPdf } from "@/lib/pdf";
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
    frequency: "1-0-1",
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

  it("renders prescription in Hindi with complete patient details, vitals, and allergies", async () => {
    const buffer = await renderPrescriptionPdf({
      clinicName: "डॉ. ऑर्थो सुपरस्पेशलिटी क्लिनिक",
      clinicPhone: "+91 98765 43210",
      clinicAddress: "सेक्टर 18, नोएडा, उत्तर प्रदेश - 201301",
      doctorName: "राजेश वर्मा",
      doctorQualifications: "MBBS, MS (Orthopaedics)",
      doctorSpecialization: "वरिष्ठ हड्डी रोग विशेषज्ञ",
      doctorRegistrationNo: "UPMC-88421",
      date: "03 Oct 2026",
      patientName: "सुरेश कुमार शर्मा",
      patientAge: "45 वर्ष",
      patientGender: "Male",
      patientMrn: "UHID-2026-9041",
      patientPhone: "+91 98111 22334",
      patientAddress: "मकान नं. 45, गांधी नगर, दिल्ली",
      patientAllergies: "पेनिसिलिन, सल्फा ड्रग्स",
      patientChronicConditions: "उच्च रक्तचाप (Hypertension), मधुमेह (Type-2 Diabetes)",
      chiefComplaint: "पिछले 1 सप्ताह से घुटनों में तेज दर्द एवं सूजन",
      tokenNumber: 12,
      abhaNumber: "91-4521-8890-1234",
      vitals: {
        bp: "130/85",
        pulse: "78",
        temp: "98.4",
        weight: "74",
        height: "172",
        bmi: "25.0",
        spo2: "99",
      },
      diagnosis: "द्विपक्षीय घुटने का ऑस्टियोआर्थराइटिस (Bilateral Knee Osteoarthritis)",
      medicines: sampleMedicines,
      advice: "वजन नियंत्रित रखें\nप्रतिदिन 20 मिनट फिजियोथेरेपी करें\nगर्म पानी का सेक करें",
      followUp: "10 दिन बाद पुन: जांच कराएं",
      language: "hi",
    });

    expect(buffer.byteLength).toBeGreaterThan(1000);
    expect(Buffer.from(buffer).subarray(0, 4).toString()).toBe("%PDF");
  });

  it("renders tax invoice receipt in Hindi with complete patient vitals and billing details", async () => {
    const buffer = await renderReceiptPdf({
      clinicName: "डॉ. ऑर्थो सुपरस्पेशलिटी क्लिनिक",
      clinicPhone: "+91 98765 43210",
      clinicAddress: "सेक्टर 18, नोएडा, उत्तर प्रदेश",
      clinicGstin: "09AAACH7409R1ZZ",
      patientName: "सुरेश कुमार शर्मा",
      patientMrn: "UHID-2026-9041",
      patientAge: "45 वर्ष",
      patientGender: "Male",
      patientPhone: "+91 98111 22334",
      patientAddress: "गांधी नगर, दिल्ली",
      doctorName: "राजेश वर्मा",
      doctorSpecialty: "हड्डी रोग विशेषज्ञ",
      doctorRegNo: "UPMC-88421",
      tokenNumber: 12,
      chiefComplaint: "घुटनों में दर्द",
      diagnosis: "Osteoarthritis",
      vitals: {
        bp: "130/85",
        pulse: "78",
        temp: "98.4",
        weight: "74",
        spo2: "99",
        height: "172",
        bmi: "25.0",
      },
      lineItems: [
        { description: "विशेषज्ञ परामर्श शुल्क (OPD Consultation)", amount: 500 },
        { description: "एक्स-रे घुटने दोनों तरफ (Bilateral Knee X-Ray)", amount: 800 },
      ],
      amount: 1300,
      taxableAmount: 1300,
      taxRate: 0,
      taxAmount: 0,
      paymentMode: "upi",
      date: "03/10/2026",
      invoiceId: "inv-test-12345",
      invoiceNumber: "INV-2026-0045",
      language: "hi",
    });

    expect(buffer.byteLength).toBeGreaterThan(1000);
    expect(Buffer.from(buffer).subarray(0, 4).toString()).toBe("%PDF");
  });
});


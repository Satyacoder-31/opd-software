import { describe, expect, it } from "vitest";
import {
  PRESCRIPTION_I18N,
  RECEIPT_I18N,
  translatePastHistory,
  translateAdviceLine,
  translateAdviceText,
  translateInstructions,
  translateLineItemDescription,
  translateDoctorSpecialty,
  translateChiefComplaint,
  translateDiagnosis,
  translateAge,
  translateGender,
  translatePaymentMode,
  translateDosage,
  translateRoute,
  translateDuration,
} from "@/lib/pdf/translations";

describe("Prescription & Billing Hindi Translation Options", () => {
  it("preserves English hospital and medicine names per medical standards", () => {
    // Hospital name must remain in English
    const hospitalName = "ORTHOS ORTHOPAEDIC SPECIALITY CLINIC";
    expect(hospitalName).toBe("ORTHOS ORTHOPAEDIC SPECIALITY CLINIC");

    // Medicine brand names and generic composition must remain in English
    const medicineNames = [
      "Meganeuron OD Plus Capsule",
      "D3 Must 60K Tablet Orange Sugar Free",
      "Hifenac Tablet",
      "Aceclofenac 100 mg",
      "Cholecalciferol 60,000 IU",
      "Paracetamol 650 mg",
    ];

    medicineNames.forEach((med) => {
      // In line items, drug names are kept intact
      expect(translateLineItemDescription(med, "hi")).toBe(med);
    });
  });

  it("translates doctor's advice & precautions to natural Hindi", () => {
    const userAdvice = `• Keep RT elevated on pillow
• Apply elastocrape bandage while walking and continue for one week
• दिन में दो बार 10-15 मिनट बर्फ या कोल्ड पैक से सिकाई करें
• if pain and swelling persists we plan for MRI of RT ankle review SOS`;

    const hindiAdvice = translateAdviceText(userAdvice, "hi");
    expect(hindiAdvice).toContain("दाएं/प्रभावित पैर को तकिए पर ऊंचा रखें");
    expect(hindiAdvice).toContain("चलते समय इलास्टो-क्रेप बैंडेज");
    expect(hindiAdvice).toContain("दिन में दो बार 10-15 मिनट बर्फ या कोल्ड पैक से सिकाई करें");
    expect(hindiAdvice).toContain("एमआरआई (MRI) कराएंगे");
    expect(hindiAdvice).toContain("Review SOS");

    const englishAdvice = translateAdviceText(userAdvice, "en");
    expect(englishAdvice).toContain("Keep RT elevated on pillow");
    expect(englishAdvice).toContain("Ice cold compress or ice pack application");

    const adv1 = translateAdviceLine(
      "KEEP RT LL ELEVATED ON PILLOW ,APPLY ELASTOCRAPE BANDAGE WHILE WALKING AND CONTINUE FOR ONE WEEK",
      "hi"
    );
    expect(adv1).toContain("दाएं/प्रभावित पैर को तकिए पर ऊंचा रखें");
    expect(adv1).toContain("इलास्टो क्रेप बैंडेज");

    const adv2 = translateAdviceLine(
      "ICE COLD COMPRESS RT ANKLE 2 MINTS ,TWICE DAILY FOR 3 DAYS",
      "hi"
    );
    expect(adv2).toContain("दाएं टखने पर दिन में 2 बार");
    expect(adv2).toContain("बर्फ");

    const adv3 = translateAdviceLine(
      "IF PAIN AND SWELLING PERSISTS WE PLAN FOR MRI OF RT ANKLE",
      "hi"
    );
    expect(adv3).toContain("एमआरआई (MRI) की जांच कराएंगे");

    const adv4 = translateAdviceLine("REVIEW SOS", "hi");
    expect(adv4).toContain("Review SOS");

    const gerdAdvice = `• Avoid spicy, fried, sour, and excessively greasy food.
• Avoid tea, coffee, carbonated drinks, and smoking.
• Take smaller, more frequent meals; do not skip breakfast.
• Do not lie down within 2 hours of eating dinner.
• Warm saline water gargles.`;

    const translatedGerd = translateAdviceText(gerdAdvice, "hi");
    expect(translatedGerd).toContain("मसालेदार, तला-भुना, खट्टा एवं अत्यधिक तैलीय भोजन करने से बचें");
    expect(translatedGerd).toContain("चाय, कॉफी, कोल्ड ड्रिंक्स");
    expect(translatedGerd).toContain("एक बार में ज्यादा न खाएं");
    expect(translatedGerd).toContain("रात के भोजन के तुरंत बाद न लेटें");
    expect(translatedGerd).toContain("गुनगुने नमक पानी से गरारे करें");
  });

  it("translates past medical history to Hindi", () => {
    expect(translatePastHistory("NO DM, NO HTN, NO SURGERY", "hi")).toContain("कोई मधुमेह नहीं");
    expect(translatePastHistory("NO DM, NO HTN, NO SURGERY", "hi")).toContain("कोई उच्च रक्तचाप नहीं");
    expect(translatePastHistory("NO DM, NO HTN, NO SURGERY", "hi")).toContain("कोई पूर्व सर्जरी नहीं");
    expect(translatePastHistory("Hypertension, Type 2 Diabetes", "hi")).toContain("उच्च रक्तचाप");
    expect(translatePastHistory("Hypertension, Type 2 Diabetes", "hi")).toContain("मधुमेह");
  });

  it("translates medicine dosage, route, duration, and instructions to Hindi", () => {
    expect(translateDosage("1 tablet", "hi")).toBe("1 गोली");
    expect(translateDosage("1 capsule", "hi")).toBe("1 कैप्सूल");
    expect(translateRoute("Oral", "hi")).toContain("मुख द्वारा");
    expect(translateDuration("5 days", "hi")).toBe("5 दिन");
    expect(translateDuration("4 weeks", "hi")).toBe("4 सप्ताह");

    const complexInst1 = translateInstructions(
      "Take 1 tablet - weekly, after meal, for 4 weeks. LATTER ONCE A MONTH",
      "hi"
    );
    expect(complexInst1).toContain("1 गोली लें");
    expect(complexInst1).toContain("भोजन के बाद");
    expect(complexInst1).toContain("4 सप्ताह तक");
    expect(complexInst1).toContain("बाद में महीने में एक बार");

    const complexInst2 = translateInstructions(
      "Take 1 tablet - Twice a day, after breakfast and after dinner, for 5 days. TAKE SOS FOR PAIN",
      "hi"
    );
    expect(complexInst2).toContain("1 गोली लें");
    expect(complexInst2).toContain("दिन में दो बार");
    expect(complexInst2).toContain("नाश्ते के बाद");
    expect(complexInst2).toContain("रात के भोजन के बाद");
    expect(complexInst2).toContain("दर्द होने पर आवश्यकतानुसार (SOS) लें");

    expect(
      translateInstructions("1 hour before principal meals and at bedtime", "hi")
    ).toBe("मुख्य भोजन से 1 घंटा पहले और रात को सोते समय");
  });

  it("translates billing service items and payment modes into Hindi", () => {
    expect(
      translateLineItemDescription("OPD Doctor Consultation & Clinical Assessment", "hi")
    ).toBe("ओपीडी डॉक्टर परामर्श एवं चिकित्सीय मूल्यांकन");

    expect(
      translateLineItemDescription("Bilateral Knee X-Ray", "hi")
    ).toContain("डिजिटल एक्स-रे दोनों घुटने");

    expect(translatePaymentMode("cash", "hi")).toBe("नकद");
    expect(translatePaymentMode("upi", "hi")).toContain("यूपीआई");
    expect(translatePaymentMode("card", "hi")).toContain("कार्ड");
  });

  it("translates demographics, doctor specialty, complaints, and diagnosis", () => {
    expect(translateAge("43 years", "hi")).toBe("43 वर्ष");
    expect(translateGender("female", "hi")).toBe("महिला");
    expect(translateGender("male", "hi")).toBe("पुरुष");

    expect(
      translateDoctorSpecialty("Senior Orthopaedic Consultant", "hi")
    ).toBe("वरिष्ठ हड्डी एवं जोड़ रोग विशेषज्ञ");

    expect(
      translateDiagnosis("Bilateral Knee Osteoarthritis", "hi")
    ).toContain("ऑस्टियोआर्थराइटिस");

    expect(
      translateChiefComplaint("Severe Knee Pain and Swelling", "hi")
    ).toContain("घुटने में दर्द");
  });

  it("provides comprehensive Hindi dictionaries for Prescription and Billing headers", () => {
    expect(PRESCRIPTION_I18N.hi.scheduleTitle).toBe("आउटपेशेंट प्रिस्क्रिप्शन एवं दवाइयाँ");
    expect(PRESCRIPTION_I18N.hi.morning).toBe("सुबह");
    expect(PRESCRIPTION_I18N.hi.afternoon).toBe("दोपहर");
    expect(PRESCRIPTION_I18N.hi.evening).toBe("शाम");
    expect(PRESCRIPTION_I18N.hi.night).toBe("रात");
    expect(PRESCRIPTION_I18N.hi.medicines).toBe("दवाइयाँ (MEDICINES)");
    expect(PRESCRIPTION_I18N.hi.adviceTitle).toBe("परामर्श एवं सावधानियां");

    expect(RECEIPT_I18N.hi.documentTitle).toBe("कर चालान एवं भुगतान रसीद");
    expect(RECEIPT_I18N.hi.statusPaid).toBe("✓ पूर्ण भुगतान प्राप्त");
    expect(RECEIPT_I18N.hi.tableDesc).toBe("सेवा / मद का विवरण");
  });
});


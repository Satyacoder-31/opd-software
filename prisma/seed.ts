import {
  PrismaClient,
  Role,
  Gender,
  AppointmentStatus,
  AppointmentType,
  BookingSource,
  ClinicType,
} from "@prisma/client";

const prisma = new PrismaClient();

const orthopedicConsultation = {
  chiefComplaint: "Severe right knee pain and stiffness with difficulty in walking for 2 weeks",
  diagnosis: "Primary Osteoarthritis of Right Knee (Grade III Kellgren-Lawrence) with medial joint compartment narrowing",
  diagnosisCodes: [
    {
      code: "M17.11",
      display: "Unilateral primary osteoarthritis, right knee",
      type: "primary" as const,
    },
    {
      code: "M23.22",
      display: "Derangement of meniscus due to old tear or injury, right knee",
      type: "secondary" as const,
    },
  ],
  notes:
    "Patient advised conservative management with anti-inflammatory cover, quadriceps strengthening physiotherapy, and lifestyle modification. Discussed intra-articular viscosupplementation vs total knee arthroplasty if conservative measures fail.",
  vitals: {
    bp: "124/80",
    pulse: "76",
    temp: "98.4",
    weight: "74",
    height: "172",
    spo2: "99",
  },
  clinicalPresentation: {
    historyOfPresentIllness:
      "Patient reports gradual onset of right knee pain over the last 6 months, severely aggravated over past 2 weeks following prolonged standing. Experiencing morning stiffness lasting ~20 minutes, crepitus on stair climbing, and mild joint effusion.",
    onset: "Insidious, aggravated acutely",
    duration: "2 weeks flare-up (chronic 6 months)",
  },
  patientHistory: {
    pastMedical: "Hypertension (well-controlled on Telmisartan 40mg)",
    pastSurgical: "Appendectomy (2014)",
    allergies: "No known drug allergies",
    medications: "Tab Telmisartan 40mg OD",
    familyHistory: "Mother had bilateral osteoarthritis of knees",
    socialHistory: "Non-smoker, active lifestyle",
  },
  examination: {
    general: "Comfortable at rest, antalgic gait favoring right lower limb",
    cardiovascular: "S1 S2 normal, regular rhythm",
    respiratory: "Clear bilateral breath sounds",
    abdomen: "Soft, non-tender",
    musculoskeletal: {
      site: "Right Knee",
      deformity: "Mild genu varum alignment",
      swelling: "Mild joint effusion present, suprapatellar pouch fullness",
      tenderness: "Marked medial joint line tenderness (+), patellofemoral crepitus (+)",
      rangeOfMotion: "Active ROM 0° to 110° (terminal flexion painful), full extension maintained",
      stabilityTests: "Lachman test (-), Anterior drawer (-), McMurray medial joint line (+), Valgus/Varus stress stable",
    },
    neurological: "Distal neurovascular status intact, bilateral pedal pulses well palpable, sensations normal",
  },
  investigationResults: {
    labs: "ESR: 18 mm/hr, CRP: 4.2 mg/L, Serum Uric Acid: 5.4 mg/dL (Normal)",
    imaging: "Digital X-Ray Right Knee (AP & Lateral Weight-Bearing): Medial compartment joint space narrowing, subchondral sclerosis, medial tibial plateau osteophytes.",
    other: "Knee alignment mechanical axis: 4° varus deviation.",
  },
  medicalCertificate: {
    diagnosisForCertificate: "Right Knee Osteoarthritis with Acute Synovitis",
    restFrom: "2026-09-23",
    restTo: "2026-09-28",
    fitnessStatus: "Advised active rest and avoidance of weight-bearing strain for 5 days",
    remarks: "Review for clinical reassessment with repeat range-of-motion evaluation",
  },
};

const orthopedicPrescription = {
  medicines: [
    {
      name: "Aceclofenac 100 mg + Paracetamol 325 mg",
      dosage: "1 tablet",
      route: "Oral",
      frequency: "Twice daily",
      duration: "5 days",
      quantity: "10",
      instructions: "Strictly after meals with plenty of water",
    },
    {
      name: "Thiocolchicoside 4 mg",
      dosage: "1 capsule",
      route: "Oral",
      frequency: "Twice daily",
      duration: "5 days",
      quantity: "10",
      instructions: "After breakfast and dinner (Muscle relaxant)",
    },
    {
      name: "Calcium Citrate Malate 1250 mg + Vitamin D3 1000 IU",
      dosage: "1 tablet",
      route: "Oral",
      frequency: "Once daily",
      duration: "30 days",
      quantity: "30",
      instructions: "Post-dinner with milk or water",
    },
    {
      name: "Diclofenac Diethylamine 1.16% Gel",
      dosage: "Gentle topical application",
      route: "Topical",
      frequency: "Thrice daily",
      duration: "10 days",
      quantity: "1 tube (30g)",
      instructions: "Apply over right knee without vigorous rubbing",
    },
  ],
  advice:
    "1. Isometric quadriceps and straight leg raising (SLR) exercises — 3 sets daily.\n2. Strict avoidance of sitting cross-legged on floor and deep squatting.\n3. Use western commode.\n4. Cold ice pack compression for 15 minutes twice daily after walking.\n5. Hinged knee brace support during outdoor mobility.",
  followUp: "Review after 10 days for physiotherapy progression and pain score check",
};

async function main() {
  const demoAuthId = "00000000-0000-4000-a000-000000000001";

  // Clean existing demo seed data safely
  await prisma.invoicePayment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.consultationAttachment.deleteMany();
  await prisma.labOrderItem.deleteMany();
  await prisma.labOrder.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.clinicPatient.deleteMany();
  await prisma.portalOtp.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.feeItem.deleteMany();
  await prisma.drugCatalogItem.deleteMany();
  await prisma.doctorAvailability.deleteMany();
  await prisma.doctorLeave.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.clinic.deleteMany();

  const clinic = await prisma.clinic.create({
    data: {
      name: "Dr Orthos — Advanced Orthopedic Center",
      slug: "dr-orthos",
      phone: "9876543210",
      address: "Suite 401, Dr Orthos Healthcare Pavilion, Marine Lines, Mumbai 400020",
      addressLine1: "Suite 401, Dr Orthos Healthcare Pavilion",
      addressLine2: "Marine Lines",
      area: "South Mumbai",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400020",
      email: "contact@drorthos.in",
      whatsapp: "9876543210",
      isPublicListed: true,
      bookingEnabled: true,
      clinicType: ClinicType.specialty,
      specialties: [
        "Orthopedics",
        "Joint Replacement",
        "Arthroscopy & Sports Injuries",
        "Spine Care",
        "Fracture & Trauma",
        "Pediatric Orthopedics",
      ],
      facilities: [
        "Digital High-Resolution X-Ray",
        "Dedicated Orthopedic Physiotherapy",
        "Minimally Invasive Daycare Unit",
        "Plaster & Splinting Room",
        "Ultrasound-Guided Injection Suite",
      ],
      languages: ["English", "Hindi", "Marathi"],
      description:
        "Premier center for advanced orthopedic surgery, arthroscopy, robotic joint replacement, and comprehensive musculoskeletal rehabilitation.",
      users: {
        create: [
          {
            name: "Dr. Orthos Lead Consultant",
            email: "admin@demo.local",
            role: Role.owner,
            supabaseAuthId: demoAuthId,
            qualifications: "MBBS, MS (Orthopedics), DNB, Fellowship in Arthroscopy & Joint Replacement",
            registrationNo: "MCI-48291-MH",
            specialty: "Orthopedic Surgeon & Joint Specialist",
            designation: "Chief Orthopedic Consultant",
            consultationFee: 800.0,
            phone: "9876543210",
          },
        ],
      },
    },
    include: { users: true },
  });

  const admin = clinic.users[0];

  // Seed Orthopedic Fee Schedule
  await prisma.feeItem.createMany({
    data: [
      { clinicId: clinic.id, name: "Orthopedic Consultation", amount: 800.0 },
      { clinicId: clinic.id, name: "Orthopedic Follow-up Consultation (within 14 days)", amount: 400.0 },
      { clinicId: clinic.id, name: "Digital X-Ray — Knee (AP & Lateral Weight-Bearing)", amount: 700.0 },
      { clinicId: clinic.id, name: "Intra-Articular Knee Injection Procedure", amount: 1500.0 },
      { clinicId: clinic.id, name: "Plaster Cast Application (Below Knee / Forearm)", amount: 1800.0 },
      { clinicId: clinic.id, name: "Orthopedic Dressing & Suture Removal", amount: 350.0 },
    ],
  });

  // Seed Standard Orthopedic Drug Catalog
  await prisma.drugCatalogItem.createMany({
    data: [
      {
        clinicId: clinic.id,
        name: "Aceclofenac 100 mg + Paracetamol 325 mg",
        normalizedName: "aceclofenac 100 mg + paracetamol 325 mg",
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Twice daily",
        duration: "5 days",
        instructions: "After meals",
        usageCount: 42,
      },
      {
        clinicId: clinic.id,
        name: "Thiocolchicoside 4 mg",
        normalizedName: "thiocolchicoside 4 mg",
        dosage: "1 capsule",
        route: "Oral",
        frequency: "Twice daily",
        duration: "5 days",
        instructions: "After food (Muscle relaxant)",
        usageCount: 31,
      },
      {
        clinicId: clinic.id,
        name: "Etoricoxib 90 mg",
        normalizedName: "etoricoxib 90 mg",
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Once daily",
        duration: "5 days",
        instructions: "After dinner for acute joint inflammation",
        usageCount: 28,
      },
      {
        clinicId: clinic.id,
        name: "Calcium Citrate Malate 1250 mg + Vitamin D3 1000 IU",
        normalizedName: "calcium citrate malate 1250 mg + vitamin d3 1000 iu",
        dosage: "1 tablet",
        route: "Oral",
        frequency: "Once daily",
        duration: "30 days",
        instructions: "Post-dinner with water",
        usageCount: 65,
      },
      {
        clinicId: clinic.id,
        name: "Pregabalin 75 mg + Methylcobalamin 1500 mcg",
        normalizedName: "pregabalin 75 mg + methylcobalamin 1500 mcg",
        dosage: "1 capsule",
        route: "Oral",
        frequency: "Once daily at bedtime",
        duration: "15 days",
        instructions: "For radicular nerve pain / sciatica",
        usageCount: 22,
      },
      {
        clinicId: clinic.id,
        name: "Diclofenac Diethylamine 1.16% Gel",
        normalizedName: "diclofenac diethylamine 1.16% gel",
        dosage: "Topical application",
        route: "Topical",
        frequency: "Thrice daily",
        duration: "10 days",
        instructions: "Apply over affected joint without vigorous massage",
        usageCount: 50,
      },
    ],
  });

  // Seed Doctor Availability (Monday to Saturday, 09:00 - 13:00 and 16:00 - 20:00)
  const days = [1, 2, 3, 4, 5, 6];
  for (const day of days) {
    await prisma.doctorAvailability.create({
      data: {
        clinicId: clinic.id,
        doctorId: admin.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "13:00",
        slotDuration: 15,
        maxPerSlot: 1,
      },
    });
    await prisma.doctorAvailability.create({
      data: {
        clinicId: clinic.id,
        doctorId: admin.id,
        dayOfWeek: day,
        startTime: "16:00",
        endTime: "20:00",
        slotDuration: 15,
        maxPerSlot: 1,
      },
    });
  }

  // Seed sample orthopedic patients
  const patients = await Promise.all(
    [
      {
        name: "Rahul Mehta",
        phone: "9988776655",
        age: 52,
        gender: Gender.male,
        allergies: "No known drug allergies",
        chronicConditions: "Hypertension",
      },
      {
        name: "Rajesh Kumar",
        phone: "9811111111",
        age: 45,
        gender: Gender.male,
        allergies: "None",
        chronicConditions: "Lumbar Disc Herniation (L4-L5)",
      },
      {
        name: "Priya Sharma",
        phone: "9822222222",
        age: 28,
        gender: Gender.female,
        allergies: "Sulfa drugs",
        chronicConditions: "ACL tear right knee (Sports injury)",
      },
      {
        name: "Amit Patel",
        phone: "9833333333",
        age: 36,
        gender: Gender.male,
        allergies: "None",
        chronicConditions: "Rotator cuff impingement, left shoulder",
      },
      {
        name: "Sunita Devi",
        phone: "9844444444",
        age: 64,
        gender: Gender.female,
        allergies: "Penicillin",
        chronicConditions: "Bilateral Osteoarthritis Knees",
      },
      {
        name: "Vikram Singh",
        phone: "9855555555",
        age: 31,
        gender: Gender.male,
        allergies: "None",
        chronicConditions: "Distal Radius Fracture (healing with cast)",
      },
    ].map((p, i) =>
      prisma.patient.create({
        data: {
          clinicId: clinic.id,
          mrn: `ORTHO-${new Date().getFullYear()}-${String(i + 1).padStart(4, "0")}`,
          ...p,
        },
      })
    )
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const waitingAppointments = await Promise.all(
    [
      { patient: patients[1], token: 1, reason: "Review for persistent lower backache radiating to left calf" },
      { patient: patients[2], token: 2, reason: "Post-MRI evaluation for right knee twisting injury" },
    ].map(({ patient, token, reason }) =>
      prisma.appointment.create({
        data: {
          clinicId: clinic.id,
          patientId: patient.id,
          doctorId: admin.id,
          tokenNumber: token,
          queueDate: today,
          status: AppointmentStatus.waiting,
          type: AppointmentType.scheduled,
          bookingSource: BookingSource.portal,
          reasonForVisit: reason,
          createdById: admin.id,
        },
      })
    )
  );

  const doneAppointment = await prisma.appointment.create({
    data: {
      clinicId: clinic.id,
      patientId: patients[0].id,
      doctorId: admin.id,
      tokenNumber: 3,
      queueDate: today,
      status: AppointmentStatus.done,
      type: AppointmentType.walkin,
      bookingSource: BookingSource.walkin,
      reasonForVisit: orthopedicConsultation.chiefComplaint,
      checkedInAt: new Date(),
      createdById: admin.id,
    },
  });

  const consultation = await prisma.consultation.create({
    data: {
      clinicId: clinic.id,
      appointmentId: doneAppointment.id,
      patientId: patients[0].id,
      doctorId: admin.id,
      createdById: admin.id,
      updatedById: admin.id,
      chiefComplaint: orthopedicConsultation.chiefComplaint,
      diagnosis: orthopedicConsultation.diagnosis,
      diagnosisCodes: orthopedicConsultation.diagnosisCodes,
      notes: orthopedicConsultation.notes,
      vitals: orthopedicConsultation.vitals,
      clinicalPresentation: orthopedicConsultation.clinicalPresentation,
      patientHistory: orthopedicConsultation.patientHistory,
      examination: orthopedicConsultation.examination,
      investigationResults: orthopedicConsultation.investigationResults,
      medicalCertificate: orthopedicConsultation.medicalCertificate,
      prescription: {
        create: {
          clinicId: clinic.id,
          medicines: orthopedicPrescription.medicines,
          advice: orthopedicPrescription.advice,
          followUp: orthopedicPrescription.followUp,
          createdById: admin.id,
          updatedById: admin.id,
        },
      },
    },
    include: { prescription: true },
  });

  console.log("Dr Orthos Seed complete:");
  console.log(`  Clinic: ${clinic.name} (${clinic.id}, slug: ${clinic.slug})`);
  console.log(`  Admin / Lead Surgeon: ${admin.name} (${admin.email})`);
  console.log(`  Patients: ${patients.length}`);
  console.log(
    `  Appointments: ${waitingAppointments.length + 1} (2 waiting in queue, 1 completed consultation)`
  );
  console.log(`  Consultation ID: ${consultation.id}`);
  console.log(`  Prescription ID: ${consultation.prescription?.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import {
  PrismaClient,
  Role,
  Gender,
  AppointmentStatus,
  AppointmentType,
  BookingSource,
} from "@prisma/client";

const prisma = new PrismaClient();

const dummyConsultation = {
  chiefComplaint: "Fever with sore throat for 3 days",
  diagnosis: "Acute pharyngitis (viral)",
  diagnosisCodes: [
    {
      code: "J02.9",
      display: "Acute pharyngitis, unspecified",
      type: "primary" as const,
    },
  ],
  notes:
    "Patient advised rest and hydration. No antibiotics needed unless symptoms worsen.",
  vitals: {
    bp: "118/76",
    pulse: "88",
    temp: "100.4",
    weight: "72",
    spo2: "98",
  },
  clinicalPresentation: {
    historyOfPresentIllness:
      "High-grade intermittent fever with throat pain and mild cough. No breathlessness or chest pain.",
    onset: "Sudden",
    duration: "3 days",
  },
  patientHistory: {
    pastMedical: "None significant",
    pastSurgical: "None",
    allergies: "No known drug allergies",
    medications: "None",
    familyHistory: "Father hypertensive",
    socialHistory: "Non-smoker, occasional tea",
  },
  examination: {
    general: "Mildly febrile, oriented, no pallor/icterus/cyanosis",
    cardiovascular: "S1 S2 normal, no murmur",
    respiratory: "Bilateral air entry equal, no added sounds",
    abdomen: "Soft, non-tender",
    neurological: "No focal deficit",
    other: "Pharynx congested, tonsils mildly enlarged, no exudate",
  },
  investigationResults: {
    labs: "CBC: TLC 8,200; CRP mildly elevated",
    imaging: "Not indicated",
    other: "",
  },
  medicalCertificate: {
    diagnosisForCertificate: "Acute viral pharyngitis",
    restFrom: "2026-07-29",
    restTo: "2026-07-31",
    fitnessStatus: "Unfit for duty for 3 days",
    remarks: "Review if fever persists beyond 5 days",
  },
};

const dummyPrescription = {
  medicines: [
    {
      name: "Paracetamol 650 mg",
      dosage: "1 tablet",
      route: "Oral",
      frequency: "Thrice daily",
      duration: "3 days",
      quantity: "9",
      instructions: "After food, if fever or pain",
    },
    {
      name: "Cetirizine 10 mg",
      dosage: "1 tablet",
      route: "Oral",
      frequency: "Once daily at night",
      duration: "5 days",
      quantity: "5",
      instructions: "After dinner",
    },
    {
      name: "Benzydamine mouthwash",
      dosage: "15 ml",
      route: "Gargle",
      frequency: "Thrice daily",
      duration: "5 days",
      quantity: "1 bottle",
      instructions: "Gargle and spit; do not swallow",
    },
  ],
  advice:
    "Warm saline gargles 3–4 times daily\nPlenty of fluids\nRest; avoid cold drinks\nReturn if high fever >5 days, difficulty swallowing, or breathlessness",
  followUp: "Review in 5 days or earlier if symptoms worsen",
};

async function main() {
  const demoAuthId = "00000000-0000-4000-a000-000000000001";

  await prisma.invoice.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
  await prisma.clinic.deleteMany();

  const clinic = await prisma.clinic.create({
    data: {
      name: "Green Valley Clinic",
      phone: "9876543120",
      address: "42 Green Valley Road, Andheri West, Mumbai 400058",
      users: {
        create: {
          name: "Dr. Admin Demo",
          email: "admin@demo.local",
          role: Role.owner,
          supabaseAuthId: demoAuthId,
        },
      },
    },
    include: { users: true },
  });

  const admin = clinic.users[0];

  const patients = await Promise.all(
    [
      {
        name: "Rahul Mehta",
        phone: "9988776655",
        age: 34,
        gender: Gender.male,
        allergies: "No known drug allergies",
      },
      { name: "Rajesh Kumar", phone: "9811111111", age: 45, gender: Gender.male },
      {
        name: "Priya Sharma",
        phone: "9822222222",
        age: 32,
        gender: Gender.female,
      },
      { name: "Amit Patel", phone: "9833333333", age: 28, gender: Gender.male },
      {
        name: "Sunita Devi",
        phone: "9844444444",
        age: 55,
        gender: Gender.female,
      },
      {
        name: "Vikram Singh",
        phone: "9855555555",
        age: 38,
        gender: Gender.male,
      },
    ].map((p, i) =>
      prisma.patient.create({
        data: {
          clinicId: clinic.id,
          mrn: `MRN-${new Date().getFullYear()}-${String(i + 1).padStart(4, "0")}`,
          ...p,
        },
      })
    )
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const waitingAppointments = await Promise.all(
    [
      { patient: patients[1], token: 1 },
      { patient: patients[2], token: 2 },
    ].map(({ patient, token }) =>
      prisma.appointment.create({
        data: {
          clinicId: clinic.id,
          patientId: patient.id,
          doctorId: admin.id,
          tokenNumber: token,
          queueDate: today,
          status: AppointmentStatus.waiting,
          type: AppointmentType.walkin,
          bookingSource: BookingSource.walkin,
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
      reasonForVisit: dummyConsultation.chiefComplaint,
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
      chiefComplaint: dummyConsultation.chiefComplaint,
      diagnosis: dummyConsultation.diagnosis,
      diagnosisCodes: dummyConsultation.diagnosisCodes,
      notes: dummyConsultation.notes,
      vitals: dummyConsultation.vitals,
      clinicalPresentation: dummyConsultation.clinicalPresentation,
      patientHistory: dummyConsultation.patientHistory,
      examination: dummyConsultation.examination,
      investigationResults: dummyConsultation.investigationResults,
      medicalCertificate: dummyConsultation.medicalCertificate,
      prescription: {
        create: {
          clinicId: clinic.id,
          medicines: dummyPrescription.medicines,
          advice: dummyPrescription.advice,
          followUp: dummyPrescription.followUp,
          createdById: admin.id,
          updatedById: admin.id,
        },
      },
    },
    include: { prescription: true },
  });

  console.log("Seed complete:");
  console.log(`  Clinic: ${clinic.name} (${clinic.id})`);
  console.log(`  Admin: admin@demo.local (supabaseAuthId: ${demoAuthId})`);
  console.log(`  Patients: ${patients.length}`);
  console.log(
    `  Appointments: ${waitingAppointments.length + 1} (2 waiting, 1 done)`
  );
  console.log(`  Consultation: ${consultation.id}`);
  console.log(`  Prescription: ${consultation.prescription?.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

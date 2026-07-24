import {
  PrismaClient,
  Role,
  Gender,
  AppointmentStatus,
  AppointmentType,
} from "@prisma/client";

const prisma = new PrismaClient();

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
      name: "Demo Clinic Mumbai",
      phone: "9876543210",
      address: "12 Linking Road, Bandra West, Mumbai 400050",
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
      { name: "Rajesh Kumar", phone: "9811111111", age: 45, gender: Gender.male },
      { name: "Priya Sharma", phone: "9822222222", age: 32, gender: Gender.female },
      { name: "Amit Patel", phone: "9833333333", age: 28, gender: Gender.male },
      { name: "Sunita Devi", phone: "9844444444", age: 55, gender: Gender.female },
      { name: "Vikram Singh", phone: "9855555555", age: 38, gender: Gender.male },
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

  await prisma.appointment.createMany({
    data: [
      {
        clinicId: clinic.id,
        patientId: patients[0].id,
        tokenNumber: 1,
        queueDate: today,
        status: AppointmentStatus.waiting,
        type: AppointmentType.walkin,
        createdById: admin.id,
      },
      {
        clinicId: clinic.id,
        patientId: patients[1].id,
        tokenNumber: 2,
        queueDate: today,
        status: AppointmentStatus.waiting,
        type: AppointmentType.walkin,
        createdById: admin.id,
      },
      {
        clinicId: clinic.id,
        patientId: patients[2].id,
        tokenNumber: 3,
        queueDate: today,
        status: AppointmentStatus.done,
        type: AppointmentType.walkin,
        createdById: admin.id,
      },
    ],
  });

  console.log("Seed complete:");
  console.log(`  Clinic: ${clinic.name} (${clinic.id})`);
  console.log(`  Admin: admin@demo.local (supabaseAuthId: ${demoAuthId})`);
  console.log(`  Patients: ${patients.length}`);
  console.log(`  Appointments: 3 (2 waiting, 1 done)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaClient, Role, Gender } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { DEMO_STAFF_ACCOUNTS, DEMO_PATIENT_ACCOUNTS, DEMO_STAFF_PASSWORD } from "../lib/demo-accounts";

const prisma = new PrismaClient();
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function main() {
  console.log("Starting demo accounts initialization...");

  let clinic = await prisma.clinic.findFirst({
    where: { slug: "dr-orthos" },
  });
  if (!clinic) clinic = await prisma.clinic.findFirst();

  if (!clinic) {
    console.error("No clinic found!");
    process.exit(1);
  }

  // Ensure clinic onboarding is marked completed
  await prisma.clinic.update({
    where: { id: clinic.id },
    data: {
      onboardingCompletedAt: new Date(),
    },
  });
  console.log(`Updated clinic ${clinic.name} (${clinic.slug}): onboardingCompletedAt set.`);

  // List existing Supabase users
  const { data: userList } = await adminClient.auth.admin.listUsers();
  const existingUsers = userList?.users ?? [];

  for (const staff of DEMO_STAFF_ACCOUNTS) {
    let supabaseAuthId: string;
    const existing = existingUsers.find(
      (u) => u.email?.toLowerCase() === staff.email.toLowerCase()
    );

    if (existing) {
      supabaseAuthId = existing.id;
      await adminClient.auth.admin.updateUserById(supabaseAuthId, {
        password: DEMO_STAFF_PASSWORD,
        user_metadata: { name: staff.name },
        app_metadata: {
          clinicId: clinic.id,
          role: staff.role,
          isActive: true,
        },
      });
      console.log(`Updated Supabase user: ${staff.email} (${supabaseAuthId})`);
    } else {
      const { data: created, error } = await adminClient.auth.admin.createUser({
        email: staff.email,
        password: DEMO_STAFF_PASSWORD,
        email_confirm: true,
        user_metadata: { name: staff.name },
        app_metadata: {
          clinicId: clinic.id,
          role: staff.role,
          isActive: true,
        },
      });
      if (error || !created.user) {
        console.error(`Failed to create ${staff.email}:`, error);
        continue;
      }
      supabaseAuthId = created.user.id;
      console.log(`Created Supabase user: ${staff.email} (${supabaseAuthId})`);
    }

    // Upsert into Prisma User
    const dbUser = await prisma.user.upsert({
      where: { email: staff.email },
      create: {
        clinicId: clinic.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        supabaseAuthId,
        specialty: staff.specialty,
        qualifications: staff.qualifications,
        designation: staff.designation,
        phone: staff.phone,
        consultationFee: staff.consultationFee,
        isActive: true,
      },
      update: {
        clinicId: clinic.id,
        name: staff.name,
        role: staff.role,
        supabaseAuthId,
        specialty: staff.specialty,
        qualifications: staff.qualifications,
        designation: staff.designation,
        phone: staff.phone,
        consultationFee: staff.consultationFee,
        isActive: true,
      },
    });

    console.log(`Upserted DB User: ${dbUser.name} [${dbUser.role}] -> ${dbUser.email}`);
  }

  // Provision Patient Portal Accounts & Clinic Links
  console.log("\nProvisioning Demo Patients...");
  for (const p of DEMO_PATIENT_ACCOUNTS) {
    const portalAccount = await prisma.portalAccount.upsert({
      where: { phone: p.phone },
      create: {
        phone: p.phone,
        name: p.name,
      },
      update: {
        name: p.name,
      },
    });

    const patient = await prisma.patient.findFirst({
      where: { phone: { contains: p.phone } },
    });

    if (patient) {
      await prisma.clinicPatient.upsert({
        where: { patientId: patient.id },
        create: {
          portalAccountId: portalAccount.id,
          clinicId: clinic.id,
          patientId: patient.id,
        },
        update: {
          portalAccountId: portalAccount.id,
        },
      });
      console.log(`Linked patient ${patient.name} (${patient.mrn}) -> portalAccount ${portalAccount.id}`);
    } else {
      const newPatient = await prisma.patient.create({
        data: {
          clinicId: clinic.id,
          name: p.name,
          phone: p.phone,
          age: p.age,
          gender: p.gender,
          mrn: `ORTHO-DEMO-${p.phone.slice(-4)}`,
          chronicConditions: p.condition,
        },
      });
      await prisma.clinicPatient.create({
        data: {
          portalAccountId: portalAccount.id,
          clinicId: clinic.id,
          patientId: newPatient.id,
        },
      });
      console.log(`Created & linked patient ${newPatient.name} -> portalAccount ${portalAccount.id}`);
    }
  }

  console.log("\nALL DEMO USERS AND PATIENTS INITIALIZED SUCCESSFULLY!");
}

main()
  .catch((e) => {
    console.error("Init failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

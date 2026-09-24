import { Role, Gender } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEMO_STAFF_ACCOUNTS,
  DEMO_PATIENT_ACCOUNTS,
  DEMO_STAFF_PASSWORD,
  type DemoStaffAccount,
  type DemoPatientAccount,
} from "./demo-accounts-data";

export {
  DEMO_STAFF_ACCOUNTS,
  DEMO_PATIENT_ACCOUNTS,
  DEMO_STAFF_PASSWORD,
  type DemoStaffAccount,
  type DemoPatientAccount,
};

/**
 * Self-healing provisioner: Ensures that a demo staff user exists in Supabase Auth
 * and in PostgreSQL User table linked to the demo clinic.
 */
export async function ensureDemoStaffUser(email: string) {
  const staff = DEMO_STAFF_ACCOUNTS.find((s) => s.email.toLowerCase() === email.toLowerCase());
  if (!staff) {
    throw new Error(`Unknown demo staff account: ${email}`);
  }

  const role = staff.role as Role;

  // 1. Get primary clinic (Dr Orthos)
  let clinic = await prisma.clinic.findFirst({
    where: { slug: "dr-orthos" },
  });
  if (!clinic) {
    clinic = await prisma.clinic.findFirst();
  }
  if (!clinic) {
    throw new Error("No clinic found in database. Please run seed first.");
  }

  // Ensure clinic onboarding is marked completed so users land directly on dashboard
  if (!clinic.onboardingCompletedAt) {
    await prisma.clinic.update({
      where: { id: clinic.id },
      data: { onboardingCompletedAt: new Date() },
    });
  }

  // 2. Ensure in Supabase Auth
  const admin = createAdminClient();
  let supabaseAuthId: string;

  const { data: userList } = await admin.auth.admin.listUsers();
  const existingSupabase = userList?.users?.find(
    (u) => u.email?.toLowerCase() === staff.email.toLowerCase()
  );

  if (existingSupabase) {
    supabaseAuthId = existingSupabase.id;
    // Ensure password matches demo password
    await admin.auth.admin.updateUserById(supabaseAuthId, {
      password: staff.password,
      user_metadata: { name: staff.name },
      app_metadata: {
        clinicId: clinic.id,
        role: role,
        isActive: true,
      },
    });
  } else {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: staff.email,
      password: staff.password,
      email_confirm: true,
      user_metadata: { name: staff.name },
      app_metadata: {
        clinicId: clinic.id,
        role: role,
        isActive: true,
      },
    });
    if (error || !created.user) {
      throw new Error(`Failed to create demo Supabase auth user: ${error?.message}`);
    }
    supabaseAuthId = created.user.id;
  }

  // 3. Ensure in PostgreSQL User table
  const existingUser = await prisma.user.findUnique({
    where: { email: staff.email },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        supabaseAuthId,
        name: staff.name,
        role: role,
        clinicId: clinic.id,
        isActive: true,
        specialty: staff.specialty ?? existingUser.specialty,
        qualifications: staff.qualifications ?? existingUser.qualifications,
        designation: staff.designation ?? existingUser.designation,
        phone: staff.phone ?? existingUser.phone,
        consultationFee: staff.consultationFee ?? existingUser.consultationFee,
      },
    });
  } else {
    await prisma.user.create({
      data: {
        clinicId: clinic.id,
        name: staff.name,
        email: staff.email,
        role: role,
        supabaseAuthId,
        specialty: staff.specialty,
        qualifications: staff.qualifications,
        designation: staff.designation,
        phone: staff.phone,
        consultationFee: staff.consultationFee,
        isActive: true,
      },
    });
  }

  return { email: staff.email, password: staff.password };
}

/**
 * Self-healing provisioner for patient portal demo login:
 * Ensures patient, portalAccount, and clinicPatient records exist and are linked.
 */
export async function ensureDemoPatient(phone: string) {
  const normalized = phone.replace(/\D/g, "").slice(-10);
  const patientConfig = DEMO_PATIENT_ACCOUNTS.find((p) => p.phone === normalized);

  let clinic = await prisma.clinic.findFirst({
    where: { slug: "dr-orthos" },
  });
  if (!clinic) clinic = await prisma.clinic.findFirst();

  // Find or create portalAccount
  const portalAccount = await prisma.portalAccount.upsert({
    where: { phone: normalized },
    create: {
      phone: normalized,
      name: patientConfig?.name ?? "Demo Patient",
    },
    update: {
      name: patientConfig?.name ?? undefined,
    },
  });

  // Find existing patient in DB
  let patient = await prisma.patient.findFirst({
    where: { phone: { contains: normalized } },
  });

  if (!patient && clinic) {
    patient = await prisma.patient.create({
      data: {
        clinicId: clinic.id,
        name: patientConfig?.name ?? "Demo Patient",
        phone: normalized,
        age: patientConfig?.age ?? 40,
        gender: (patientConfig?.gender as Gender) ?? Gender.male,
        mrn: `ORTHO-DEMO-${normalized.slice(-4)}`,
        chronicConditions: patientConfig?.condition ?? null,
      },
    });
  }

  if (patient && clinic) {
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
  }

  return { portalAccountId: portalAccount.id, phone: normalized };
}

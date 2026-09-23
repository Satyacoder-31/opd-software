import { Role, Gender } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";

export const DEMO_STAFF_PASSWORD = "DemoPassword2026!";

export type DemoStaffAccount = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  roleLabel: string;
  designation?: string;
  specialty?: string;
  qualifications?: string;
  consultationFee?: number;
  phone?: string;
  description: string;
  avatarColor: string;
  tagline: string;
};

export const DEMO_STAFF_ACCOUNTS: DemoStaffAccount[] = [
  {
    id: "demo-owner",
    name: "Dr. Orthos Lead Consultant",
    email: "admin@demo.local",
    password: DEMO_STAFF_PASSWORD,
    role: Role.owner,
    roleLabel: "Owner & Chief Surgeon",
    specialty: "Orthopedic Surgeon & Joint Specialist",
    qualifications: "MBBS, MS (Orthopedics), DNB, Fellowship in Arthroscopy",
    consultationFee: 800,
    phone: "9876543210",
    description: "Complete clinic ownership, surgeries, clinical consultations, invoicing & system settings.",
    avatarColor: "bg-amber-600 text-white shadow-amber-600/30",
    tagline: "Full Clinic Control",
  },
  {
    id: "demo-doctor",
    name: "Dr. Meera Rao",
    email: "doctor@demo.local",
    password: DEMO_STAFF_PASSWORD,
    role: Role.doctor,
    roleLabel: "Consulting Orthopedic Doctor",
    specialty: "Arthroscopy & Sports Injuries",
    qualifications: "MBBS, MS (Orthopedics)",
    consultationFee: 600,
    phone: "9876543211",
    description: "OPD token queue, clinical examinations, e-prescriptions, vitals & lab investigation orders.",
    avatarColor: "bg-sky-600 text-white shadow-sky-600/30",
    tagline: "Clinical OPD & Prescriptions",
  },
  {
    id: "demo-admin",
    name: "Aarav Gupta",
    email: "admin.staff@demo.local",
    password: DEMO_STAFF_PASSWORD,
    role: Role.admin,
    roleLabel: "Clinic Operations Admin",
    designation: "Practice Operations Manager",
    phone: "9876543212",
    description: "Clinic operations, staff scheduling, fee configuration, patient registry & audit logs.",
    avatarColor: "bg-purple-600 text-white shadow-purple-600/30",
    tagline: "Operations & Practice Admin",
  },
  {
    id: "demo-receptionist",
    name: "Kavita Sharma",
    email: "receptionist@demo.local",
    password: DEMO_STAFF_PASSWORD,
    role: Role.receptionist,
    roleLabel: "Front Desk & Billing",
    designation: "Senior Front Desk Executive",
    phone: "9876543213",
    description: "Patient check-in, queue token management, vitals measurement & instant invoice billing.",
    avatarColor: "bg-emerald-600 text-white shadow-emerald-600/30",
    tagline: "Front Desk, Tokens & Billing",
  },
];

export type DemoPatientAccount = {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: Gender;
  statusBadge: string;
  statusType: "success" | "warning" | "info" | "neutral";
  condition: string;
  summary: string;
  avatarColor: string;
};

export const DEMO_PATIENT_ACCOUNTS: DemoPatientAccount[] = [
  {
    id: "patient-rahul",
    name: "Rahul Mehta",
    phone: "9988776655",
    age: 52,
    gender: Gender.male,
    statusBadge: "Consultation Done · Active Rx",
    statusType: "success",
    condition: "Primary Knee Osteoarthritis (Grade III)",
    summary: "Has completed visit, full e-prescription (4 drugs), medical certificate & invoice ready.",
    avatarColor: "bg-teal-600 text-white",
  },
  {
    id: "patient-rajesh",
    name: "Rajesh Kumar",
    phone: "9811111111",
    age: 45,
    gender: Gender.male,
    statusBadge: "Live Queue · Token #1",
    statusType: "warning",
    condition: "Lumbar Disc Herniation (L4-L5)",
    summary: "Currently waiting in OPD live queue. First in line to see the consulting orthopedic surgeon.",
    avatarColor: "bg-amber-600 text-white",
  },
  {
    id: "patient-priya",
    name: "Priya Sharma",
    phone: "9822222222",
    age: 28,
    gender: Gender.female,
    statusBadge: "Live Queue · Token #2",
    statusType: "info",
    condition: "Right Knee ACL Tear (Sports Injury)",
    summary: "Token #2 in live queue. Post-MRI evaluation for knee twisting and ligament arthroscopy review.",
    avatarColor: "bg-indigo-600 text-white",
  },
  {
    id: "patient-sunita",
    name: "Sunita Devi",
    phone: "9844444444",
    age: 64,
    gender: Gender.female,
    statusBadge: "Registered Patient",
    statusType: "neutral",
    condition: "Bilateral Knee Osteoarthritis",
    summary: "Registered patient record with penicillin allergy alert, ready for appointment booking.",
    avatarColor: "bg-slate-600 text-white",
  },
];

/**
 * Self-healing provisioner: Ensures that a demo staff user exists in Supabase Auth
 * and in PostgreSQL User table linked to the demo clinic.
 */
export async function ensureDemoStaffUser(email: string) {
  const staff = DEMO_STAFF_ACCOUNTS.find((s) => s.email.toLowerCase() === email.toLowerCase());
  if (!staff) {
    throw new Error(`Unknown demo staff account: ${email}`);
  }

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
        role: staff.role,
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
        role: staff.role,
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
        role: staff.role,
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
        gender: patientConfig?.gender ?? Gender.male,
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

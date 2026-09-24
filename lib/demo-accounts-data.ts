export const DEMO_STAFF_PASSWORD = "DemoPassword2026!";

export type DemoStaffAccount = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "owner" | "doctor" | "admin" | "receptionist";
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
    role: "owner",
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
    role: "doctor",
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
    role: "admin",
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
    role: "receptionist",
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
  gender: "male" | "female" | "other";
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
    gender: "male",
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
    gender: "male",
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
    gender: "female",
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
    gender: "female",
    statusBadge: "Registered Patient",
    statusType: "neutral",
    condition: "Bilateral Knee Osteoarthritis",
    summary: "Registered patient record with penicillin allergy alert, ready for appointment booking.",
    avatarColor: "bg-slate-600 text-white",
  },
];

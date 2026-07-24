import type { Role } from "@prisma/client";

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  qualifications: string | null;
  registrationNo: string | null;
  createdAt: Date;
  updatedAt: Date;
  clinicId: string;
};

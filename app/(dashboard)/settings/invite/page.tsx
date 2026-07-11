import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireSessionUser } from "@/lib/auth";
import { InviteStaffPageClient } from "@/components/settings/InviteStaffPageClient";

export default async function InviteStaffPage() {
  const session = await requireSessionUser();
  if (session.role !== Role.admin) redirect("/queue");

  return <InviteStaffPageClient />;
}

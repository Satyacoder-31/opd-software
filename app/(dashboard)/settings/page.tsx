import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireSessionUser } from "@/lib/auth";
import { getClinicProfile, getStaffList } from "@/actions/auth";
import { listFeeItems } from "@/actions/fees";
import { SettingsClient } from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const session = await requireSessionUser();
  if (session.role !== Role.admin) redirect("/queue");

  const [clinic, staff, feeItems] = await Promise.all([
    getClinicProfile(),
    getStaffList(),
    listFeeItems(false),
  ]);

  return (
    <SettingsClient
      clinic={clinic}
      staff={staff}
      currentUserId={session.userId}
      feeItemCount={feeItems.length}
    />
  );
}

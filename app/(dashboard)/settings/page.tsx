import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireSessionUser } from "@/lib/auth";
import { getClinicProfile } from "@/actions/auth";
import { listFeeItems } from "@/actions/fees";
import { SettingsClient } from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const session = await requireSessionUser();
  if (session.role !== Role.admin) redirect("/queue");

  const [clinic, feeItems] = await Promise.all([
    getClinicProfile(),
    listFeeItems(false),
  ]);

  return (
    <SettingsClient
      clinic={clinic}
      staff={clinic.users}
      currentUserId={session.userId}
      feeItemCount={feeItems.length}
    />
  );
}

import { requireSessionUser } from "@/lib/auth";
import { getStaffList } from "@/actions/auth";
import { StaffSettingsPageClient } from "@/components/settings/StaffSettingsPageClient";

export default async function StaffSettingsPage() {
  await requireSessionUser();
  const staff = await getStaffList();

  return <StaffSettingsPageClient staff={staff} />;
}

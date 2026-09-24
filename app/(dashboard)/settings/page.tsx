import { SettingsOverview } from "@/components/settings/SettingsOverview";
import { requireSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";

export default async function SettingsPage() {
  const session = await requireSessionUser();
  return (
    <SettingsOverview
      session={session}
      showClinicAdmin={can(session, "settings.access")}
    />
  );
}

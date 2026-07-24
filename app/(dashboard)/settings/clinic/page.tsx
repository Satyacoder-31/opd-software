import { getClinicProfile } from "@/actions/auth";
import { ClinicSettingsPageClient } from "@/components/settings/ClinicSettingsPageClient";

export default async function ClinicSettingsPage() {
  const clinic = await getClinicProfile();
  return <ClinicSettingsPageClient clinic={clinic} />;
}

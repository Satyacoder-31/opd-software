import { getClinicProfile } from "@/actions/auth";
import { ClinicEditPageClient } from "@/components/settings/ClinicEditPageClient";

export default async function EditClinicSettingsPage() {
  const clinic = await getClinicProfile();
  return <ClinicEditPageClient clinic={clinic} />;
}

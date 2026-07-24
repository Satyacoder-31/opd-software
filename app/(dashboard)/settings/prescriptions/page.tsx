import { getClinicProfile } from "@/actions/auth";
import { PrescriptionLayoutsPageClient } from "@/components/settings/PrescriptionLayoutsPageClient";

export default async function PrescriptionLayoutsSettingsPage() {
  const clinic = await getClinicProfile();
  return (
    <PrescriptionLayoutsPageClient currentLayout={clinic.prescriptionLayout} />
  );
}

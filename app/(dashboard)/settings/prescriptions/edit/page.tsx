import { getClinicProfile } from "@/actions/auth";
import { PrescriptionLayoutsEdit } from "@/components/settings/PrescriptionLayoutsEdit";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";

export default async function EditPrescriptionLayoutsSettingsPage() {
  const clinic = await getClinicProfile();

  return (
    <PageShell>
      <PageHeader
        title="Edit prescription layouts"
        description="Each card shows how the page will print. Click a layout to use it."
        backHref="/settings/prescriptions"
        backLabel="Back to prescription layouts"
      />
      <PageBody>
        <PrescriptionLayoutsEdit currentLayout={clinic.prescriptionLayout} />
      </PageBody>
    </PageShell>
  );
}

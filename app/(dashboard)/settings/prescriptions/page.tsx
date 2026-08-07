import Link from "next/link";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { getClinicProfile } from "@/actions/auth";
import { PrescriptionLayoutsView } from "@/components/settings/PrescriptionLayoutsView";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";

export default async function PrescriptionLayoutsSettingsPage() {
  const clinic = await getClinicProfile();

  return (
    <PageShell>
      <PageHeader
        title="Prescription layouts"
        description="Active printed look for clinic prescriptions."
        backHref="/settings"
        backLabel="Back to settings"
        actions={
          <Button
            nativeButton={false}
            render={<Link href="/settings/prescriptions/edit" />}
            size="sm"
          >
            <Icon icon={faPen} data-icon="inline-start" />
            Edit
          </Button>
        }
      />
      <PageBody>
        <PrescriptionLayoutsView currentLayout={clinic.prescriptionLayout} />
      </PageBody>
    </PageShell>
  );
}

import Link from "next/link";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import type { Clinic } from "@prisma/client";
import { ClinicProfile } from "@/components/settings/ClinicProfile";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";

type ClinicSettingsPageClientProps = {
  clinic: Pick<
    Clinic,
    | "id"
    | "name"
    | "phone"
    | "address"
    | "email"
    | "whatsapp"
    | "gstin"
    | "clinicType"
    | "timezone"
    | "logoUrl"
    | "website"
    | "mapsUrl"
    | "landmark"
    | "addressLine1"
    | "addressLine2"
    | "area"
    | "state"
    | "pincode"
    | "pan"
    | "businessEntity"
    | "phoneVerifiedAt"
    | "city"
    | "latitude"
    | "longitude"
  >;
};

export function ClinicSettingsPageClient({
  clinic,
}: ClinicSettingsPageClientProps) {
  return (
    <PageShell>
      <PageHeader
        title="Clinic profile"
        description="Name, phone, address, and GSTIN used on invoices"
        backHref="/settings"
        backLabel="Back to settings"
        actions={
          <Button
            nativeButton={false}
            render={<Link href="/settings/clinic/edit" />}
            size="sm"
          >
            <Icon icon={faPen} data-icon="inline-start" />
            Edit
          </Button>
        }
      />
      <PageBody className="max-w-3xl">
        <Card title="Clinic details" className="border border-border">
          <ClinicProfile clinic={clinic} />
        </Card>
      </PageBody>
    </PageShell>
  );
}

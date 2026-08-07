"use client";

import { useRouter } from "next/navigation";
import type { Clinic } from "@prisma/client";
import { ClinicProfileForm } from "@/components/settings/ClinicProfileForm";
import { Card } from "@/components/ui/Card";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";

type ClinicEditPageClientProps = {
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

export function ClinicEditPageClient({ clinic }: ClinicEditPageClientProps) {
  const router = useRouter();

  return (
    <PageShell>
      <PageHeader
        title="Edit clinic profile"
        description="Update clinic details used on invoices and the public listing"
        backHref="/settings/clinic"
        backLabel="Back to clinic profile"
      />
      <PageBody className="max-w-3xl">
        <Card title="Clinic details" className="border border-border">
          <ClinicProfileForm
            clinic={clinic}
            cancelHref="/settings/clinic"
            onSuccess={() => {
              router.push("/settings/clinic");
              router.refresh();
            }}
          />
        </Card>
      </PageBody>
    </PageShell>
  );
}

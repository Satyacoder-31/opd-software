import Link from "next/link";
import { redirect } from "next/navigation";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { getClinicPublicListingSettings } from "@/actions/availability";
import { ClinicPublicListingProfile } from "@/components/settings/ClinicPublicListingProfile";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";
import { requireSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";

export default async function PublicBookingSettingsPage() {
  const session = await requireSessionUser();

  if (!can(session, "clinic.manage")) {
    if (can(session, "appointments.schedule")) {
      redirect("/settings/availability/schedules");
    }
    redirect("/settings");
  }

  const listing = await getClinicPublicListingSettings();

  return (
    <PageShell>
      <PageHeader
        title="Public booking"
        description="List your clinic in the patient directory and control online booking."
        backHref="/settings/availability"
        backLabel="Back to booking & schedules"
        actions={
          listing ? (
            <Button
              nativeButton={false}
              render={<Link href="/settings/availability/listing/edit" />}
              size="sm"
            >
              <Icon icon={faPen} data-icon="inline-start" />
              Edit
            </Button>
          ) : null
        }
      />
      <PageBody className="max-w-3xl">
        {listing ? (
          <>
            {!listing.phoneVerifiedAt ? (
              <Banner variant="info" className="mb-5">
                Verify the clinic phone before enabling public listing. Open Edit
                to send an OTP.
              </Banner>
            ) : null}
            <Card title="Listing details" className="border border-border">
              <ClinicPublicListingProfile clinic={listing} />
            </Card>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Could not load public listing settings.
          </p>
        )}
      </PageBody>
    </PageShell>
  );
}

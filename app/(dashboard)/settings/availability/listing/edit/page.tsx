import { redirect } from "next/navigation";
import { getClinicPublicListingSettings } from "@/actions/availability";
import { ClinicPhoneVerifyPanel } from "@/components/settings/ClinicPhoneVerifyPanel";
import { ClinicPublicListingForm } from "@/components/settings/ClinicPublicListingForm";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";
import { requireSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";

export default async function EditPublicBookingSettingsPage() {
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
        title="Edit public booking"
        description="Update directory listing, specialties, and online booking."
        backHref="/settings/availability/listing"
        backLabel="Back to public booking"
        className="px-4 py-5 md:px-5 md:py-6"
      />
      <PageBody className="flex w-full min-w-0 flex-col gap-6 px-4 pb-6 md:px-5 md:pb-8">
        {listing ? (
          <>
            {!listing.phoneVerifiedAt ? (
              <ClinicPhoneVerifyPanel
                phone={listing.phone}
                verifiedAt={listing.phoneVerifiedAt}
              />
            ) : null}
            <ClinicPublicListingForm clinic={listing} />
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

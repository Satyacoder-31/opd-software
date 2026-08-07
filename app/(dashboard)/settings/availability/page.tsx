import { redirect } from "next/navigation";
import {
  faCalendarDays,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import { SettingsOverviewLink } from "@/components/settings/SettingsOverviewLink";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";
import { requireSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";

export default async function BookingAndSchedulesHubPage() {
  const session = await requireSessionUser();
  const canManageClinic = can(session, "clinic.manage");
  const canSchedule = can(session, "appointments.schedule");

  if (!canManageClinic && !canSchedule) {
    redirect("/settings");
  }

  // Deep-link convenience: schedule-only users skip the hub.
  if (!canManageClinic && canSchedule) {
    redirect("/settings/availability/schedules");
  }

  return (
    <PageShell>
      <PageHeader
        title="Booking & schedules"
        description="Public directory listing and doctor hours for online booking."
        backHref="/settings"
        backLabel="Back to settings"
        className="px-4 py-5 md:px-5 md:py-6"
      />
      <PageBody className="flex w-full min-w-0 flex-col gap-3 px-4 pb-6 md:px-5 md:pb-8">
        <div className="grid gap-3 sm:grid-cols-2">
          <SettingsOverviewLink
            href="/settings/availability/listing"
            title="Public booking"
            icon={faGlobe}
          />
          <SettingsOverviewLink
            href="/settings/availability/schedules"
            title="Doctor schedules"
            icon={faCalendarDays}
          />
        </div>
      </PageBody>
    </PageShell>
  );
}

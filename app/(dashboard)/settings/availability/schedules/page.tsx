import { redirect } from "next/navigation";
import { AvailabilityManager } from "@/components/settings/AvailabilityManager";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";
import { requireSessionUser } from "@/lib/auth";
import { loadDoctorScheduleData } from "@/lib/doctor-schedule-data";
import { can } from "@/lib/rbac";

export default async function DoctorSchedulesSettingsPage() {
  const session = await requireSessionUser();
  if (!can(session, "appointments.schedule") && !can(session, "clinic.manage")) {
    redirect("/settings");
  }

  const data = await loadDoctorScheduleData(session, "view");

  return (
    <PageShell>
      <PageHeader
        title="Doctor schedules"
        description="Weekly hours and leave days used for online booking."
        backHref="/settings"
        backLabel="Back to settings"
        className="px-4 py-5 md:px-5 md:py-6"
      />
      <PageBody className="flex w-full min-w-0 flex-col gap-6 px-4 pb-6 md:px-5 md:pb-8">
        <AvailabilityManager mode="view" {...data} />
      </PageBody>
    </PageShell>
  );
}

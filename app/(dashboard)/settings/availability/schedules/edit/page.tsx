import Link from "next/link";
import { redirect } from "next/navigation";
import { AvailabilityScheduleEdit } from "@/components/settings/AvailabilityScheduleEdit";
import { Button } from "@/components/ui/Button";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";
import { requireSessionUser } from "@/lib/auth";
import { loadDoctorScheduleData } from "@/lib/doctor-schedule-data";
import { can } from "@/lib/rbac";

export default async function EditDoctorSchedulesSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ doctor?: string }>;
}) {
  const session = await requireSessionUser();
  if (!can(session, "appointments.schedule") && !can(session, "clinic.manage")) {
    redirect("/settings");
  }

  const { doctor } = await searchParams;
  const data = await loadDoctorScheduleData(session, "edit");
  const defaultDoctorId =
    doctor && data.doctors.some((d) => d.id === doctor)
      ? doctor
      : data.defaultDoctorId;

  return (
    <PageShell>
      <PageHeader
        title="Edit schedule"
        description="Add weekly hours, change slot length, or block leave days."
        backHref="/settings/availability/schedules"
        backLabel="Back to schedule"
        className="px-4 py-5 md:px-5 md:py-6"
        actions={
          <Button
            nativeButton={false}
            render={<Link href="/settings/availability/schedules" />}
            variant="secondary"
            size="sm"
          >
            Done
          </Button>
        }
      />
      <PageBody className="flex w-full min-w-0 flex-col gap-6 px-4 pb-6 md:px-5 md:pb-8">
        <AvailabilityScheduleEdit {...data} defaultDoctorId={defaultDoctorId} />
      </PageBody>
    </PageShell>
  );
}

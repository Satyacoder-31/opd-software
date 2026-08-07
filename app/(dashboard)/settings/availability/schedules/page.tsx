import Link from "next/link";
import { redirect } from "next/navigation";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { AvailabilityScheduleView } from "@/components/settings/AvailabilityScheduleView";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
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
        backHref="/settings/availability"
        backLabel="Back to booking & schedules"
        actions={
          data.doctors.length > 0 ? (
            <Button
              nativeButton={false}
              render={
                <Link
                  href={`/settings/availability/schedules/edit?doctor=${data.defaultDoctorId ?? data.doctors[0].id}`}
                />
              }
              size="sm"
            >
              <Icon icon={faPen} data-icon="inline-start" />
              Edit
            </Button>
          ) : null
        }
      />
      <PageBody className="flex w-full min-w-0 flex-col gap-6">
        <AvailabilityScheduleView {...data} />
      </PageBody>
    </PageShell>
  );
}

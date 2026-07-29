import { listScheduledAppointments } from "@/actions/appointments";
import { AppointmentsDatePicker } from "@/components/appointments/AppointmentsDatePicker";
import { AppointmentsDayBoard } from "@/components/appointments/AppointmentsDayBoard";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import { clinicTodayDate, toDateInputValue } from "@/lib/date-utils";
import Link from "next/link";

type PageProps = {
  searchParams: Promise<{ date?: string }>;
};

export default async function AppointmentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const date = params.date?.trim() || toDateInputValue(clinicTodayDate());
  const appointments = await listScheduledAppointments({ date });

  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <PageShell>
      <PageHeader
        title="Appointments"
        description={`Scheduled visits for ${dateLabel}`}
      />
      <AppointmentsDatePicker date={date} />
      <div className="px-6 py-3 text-sm text-muted-foreground md:px-8">
        Book from a{" "}
        <Link href="/patients" className="text-primary hover:underline">
          patient profile
        </Link>
        . Check in when the patient arrives to place them on today&apos;s queue.
      </div>
      <AppointmentsDayBoard
        appointments={appointments}
        dateLabel={dateLabel}
      />
    </PageShell>
  );
}

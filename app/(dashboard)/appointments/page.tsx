import {
  getAppointmentMetrics,
  listClinicDoctors,
  listScheduledAppointments,
} from "@/actions/appointments";
import { AppointmentsDatePicker } from "@/components/appointments/AppointmentsDatePicker";
import { AppointmentsDayBoard } from "@/components/appointments/AppointmentsDayBoard";
import { ScheduleAppointmentModal } from "@/components/appointments/ScheduleAppointmentModal";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import { clinicTodayDate, toDateInputValue } from "@/lib/date-utils";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import {
  faCalendarDay,
  faCalendarDays,
  faCheckCircle,
  faClock,
  faUsers,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";

type PageProps = {
  searchParams: Promise<{ date?: string; view?: string }>;
};

export default async function AppointmentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const todayValue = toDateInputValue(clinicTodayDate());
  const date = params.date?.trim() || todayValue;
  const view = (params.view?.trim() as "day" | "upcoming" | "all") || "day";

  const [appointments, doctors, metrics] = await Promise.all([
    listScheduledAppointments({ date, view }),
    listClinicDoctors(),
    getAppointmentMetrics(),
  ]);

  const dateLabel =
    view === "upcoming"
      ? "Upcoming Scheduled Visits (Next 30 Days)"
      : new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "short",
          year: "numeric",
        });

  return (
    <PageShell>
      <PageHeader
        title="Appointments &amp; Scheduling"
        description={
          view === "upcoming"
            ? "Upcoming confirmed visits across all future dates"
            : `Scheduled visits for ${dateLabel}`
        }
        actions={
          <div className="flex items-center gap-2">
            <ScheduleAppointmentModal
              doctors={doctors}
              defaultDate={date}
            />
          </div>
        }
      />

      {/* KPI METRIC STRIP */}
      <div className="border-b border-border bg-card px-4 py-3.5 sm:px-6 md:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-sky-700">
              <Icon icon={faCalendarDay} className="size-3.5" />
              <span>Today Total</span>
            </div>
            <div className="mt-1 font-display text-2xl font-bold tracking-tight text-sky-950">
              {metrics.todayTotal}
            </div>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
              <Icon icon={faCheckCircle} className="size-3.5" />
              <span>Checked-in / Seen</span>
            </div>
            <div className="mt-1 font-display text-2xl font-bold tracking-tight text-emerald-950">
              {metrics.todayCheckedIn}
            </div>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-amber-700">
              <Icon icon={faClock} className="size-3.5" />
              <span>Awaiting Arrival</span>
            </div>
            <div className="mt-1 font-display text-2xl font-bold tracking-tight text-amber-950">
              {metrics.todayWaiting}
            </div>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-700">
              <Icon icon={faCalendarDays} className="size-3.5" />
              <span>Upcoming Future Slots</span>
            </div>
            <div className="mt-1 font-display text-2xl font-bold tracking-tight text-indigo-950">
              {metrics.upcomingCount}
            </div>
          </div>
        </div>
      </div>

      {/* VIEW FILTER TABS */}
      <div className="border-b border-border bg-muted/30 px-4 py-2 sm:px-6 md:px-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 rounded-xl bg-muted/60 p-1">
          <Link
            href={`/appointments?date=${encodeURIComponent(date)}`}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              view === "day"
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:text-ink"
            }`}
          >
            <Icon icon={faCalendarDay} className="mr-1.5 size-3" />
            Day Schedule
          </Link>

          <Link
            href="/appointments?view=upcoming"
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              view === "upcoming"
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:text-ink"
            }`}
          >
            <Icon icon={faCalendarDays} className="mr-1.5 size-3" />
            Upcoming (30 Days)
            {metrics.upcomingCount > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                {metrics.upcomingCount}
              </span>
            )}
          </Link>

          <Link
            href={`/appointments?date=${encodeURIComponent(date)}&view=all`}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              view === "all"
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:text-ink"
            }`}
          >
            <Icon icon={faLayerGroup} className="mr-1.5 size-3" />
            All Visits (incl. Walk-ins)
          </Link>
        </div>

        <div className="text-xs text-muted-foreground">
          Tip: Patients who book on the homepage appear here instantly with priority tokens.
        </div>
      </div>

      {/* DATE PICKER (only in Day/All mode) */}
      {view !== "upcoming" && <AppointmentsDatePicker date={date} />}

      {/* DAY BOARD / APPOINTMENTS LIST */}
      <AppointmentsDayBoard
        appointments={appointments}
        dateLabel={dateLabel}
        doctors={doctors}
        selectedDate={date}
      />
    </PageShell>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  checkInAppointment,
  setAppointmentOutcome,
} from "@/actions/appointments";
import { AppointmentStatus } from "@prisma/client";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { usePendingAction } from "@/hooks/usePendingAction";
import { formatPhone } from "@/lib/utils";
import {
  faClock,
  faCheck,
  faXmark,
  faUserSlash,
  faUserDoctor,
  faCalendarCheck,
  faCalendarPlus,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import { ScheduleAppointmentModal } from "@/components/appointments/ScheduleAppointmentModal";

export type ScheduledAppointmentRow = {
  id: string;
  tokenNumber: number;
  status: AppointmentStatus;
  scheduledAt: Date | string | null;
  checkedInAt: Date | string | null;
  type?: string;
  bookingSource?: string;
  reasonForVisit?: string | null;
  queueDate?: Date | string;
  patient: { id: string; name: string; phone: string; mrn: string };
  doctor: { id: string; name: string } | null;
};

type AppointmentsDayBoardProps = {
  appointments: ScheduledAppointmentRow[];
  dateLabel: string;
  doctors?: Array<{ id: string; name: string }>;
  selectedDate?: string;
};

function formatTime(value: Date | string | null): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateBadge(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function AppointmentsDayBoard({
  appointments,
  dateLabel,
  doctors,
  selectedDate,
}: AppointmentsDayBoardProps) {
  const router = useRouter();
  const { isPending, run } = usePendingAction();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleCheckIn(id: string) {
    setMessage(null);
    setError(null);
    void run(async () => {
      const result = await checkInAppointment(id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setMessage(`Patient checked in successfully as Token #${result.data.tokenNumber}.`);
      router.refresh();
    }, id);
  }

  function handleOutcome(id: string, status: AppointmentStatus) {
    setMessage(null);
    setError(null);
    void run(async () => {
      const result = await setAppointmentOutcome(id, status);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setMessage(`Marked as ${status.replaceAll("_", " ")}.`);
      router.refresh();
    }, id);
  }

  return (
    <div className="flex flex-col gap-4">
      {message ? (
        <div className="px-4 sm:px-6 md:px-8">
          <Banner variant="success">{message}</Banner>
        </div>
      ) : null}
      {error ? (
        <div className="px-4 sm:px-6 md:px-8">
          <Banner variant="error">{error}</Banner>
        </div>
      ) : null}

      {appointments.length === 0 ? (
        <div className="mx-4 my-8 rounded-2xl border border-dashed border-border bg-card p-12 text-center sm:mx-6 md:mx-8">
          <Icon icon={faCalendarCheck} className="mx-auto size-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-display text-lg font-bold text-ink">
            No scheduled appointments for {dateLabel}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
            No patients are currently booked for this date. You can schedule an appointment directly using the button below or patients can book from the clinic homepage.
          </p>
          {doctors && doctors.length > 0 && (
            <div className="mt-6 flex items-center justify-center">
              <ScheduleAppointmentModal
                doctors={doctors}
                defaultDate={selectedDate}
                triggerButton={
                  <Button variant="primary" size="sm" className="shadow-sm">
                    <Icon icon={faCalendarPlus} data-icon="inline-start" />
                    <span>Schedule Appointment for {dateLabel.split(",")[0] || "This Date"}</span>
                  </Button>
                }
              />
            </div>
          )}
        </div>
      ) : (
        <div className="border-y border-border bg-card">
          <ul className="divide-y divide-border">
            {appointments.map((appt) => {
              const pending = isPending(appt.id);
              const isCheckedIn = Boolean(appt.checkedInAt);
              const isOnline = appt.bookingSource === "portal";

              return (
                <li
                  key={appt.id}
                  className="flex flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between md:px-8 hover:bg-sky-50/20 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Time Slot Badge */}
                    <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-sky-50 border border-sky-200/60 font-semibold text-sky-800">
                      <Icon icon={faClock} className="size-3 text-sky-600 mb-0.5" />
                      <span className="text-[11px] tabular-nums font-bold leading-none">
                        {formatTime(appt.scheduledAt)}
                      </span>
                      {appt.queueDate && (
                        <span className="text-[9px] text-sky-600/90 mt-0.5 font-medium">
                          {formatDateBadge(appt.queueDate)}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/patients/${appt.patient.id}`}
                          className="font-bold text-ink text-base hover:text-primary transition-colors"
                        >
                          {appt.patient.name}
                        </Link>
                        <span className="font-mono text-xs rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
                          {appt.patient.mrn}
                        </span>
                        <StatusBadge status={appt.status} />
                        {isOnline && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                            <Icon icon={faGlobe} className="size-2.5" />
                            Homepage Booking
                          </span>
                        )}
                        {isCheckedIn && (
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            Checked in
                          </span>
                        )}
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          Token #{appt.tokenNumber}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>Tel: <strong className="text-ink">{formatPhone(appt.patient.phone)}</strong></span>
                        {appt.doctor && (
                          <span className="flex items-center gap-1">
                            <Icon icon={faUserDoctor} className="text-sky-600 size-3" />
                            Doctor: <strong className="text-ink">Dr. {appt.doctor.name}</strong>
                          </span>
                        )}
                      </div>

                      {appt.reasonForVisit && (
                        <div className="mt-1.5 text-xs text-slate-700 bg-slate-100/80 border border-slate-200/60 rounded-lg px-2.5 py-1 inline-block">
                          <span className="text-slate-500 font-medium">Concern: </span>
                          <span className="font-semibold text-slate-800">{appt.reasonForVisit}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {appt.status === AppointmentStatus.waiting ? (
                    <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                      <Button
                        size="sm"
                        loading={pending}
                        onClick={() => handleCheckIn(appt.id)}
                      >
                        <Icon icon={faCheck} data-icon="inline-start" />
                        Check in to Queue
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={pending}
                        onClick={() =>
                          handleOutcome(appt.id, AppointmentStatus.no_show)
                        }
                      >
                        <Icon icon={faUserSlash} data-icon="inline-start" />
                        No-show
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={pending}
                        onClick={() =>
                          handleOutcome(appt.id, AppointmentStatus.cancelled)
                        }
                      >
                        <Icon icon={faXmark} data-icon="inline-start" />
                        Cancel
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

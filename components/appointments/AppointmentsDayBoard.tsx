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
import { usePendingAction } from "@/hooks/usePendingAction";

export type ScheduledAppointmentRow = {
  id: string;
  tokenNumber: number;
  status: AppointmentStatus;
  scheduledAt: Date | string | null;
  checkedInAt: Date | string | null;
  patient: { id: string; name: string; phone: string; mrn: string };
  doctor: { id: string; name: string } | null;
};

type AppointmentsDayBoardProps = {
  appointments: ScheduledAppointmentRow[];
  dateLabel: string;
};

function formatTime(value: Date | string | null): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AppointmentsDayBoard({
  appointments,
  dateLabel,
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
      setMessage(`Checked in as token #${result.data.tokenNumber}.`);
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
      {message ? <Banner variant="success">{message}</Banner> : null}
      {error ? <Banner variant="error">{error}</Banner> : null}

      {appointments.length === 0 ? (
        <p className="px-6 text-sm text-muted-foreground md:px-8">
          No scheduled appointments for {dateLabel}.
        </p>
      ) : (
        <ul className="divide-y divide-border border-y border-border bg-white">
          {appointments.map((appt) => (
            <li
              key={appt.id}
              className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between md:px-8"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-ink">
                    {formatTime(appt.scheduledAt)}
                  </span>
                  <StatusBadge status={appt.status} />
                  {appt.checkedInAt ? (
                    <span className="text-xs text-muted-foreground">
                      Checked in
                    </span>
                  ) : null}
                </div>
                <Link
                  href={`/patients/${appt.patient.id}`}
                  className="mt-1 block font-display text-base text-primary hover:underline"
                >
                  {appt.patient.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {appt.patient.mrn} · {appt.patient.phone}
                  {appt.doctor ? ` · Dr. ${appt.doctor.name}` : ""}
                  {" · Token #"}
                  {appt.tokenNumber}
                </p>
              </div>
              {appt.status === AppointmentStatus.waiting ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    loading={isPending(appt.id)}
                    onClick={() => handleCheckIn(appt.id)}
                  >
                    Check in
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={isPending(appt.id)}
                    onClick={() =>
                      handleOutcome(appt.id, AppointmentStatus.no_show)
                    }
                  >
                    No-show
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={isPending(appt.id)}
                    onClick={() =>
                      handleOutcome(appt.id, AppointmentStatus.cancelled)
                    }
                  >
                    Cancel
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

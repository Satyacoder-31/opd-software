"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatHm12Hour } from "@/lib/date-utils";
import {
  type AvailabilityRow,
  type DoctorOption,
  dayLabel,
  DoctorPicker,
  DoctorSummary,
  EmptyList,
  type LeaveRow,
} from "@/components/settings/AvailabilityScheduleShared";

export type { AvailabilityRow, DoctorOption, LeaveRow };

export function AvailabilityScheduleView({
  doctors,
  availabilities,
  leaves,
}: {
  doctors: DoctorOption[];
  availabilities: AvailabilityRow[];
  leaves: LeaveRow[];
}) {
  const [doctorId, setDoctorId] = useState(doctors[0]?.id || "");

  const selectedDoctor = doctors.find((d) => d.id === doctorId);
  const doctorHours = availabilities.filter((row) => row.doctorId === doctorId);
  const doctorLeaves = leaves.filter((row) => row.doctorId === doctorId);

  if (!doctors.length) {
    return (
      <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
        Add an active doctor account before configuring availability.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-xl border border-border bg-white p-4">
        <div className="flex flex-col gap-4">
          <DoctorPicker doctors={doctors} doctorId={doctorId} onChange={setDoctorId} />
          {selectedDoctor ? <DoctorSummary doctor={selectedDoctor} /> : null}
          {selectedDoctor ? (
            <p className="text-sm text-muted-foreground">
              Profile details are managed in{" "}
              <Link
                href={`/settings/staff/${selectedDoctor.id}`}
                className="text-primary underline-offset-2 hover:underline"
              >
                staff settings
              </Link>
              .
            </p>
          ) : null}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <h2 className="font-display text-lg font-semibold">Weekly hours</h2>
            {doctorHours.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {doctorHours.length} block{doctorHours.length === 1 ? "" : "s"}
              </p>
            ) : null}
          </div>
          <Button
            nativeButton={false}
            render={
              <Link href={`/settings/availability/schedules/edit?doctor=${doctorId}`} />
            }
            size="sm"
          >
            Edit schedule
          </Button>
        </div>

        <ul className="divide-y divide-border rounded-xl border border-border bg-white">
          {doctorHours.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="font-medium text-ink">{dayLabel(row.dayOfWeek)}</span>
                <span className="text-muted-foreground">
                  {formatHm12Hour(row.startTime)}–{formatHm12Hour(row.endTime)} ·{" "}
                  {row.slotDuration} min slots
                  {row.maxPerSlot > 1 ? ` · up to ${row.maxPerSlot}` : ""}
                </span>
              </div>
            </li>
          ))}
          {!doctorHours.length ? (
            <EmptyList>No weekly hours yet for this doctor.</EmptyList>
          ) : null}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Leave / blocked days</h2>
          {doctorLeaves.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              {doctorLeaves.length} day{doctorLeaves.length === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>

        <ul className="divide-y divide-border rounded-xl border border-border bg-white">
          {doctorLeaves.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="font-medium text-ink">{row.date}</span>
                {row.reason ? (
                  <span className="text-muted-foreground">{row.reason}</span>
                ) : null}
              </div>
            </li>
          ))}
          {!doctorLeaves.length ? (
            <EmptyList>No upcoming leave days.</EmptyList>
          ) : null}
        </ul>
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addDoctorLeave,
  deleteDoctorAvailability,
  removeDoctorLeave,
  upsertDoctorAvailability,
} from "@/actions/availability";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { DetailRow } from "@/components/ui/DetailRow";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatHm12Hour } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

const DAYS = [
  { value: "1", label: "Monday", short: "Mon" },
  { value: "2", label: "Tuesday", short: "Tue" },
  { value: "3", label: "Wednesday", short: "Wed" },
  { value: "4", label: "Thursday", short: "Thu" },
  { value: "5", label: "Friday", short: "Fri" },
  { value: "6", label: "Saturday", short: "Sat" },
  { value: "0", label: "Sunday", short: "Sun" },
];

const SLOT_PRESETS = ["5", "10", "15", "20", "30", "45", "60"] as const;
const SLOT_CUSTOM = "custom";

const SLOT_OPTIONS = [
  ...SLOT_PRESETS.map((mins) => ({ value: mins, label: `${mins} min` })),
  { value: SLOT_CUSTOM, label: "Custom…" },
];

export type DoctorOption = {
  id: string;
  name: string;
  specialty: string | null;
  consultationFee: string | null;
};

export type AvailabilityRow = {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  maxPerSlot: number;
};

export type LeaveRow = {
  id: string;
  doctorId: string;
  date: string;
  reason: string | null;
};

function formatFee(fee: string | null) {
  if (fee == null || fee === "") return "Not set";
  return `₹${Number(fee).toLocaleString("en-IN")}`;
}

function dayLabel(dayOfWeek: number) {
  return DAYS.find((d) => d.value === String(dayOfWeek))?.label ?? "—";
}

function DoctorPicker({
  doctors,
  doctorId,
  onChange,
}: {
  doctors: DoctorOption[];
  doctorId: string;
  onChange: (id: string) => void;
}) {
  if (doctors.length > 1) {
    return (
      <Select
        label="Doctor"
        options={doctors.map((d) => ({ value: d.id, label: d.name }))}
        value={doctorId}
        onChange={(e) => onChange(e.target.value)}
        allowClear={false}
      />
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">Doctor</p>
      <p className="mt-1 text-sm text-ink">{doctors[0]?.name}</p>
    </div>
  );
}

function DoctorSummary({ doctor }: { doctor: DoctorOption }) {
  return (
    <dl>
      <DetailRow label="Specialty" value={doctor.specialty || "Not set"} />
      <DetailRow label="Consultation fee" value={formatFee(doctor.consultationFee)} />
    </dl>
  );
}

function EmptyList({ children }: { children: React.ReactNode }) {
  return (
    <li className="px-4 py-6 text-center text-sm text-muted-foreground">{children}</li>
  );
}

export function AvailabilityManager({
  mode,
  doctors,
  availabilities,
  leaves,
  defaultDoctorId,
}: {
  mode: "view" | "edit";
  doctors: DoctorOption[];
  availabilities: AvailabilityRow[];
  leaves: LeaveRow[];
  defaultDoctorId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [doctorId, setDoctorId] = useState(defaultDoctorId || doctors[0]?.id || "");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [slotPreset, setSlotPreset] = useState<string>("15");
  const [customSlot, setCustomSlot] = useState("15");

  const selectedDoctor = doctors.find((d) => d.id === doctorId);
  const doctorHours = availabilities.filter((row) => row.doctorId === doctorId);
  const doctorLeaves = leaves.filter((row) => row.doctorId === doctorId);
  const slotIsCustom = slotPreset === SLOT_CUSTOM;
  const isEdit = mode === "edit";

  function refresh(result: { success: true } | { success: false; error: string }, okText: string) {
    if (!result.success) {
      setMessage({ type: "error", text: result.error });
      return;
    }
    setMessage({ type: "success", text: okText });
    router.refresh();
  }

  if (!doctors.length) {
    return (
      <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
        Add an active doctor account before configuring availability.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {message ? (
        <Banner variant={message.type === "error" ? "error" : "success"}>{message.text}</Banner>
      ) : null}

      {!isEdit ? (
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
      ) : doctors.length > 1 ? (
        <DoctorPicker doctors={doctors} doctorId={doctorId} onChange={setDoctorId} />
      ) : null}

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <h2 className="font-display text-lg font-semibold">Weekly hours</h2>
            {!isEdit && doctorHours.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {doctorHours.length} block{doctorHours.length === 1 ? "" : "s"}
              </p>
            ) : null}
          </div>
          {!isEdit ? (
            <Button
              nativeButton={false}
              render={
                <Link
                  href={`/settings/availability/schedules/edit?doctor=${doctorId}`}
                />
              }
              size="sm"
            >
              Edit schedule
            </Button>
          ) : null}
        </div>

        {isEdit ? (
          <form
            className="flex flex-col gap-4 rounded-xl border border-border bg-white p-4"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const fd = new FormData(form);
              fd.set("doctorId", doctorId);
              fd.set("dayOfWeek", dayOfWeek);
              fd.set("slotDuration", slotIsCustom ? customSlot : slotPreset);
              startTransition(async () => {
                const result = await upsertDoctorAvailability(fd);
                refresh(result, "Schedule block saved.");
                if (result.success) {
                  form.reset();
                  setSlotPreset("15");
                  setCustomSlot("15");
                }
              });
            }}
          >
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Day</span>
              <div
                className="flex flex-wrap gap-1.5"
                role="radiogroup"
                aria-label="Day of week"
              >
                {DAYS.map((d) => {
                  const selected = dayOfWeek === d.value;
                  return (
                    <button
                      key={d.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={d.label}
                      onClick={() => setDayOfWeek(d.value)}
                      className={cn(
                        "min-h-10 min-w-12 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-surface-muted hover:text-ink",
                      )}
                    >
                      {d.short}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <Input label="Start" name="startTime" type="time" required defaultValue="09:00" />
              <Input label="End" name="endTime" type="time" required defaultValue="13:00" />
              <div className="flex flex-col gap-2">
                <Select
                  label="Slot length"
                  options={SLOT_OPTIONS}
                  value={slotPreset}
                  onChange={(e) => {
                    const next = e.target.value;
                    setSlotPreset(next);
                    if (next !== SLOT_CUSTOM) setCustomSlot(next);
                  }}
                  allowClear={false}
                  required
                />
                {slotIsCustom ? (
                  <Input
                    label="Minutes"
                    type="number"
                    min={5}
                    max={120}
                    value={customSlot}
                    onChange={(e) => setCustomSlot(e.target.value)}
                    required
                  />
                ) : null}
              </div>
              <Input
                label="Max / slot"
                name="maxPerSlot"
                type="number"
                min={1}
                max={20}
                defaultValue={1}
                required
              />
              <div className="col-span-2 flex items-end md:col-span-1">
                <Button type="submit" loading={pending} className="w-full">
                  Add hours
                </Button>
              </div>
            </div>
          </form>
        ) : null}

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
              {isEdit ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    startTransition(async () => {
                      const result = await deleteDoctorAvailability(row.id);
                      refresh(result, "Schedule block removed.");
                    });
                  }}
                >
                  Remove
                </Button>
              ) : null}
            </li>
          ))}
          {!doctorHours.length ? (
            <EmptyList>
              {isEdit
                ? "No weekly hours yet. Add a block above."
                : "No weekly hours yet for this doctor."}
            </EmptyList>
          ) : null}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Leave / blocked days</h2>
          {!isEdit && doctorLeaves.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              {doctorLeaves.length} day{doctorLeaves.length === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>

        {isEdit ? (
          <form
            className="grid gap-3 rounded-xl border border-border bg-white p-4 sm:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const fd = new FormData(form);
              fd.set("doctorId", doctorId);
              startTransition(async () => {
                const result = await addDoctorLeave(fd);
                refresh(result, "Leave day saved.");
                if (result.success) form.reset();
              });
            }}
          >
            <Input label="Date" name="date" type="date" required />
            <Input label="Reason (optional)" name="reason" placeholder="Conference, holiday…" />
            <div className="flex items-end">
              <Button type="submit" loading={pending} className="w-full">
                Block day
              </Button>
            </div>
          </form>
        ) : null}

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
              {isEdit ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    startTransition(async () => {
                      const result = await removeDoctorLeave(row.id);
                      refresh(result, "Leave day removed.");
                    });
                  }}
                >
                  Remove
                </Button>
              ) : null}
            </li>
          ))}
          {!doctorLeaves.length ? (
            <EmptyList>
              {isEdit ? "No leave days blocked yet." : "No upcoming leave days."}
            </EmptyList>
          ) : null}
        </ul>
      </section>
    </div>
  );
}

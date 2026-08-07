"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addDoctorLeave,
  deleteDoctorAvailability,
  removeDoctorLeave,
  upsertDoctorAvailability,
} from "@/actions/availability";
import {
  type AvailabilityRow,
  DAYS,
  type DoctorOption,
  dayLabel,
  DoctorPicker,
  EmptyList,
  type LeaveRow,
  SLOT_CUSTOM,
  SLOT_OPTIONS,
} from "@/components/settings/AvailabilityScheduleShared";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatHm12Hour } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

export type { AvailabilityRow, DoctorOption, LeaveRow };

export function AvailabilityScheduleEdit({
  doctors,
  availabilities,
  leaves,
  defaultDoctorId,
}: {
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

  const doctorHours = availabilities.filter((row) => row.doctorId === doctorId);
  const doctorLeaves = leaves.filter((row) => row.doctorId === doctorId);
  const slotIsCustom = slotPreset === SLOT_CUSTOM;

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

      {doctors.length > 1 ? (
        <DoctorPicker doctors={doctors} doctorId={doctorId} onChange={setDoctorId} />
      ) : null}

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <h2 className="font-display text-lg font-semibold">Weekly hours</h2>
          </div>
        </div>

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
            </li>
          ))}
          {!doctorHours.length ? (
            <EmptyList>No weekly hours yet. Add a block above.</EmptyList>
          ) : null}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Leave / blocked days</h2>
        </div>

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
            </li>
          ))}
          {!doctorLeaves.length ? (
            <EmptyList>No leave days blocked yet.</EmptyList>
          ) : null}
        </ul>
      </section>
    </div>
  );
}

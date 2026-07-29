"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  cancelPortalAppointment,
  previewSlotsForBooking,
  reschedulePortalAppointment,
} from "@/actions/portal";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toDateInputValue } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

export function PortalAppointmentActions({
  appointmentId,
  clinicSlug,
  doctorId,
  canModify,
}: {
  appointmentId: string;
  clinicSlug: string | null;
  doctorId: string | null;
  canModify: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toDateInputValue(d);
  });
  const [slots, setSlots] = useState<{ startIso: string; label: string }[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  if (!canModify) return null;

  return (
    <div className="mt-4 flex flex-col gap-2">
      {error ? <Banner variant="error">{error}</Banner> : null}
      <div className="flex flex-wrap gap-2">
        {clinicSlug && doctorId ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setRescheduleOpen((v) => !v);
              setError(null);
            }}
          >
            {rescheduleOpen ? "Close reschedule" : "Reschedule"}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          loading={pending && !rescheduleOpen}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await cancelPortalAppointment(appointmentId);
              if (!result.success) {
                setError(result.error);
                return;
              }
              router.refresh();
            });
          }}
        >
          Cancel
        </Button>
      </div>

      {rescheduleOpen && clinicSlug && doctorId ? (
        <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface-muted/60 p-3">
          <Input
            label="New date"
            type="date"
            value={date}
            min={toDateInputValue(new Date())}
            className="min-w-0 max-w-full"
            onChange={(e) => {
              const next = e.target.value;
              setDate(next);
              setSelected(null);
              void previewSlotsForBooking({
                clinicSlug,
                doctorId,
                date: next,
              }).then((result) => {
                if (!result.success) {
                  setSlots([]);
                  setError(result.error);
                  return;
                }
                setError(null);
                setSlots(result.data.slots);
              });
            }}
          />
          <div className="mt-3 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3">
            {slots.map((slot) => (
              <button
                key={slot.startIso}
                type="button"
                onClick={() => setSelected(slot.startIso)}
                className={cn(
                  "min-h-11 rounded-lg border px-2 text-sm font-medium",
                  selected === slot.startIso
                    ? "border-surface-deep bg-surface-deep text-white"
                    : "border-border bg-white",
                )}
              >
                {slot.label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            className="mt-3"
            size="sm"
            loading={pending}
            disabled={!selected}
            onClick={() => {
              if (!selected) return;
              startTransition(async () => {
                const result = await reschedulePortalAppointment({
                  appointmentId,
                  slotStartIso: selected,
                });
                if (!result.success) {
                  setError(result.error);
                  return;
                }
                setRescheduleOpen(false);
                router.refresh();
              });
            }}
          >
            Confirm new time
          </Button>
        </div>
      ) : null}
    </div>
  );
}

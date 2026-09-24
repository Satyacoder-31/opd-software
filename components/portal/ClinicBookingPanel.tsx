"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { getDoctorAvailableSlots } from "@/actions/clinics-public";
import { bookPortalAppointment } from "@/actions/portal";
import { AgeField } from "@/components/patients/AgeField";
import { GenderField } from "@/components/patients/GenderField";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { DateField } from "@/components/ui/DateField";
import { Input } from "@/components/ui/Input";
import { ScheduleDateField } from "@/components/ui/ScheduleDateField";
import { toDateInputValue } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

type Slot = {
  startIso: string;
  endIso: string;
  label: string;
  remaining: number;
};

export function ClinicBookingPanel({
  clinicSlug,
  doctorId,
  doctorName,
  signedIn,
  accountName,
}: {
  clinicSlug: string;
  doctorId: string;
  doctorName: string;
  signedIn: boolean;
  accountName: string | null;
}) {
  const router = useRouter();
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toDateInputValue(d);
  }, []);
  const todayValue = useMemo(() => toDateInputValue(new Date()), []);
  const maxBookableDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return toDateInputValue(d);
  }, []);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(tomorrow);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [name, setName] = useState(accountName ?? "");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !date) return;
    let cancelled = false;
    setLoadingSlots(true);
    setSelected(null);
    void getDoctorAvailableSlots({ clinicSlug, doctorId, date }).then((result) => {
      if (cancelled) return;
      setLoadingSlots(false);
      if (!result.success) {
        setSlots([]);
        setError(result.error);
        return;
      }
      setError(null);
      setSlots(result.data.slots);
    });
    return () => {
      cancelled = true;
    };
  }, [open, clinicSlug, doctorId, date]);

  if (!signedIn) {
    return (
      <Link
        href="/login"
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-surface-deep px-4 text-sm font-semibold text-white hover:bg-primary"
      >
        Staff Sign In to Schedule
      </Link>
    );
  }

  const canConfirm =
    Boolean(selected) &&
    Boolean(gender) &&
    (Boolean(dateOfBirth) || age.trim() !== "");

  return (
    <div className="w-full min-w-0 max-w-full sm:max-w-md lg:ml-auto">
      {!open ? (
        <Button type="button" onClick={() => setOpen(true)} className="w-full sm:w-auto">
          Book with {doctorName.split(" ")[0]}
        </Button>
      ) : (
        <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-surface-muted/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">Choose a slot</p>
            <button
              type="button"
              className="shrink-0 text-sm text-muted-foreground hover:text-ink"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
          <ScheduleDateField
            label="Date"
            value={date}
            onChange={setDate}
            minDate={todayValue}
            maxDate={maxBookableDate}
            placeholder="Select appointment date"
          />
          {!accountName ? (
            <Input
              label="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="min-w-0 max-w-full"
            />
          ) : null}

          <DateField
            label="Date of birth"
            value={dateOfBirth}
            onChange={(next) => {
              setDateOfBirth(next);
              if (next) setAge("");
            }}
          />
          <AgeField
            value={age}
            onChange={setAge}
            disabled={!!dateOfBirth}
          />
          <GenderField value={gender} onChange={setGender} />

          <Input
            label="Reason for visit (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Follow-up, fever"
            className="min-w-0 max-w-full"
          />

          <div className="min-w-0">
            <p className="mb-2 text-sm font-medium text-ink">Available times</p>
            {loadingSlots ? (
              <p className="text-sm text-muted-foreground">Loading slots…</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open slots on this day.</p>
            ) : (
              <div
                role="listbox"
                aria-label="Available appointment times"
                className="grid grid-cols-2 gap-2 sm:grid-cols-3"
              >
                {slots.map((slot) => {
                  const active = selected === slot.startIso;
                  return (
                    <button
                      key={slot.startIso}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => setSelected(slot.startIso)}
                      className={cn(
                        "min-h-10 rounded-lg border px-0 py-1.5 text-sm font-medium transition-[background-color,border-color,color,transform] duration-150",
                        "active:scale-[0.97]",
                        active
                          ? "border-surface-deep bg-surface-deep text-white"
                          : "border-border bg-white text-ink hover:border-primary/50",
                      )}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {error ? <Banner variant="error">{error}</Banner> : null}
          {message ? <Banner variant="success">{message}</Banner> : null}

          <Button
            type="button"
            loading={pending}
            disabled={!canConfirm}
            onClick={() => {
              if (!canConfirm || !selected) return;
              setMessage(null);
              setError(null);
              startTransition(async () => {
                const result = await bookPortalAppointment({
                  clinicSlug,
                  doctorId,
                  slotStartIso: selected,
                  reasonForVisit: reason,
                  patientName: name,
                  age: dateOfBirth ? undefined : age,
                  dateOfBirth: dateOfBirth || undefined,
                  gender,
                });
                if (!result.success) {
                  setError(result.error);
                  return;
                }
                setMessage(`Booked · token #${result.data.tokenNumber}`);
                router.push("/portal");
                router.refresh();
              });
            }}
          >
            Confirm booking
          </Button>
        </div>
      )}
    </div>
  );
}

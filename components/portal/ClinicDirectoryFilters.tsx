"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { CLINIC_SPECIALTIES } from "@/lib/clinic-specialties";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-11 w-full min-w-0 rounded-lg border-0 bg-transparent px-3 text-sm text-ink outline-none placeholder:text-muted-foreground/80 focus-visible:bg-white/70";

const selectClass = `${fieldClass} appearance-none pr-8`;

export function ClinicDirectoryFilters({
  initial,
}: {
  initial: {
    q?: string;
    specialty?: string;
    doctor?: string;
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(initial.q ?? "");
  const [specialty, setSpecialty] = useState(initial.specialty ?? "");
  const [doctor, setDoctor] = useState(initial.doctor ?? "");

  const specialtyOptions = useMemo(() => {
    if (
      specialty &&
      !(CLINIC_SPECIALTIES as readonly string[]).includes(specialty)
    ) {
      return [specialty, ...CLINIC_SPECIALTIES];
    }
    return [...CLINIC_SPECIALTIES];
  }, [specialty]);

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const setOrDelete = (key: string, value: string) => {
      if (value.trim()) params.set(key, value.trim());
      else params.delete(key);
    };
    setOrDelete("q", q);
    setOrDelete("specialty", specialty);
    setOrDelete("doctor", doctor);
    startTransition(() => {
      router.push(`/clinics?${params.toString()}`);
    });
  }

  function clear() {
    setQ("");
    setSpecialty("");
    setDoctor("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("specialty");
    params.delete("doctor");
    startTransition(() => {
      router.push(params.toString() ? `/clinics?${params.toString()}` : "/clinics");
    });
  }

  const hasFilters = Boolean(q || specialty || doctor);

  return (
    <form
      onSubmit={apply}
      role="search"
      aria-label="Filter clinics"
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
    >
      <div className="grid min-w-0 flex-1 grid-cols-1 gap-px overflow-hidden rounded-xl border border-border/90 bg-border/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="flex items-center bg-white/90">
          <label className="sr-only" htmlFor="clinic-q">
            Search clinics
          </label>
          <span aria-hidden className="pl-3 text-muted-foreground">
            <Icon icon={faMagnifyingGlass} className="size-4" />
          </span>
          <input
            id="clinic-q"
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Clinic name or area"
            autoComplete="off"
            className={fieldClass}
          />
        </div>

        <div className="relative bg-white/90">
          <label className="sr-only" htmlFor="specialty-filter">
            Specialty
          </label>
          <select
            id="specialty-filter"
            name="specialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className={selectClass}
          >
            <option value="">Any specialty</option>
            {specialtyOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <SelectChevron />
        </div>

        <div className="flex items-center bg-white/90">
          <label className="sr-only" htmlFor="doctor-filter">
            Doctor
          </label>
          <input
            id="doctor-filter"
            name="doctor"
            value={doctor}
            onChange={(e) => setDoctor(e.target.value)}
            placeholder="Doctor name"
            className={fieldClass}
          />
          <button
            type="submit"
            aria-label="Search"
            disabled={pending}
            className="mr-1.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-white transition-colors hover:bg-primary/90 disabled:opacity-60 sm:hidden"
          >
            <Icon icon={faMagnifyingGlass} className="size-4" />
          </button>
        </div>
      </div>

      <div
        className={cn(
          "flex shrink-0 items-center gap-2",
          !hasFilters && "hidden sm:flex",
        )}
      >
        <Button
          type="submit"
          loading={pending}
          size="sm"
          className="hidden h-11 px-4 sm:inline-flex"
        >
          Search
        </Button>
        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-11"
            onClick={clear}
            disabled={pending}
          >
            Clear
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function SelectChevron() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </span>
  );
}

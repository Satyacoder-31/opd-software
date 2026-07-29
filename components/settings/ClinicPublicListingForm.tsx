"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { updateClinicPublicListing } from "@/actions/availability";
import { CityCombobox } from "@/components/settings/CityCombobox";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CLINIC_SPECIALTIES } from "@/lib/clinic-specialties";
import type { Plan } from "@prisma/client";

export function ClinicPublicListingForm({
  clinic,
}: {
  clinic: {
    name: string;
    phone?: string;
    slug: string | null;
    isPublicListed: boolean;
    bookingEnabled: boolean;
    description: string | null;
    city: string | null;
    state: string | null;
    specialties: string[];
    cancelCutoffHours: number;
    plan: Plan;
    phoneVerifiedAt?: Date | string | null;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [selectedSpecialties, setSelectedSpecialties] = useState<Set<string>>(
    () => new Set(clinic.specialties),
  );
  const [isPublicListed, setIsPublicListed] = useState(clinic.isPublicListed);
  const [bookingEnabled, setBookingEnabled] = useState(clinic.bookingEnabled);
  const [city, setCity] = useState(clinic.city ?? "");
  const phoneVerified = Boolean(clinic.phoneVerifiedAt);

  useEffect(() => {
    setIsPublicListed(clinic.isPublicListed);
    setBookingEnabled(clinic.bookingEnabled);
    setSelectedSpecialties(new Set(clinic.specialties));
    setCity(clinic.city ?? "");
  }, [
    clinic.isPublicListed,
    clinic.bookingEnabled,
    clinic.specialties,
    clinic.city,
  ]);


  const customSpecialties = useMemo(
    () => clinic.specialties.filter((s) => !(CLINIC_SPECIALTIES as readonly string[]).includes(s)),
    [clinic.specialties],
  );

  function toggleSpecialty(specialty: string) {
    setSelectedSpecialties((prev) => {
      const next = new Set(prev);
      if (next.has(specialty)) next.delete(specialty);
      else next.add(specialty);
      return next;
    });
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await updateClinicPublicListing(fd);
          if (!result.success) {
            setMessage({ type: "error", text: result.error });
            return;
          }
          setMessage({ type: "success", text: "Public listing saved." });
          setIsPublicListed(isPublicListed);
          setBookingEnabled(bookingEnabled);
          router.refresh();
        });
      }}
    >
      <Banner variant="info">
        Listed clinics with booking enabled appear on{" "}
        <Link href="/clinics" className="font-medium underline underline-offset-2">
          /clinics
        </Link>{" "}
        for patients to discover and book.
      </Banner>

      {!phoneVerified ? (
        <Banner variant="error">
          Verify clinic phone{clinic.phone ? ` (${clinic.phone})` : ""} above
          before enabling public listing.
        </Banner>
      ) : null}

      <div className="flex w-full min-w-0 flex-wrap gap-3">
        <label className="flex min-w-[16rem] flex-1 items-start gap-3 rounded-xl border border-border bg-card p-3 text-sm">
          <input
            type="checkbox"
            name="isPublicListed"
            value="true"
            checked={isPublicListed}
            disabled={!phoneVerified}
            onChange={(e) => setIsPublicListed(e.target.checked)}
            className="mt-1 size-4"
          />
          <span>
            <span className="font-medium text-ink">List this clinic publicly</span>
            <span className="mt-1 block text-muted-foreground">
              Appears on /clinics so patients can discover and book online.
            </span>
          </span>
        </label>

        <label className="flex min-w-[16rem] flex-1 items-start gap-3 rounded-xl border border-border bg-card p-3 text-sm">
          <input
            type="checkbox"
            name="bookingEnabled"
            value="true"
            checked={bookingEnabled}
            onChange={(e) => setBookingEnabled(e.target.checked)}
            className="mt-1 size-4"
          />
          <span>
            <span className="font-medium text-ink">Accept online bookings</span>
            <span className="mt-1 block text-muted-foreground">
              Patients can pick doctor slots when the clinic is listed.
            </span>
          </span>
        </label>
      </div>

      <div className="flex w-full min-w-0 flex-wrap gap-4">
        <div className="min-w-[14rem] flex-1">
          <Input
            label="Public URL slug"
            name="slug"
            defaultValue={clinic.slug ?? ""}
            placeholder={clinic.name.toLowerCase().replace(/\s+/g, "-")}
            className="bg-white"
          />
        </div>
        <div className="min-w-[14rem] flex-1">
          <CityCombobox
            value={city}
            onChange={setCity}
            state={clinic.state ?? undefined}
            extraOptions={clinic.city ? [clinic.city] : []}
            placeholder="Search city…"
            className="bg-white"
          />
        </div>
      </div>
      <fieldset className="min-w-0">
        <legend className="mb-1 text-sm font-medium text-ink">Specialties available</legend>
        <p className="mb-2 text-sm text-muted-foreground">
          Select what this clinic offers.
        </p>
        <div>
          <div className="flex w-full min-w-0 flex-wrap gap-1">
            {CLINIC_SPECIALTIES.map((specialty) => {
              const checked = selectedSpecialties.has(specialty);
              return (
                <label
                  key={specialty}
                  className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary"
                >
                  <input
                    type="checkbox"
                    name="specialties"
                    value={specialty}
                    checked={checked}
                    onChange={() => toggleSpecialty(specialty)}
                    className="size-4 shrink-0"
                  />
                  <span className="whitespace-nowrap">{specialty}</span>
                </label>
              );
            })}
          </div>
          {customSpecialties.length ? (
            <div className="mt-2 flex w-full min-w-0 flex-wrap gap-1">
              {customSpecialties.map((specialty) => (
                <label
                  key={specialty}
                  className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary"
                >
                  <input
                    type="checkbox"
                    name="specialties"
                    value={specialty}
                    checked={selectedSpecialties.has(specialty)}
                    onChange={() => toggleSpecialty(specialty)}
                    className="size-4 shrink-0"
                  />
                  <span className="whitespace-nowrap">{specialty}</span>
                </label>
              ))}
            </div>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">
            {selectedSpecialties.size} selected
          </p>
        </div>
      </fieldset>

      <div>
        <label htmlFor="clinic-description" className="mb-1.5 block text-sm font-medium">
          Public description
        </label>
        <textarea
          id="clinic-description"
          name="description"
          rows={4}
          defaultValue={clinic.description ?? ""}
          className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>
      <Input
        label="Cancel / reschedule cutoff (hours)"
        name="cancelCutoffHours"
        type="number"
        min={0}
        max={72}
        defaultValue={clinic.cancelCutoffHours}
        className="bg-white"
      />

      {message ? (
        <Banner variant={message.type === "error" ? "error" : "success"}>{message.text}</Banner>
      ) : null}

      <Button type="submit" loading={pending}>
        Save public listing
      </Button>

      {clinic.slug && clinic.isPublicListed ? (
        <p className="text-sm text-muted-foreground">
          Public page:{" "}
          <a className="font-medium text-primary hover:underline" href={`/clinics/${clinic.slug}`}>
            /clinics/{clinic.slug}
          </a>
        </p>
      ) : null}
    </form>
  );
}

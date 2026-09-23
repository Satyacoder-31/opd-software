import { Suspense } from "react";
import { listPublicClinics } from "@/actions/clinics-public";
import { ClinicDirectoryFilters } from "@/components/portal/ClinicDirectoryFilters";
import { ClinicDirectoryList } from "@/components/portal/ClinicDirectoryList";
import { ClinicLocationBar } from "@/components/portal/ClinicLocationBar";

export const metadata = {
  title: "Find a Clinic · Dr Orthos",
  description: "Search clinics and book appointments online.",
};

type SearchParams = Promise<{
  q?: string;
  city?: string;
  state?: string;
  specialty?: string;
  doctor?: string;
  lat?: string;
  lng?: string;
}>;

function parseCoord(value?: string) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export default async function ClinicsDirectoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const lat = parseCoord(params.lat);
  const lng = parseCoord(params.lng);
  const clinics = await listPublicClinics({
    q: params.q,
    city: params.city,
    state: params.state,
    specialty: params.specialty,
    doctor: params.doctor,
    lat,
    lng,
  });

  const hasLocation = Boolean(params.city || params.state);
  const count = String(clinics.length).padStart(2, "0");
  const resultLabel =
    clinics.length === 1 ? `${count} clinic` : `${count} clinics`;
  const areaLabel = [params.city, params.state].filter(Boolean).join(", ");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Browse clinics
            </h1>
          </div>
          <p className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
            {hasLocation && areaLabel
              ? `${resultLabel} near ${areaLabel}`
              : resultLabel}
          </p>
        </div>

        <Suspense
          fallback={
              <div className="h-11 animate-pulse rounded-xl bg-white/60" />
          }
        >
          <ClinicLocationBar
            initial={{ city: params.city, state: params.state }}
          />
        </Suspense>
      </header>

      <Suspense fallback={<div className="h-12 animate-pulse rounded-xl bg-white/60" />}>
        <ClinicDirectoryFilters
          initial={{
            q: params.q,
            specialty: params.specialty,
            doctor: params.doctor,
          }}
        />
      </Suspense>

      <ClinicDirectoryList clinics={clinics} />
    </div>
  );
}

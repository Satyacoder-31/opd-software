import Link from "next/link";
import type { PublicClinicCard } from "@/actions/clinics-public";
import { ClinicLogo } from "@/components/ui/ClinicLogo";

export function ClinicDirectoryList({ clinics }: { clinics: PublicClinicCard[] }) {
  if (!clinics.length) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-white/50 px-6 py-14 text-center text-muted-foreground">
        No clinics match those filters. Try another location or specialty.
      </p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {clinics.map((clinic, index) => (
        <li key={clinic.id}>
          <Link
            href={`/clinics/${clinic.slug}`}
            className="group block h-full rounded-2xl border border-border/80 bg-white/90 p-5 shadow-[0_16px_40px_-32px_rgba(8,62,104,0.5)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_22px_48px_-28px_rgba(26,133,200,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-safe:animate-[fade-up_0.45s_ease-out_both]"
            style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <ClinicLogo src={clinic.logoUrl} alt="" size="md" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/80">
                    {clinic.city || "India"}
                    {clinic.distanceKm != null
                      ? ` · ${clinic.distanceKm < 10
                          ? clinic.distanceKm.toFixed(1)
                          : Math.round(clinic.distanceKm)} km`
                      : ""}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink group-hover:text-surface-deep">
                    {clinic.name}
                  </h2>
                </div>
              </div>
              <span className="shrink-0 rounded-md bg-surface-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                {clinic.doctorCount} doctor{clinic.doctorCount === 1 ? "" : "s"}
              </span>
            </div>
            {clinic.description ? (
              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {clinic.description}
              </p>
            ) : (
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{clinic.address}</p>
            )}
            {clinic.specialties.length ? (
              <p className="mt-4 flex flex-wrap gap-1.5">
                {clinic.specialties.slice(0, 4).map((s) => (
                  <span
                    key={s}
                    className="rounded-md border border-border bg-surface-muted/80 px-2 py-0.5 text-xs text-ink/80"
                  >
                    {s}
                  </span>
                ))}
              </p>
            ) : null}
            <p className="mt-5 text-sm font-medium text-primary">
              View doctors & book
              <span aria-hidden className="ml-1 transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

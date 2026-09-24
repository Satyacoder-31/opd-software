import Link from "next/link";
import { ClinicBookingPanel } from "@/components/portal/ClinicBookingPanel";
import { ClinicLogo } from "@/components/ui/ClinicLogo";
import {
  dedupeAddressSegments,
  parseClinicHours,
  type ClinicHourRow,
} from "@/lib/clinic-onboarding";
import { formatHm12Hour } from "@/lib/date-utils";

type Doctor = {
  id: string;
  name: string;
  specialty: string | null;
  qualifications: string | null;
  consultationFee: { toString(): string } | null;
  availabilities: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDuration: number;
  }[];
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatClinicHours(
  hours: ClinicHourRow[],
): { day: string; time: string; closed: boolean }[] {
  return hours
    .slice()
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    .map((row) => {
      const day = DAY_LABELS[row.dayOfWeek] ?? "?";
      if (row.closed) return { day, time: "Closed", closed: true };
      return {
        day,
        time: `${formatHm12Hour(row.open)} – ${formatHm12Hour(row.close)}`,
        closed: false,
      };
    });
}

export function ClinicProfileView({
  clinic,
  signedIn,
  accountName,
}: {
  clinic: {
    slug: string;
    name: string;
    phone: string;
    address: string;
    city: string | null;
    description: string | null;
    specialties: string[];
    bookingEnabled: boolean;
    logoUrl?: string | null;
    landmark?: string | null;
    website?: string | null;
    mapsUrl?: string | null;
    clinicHours?: unknown;
    languages?: string[];
    facilities?: string[];
    users: Doctor[];
  };
  signedIn: boolean;
  accountName: string | null;
}) {
  const hours = formatClinicHours(parseClinicHours(clinic.clinicHours));

  return (
    <div className="flex flex-col gap-10 pb-10">
      <section className="relative overflow-hidden border-b border-border/60 bg-surface-deep text-white shadow-[0_30px_80px_-40px_rgba(8,62,104,0.8)]">
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 20%, rgba(224,148,16,0.35), transparent 42%), radial-gradient(circle at 88% 10%, rgba(212,234,248,0.28), transparent 36%)",
          }}
        />
        <div className="relative mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
          <div>
            <div className="flex items-start gap-4">
              <ClinicLogo
                src={clinic.logoUrl}
                alt={`${clinic.name} logo`}
                size="lg"
                className="rounded-xl border-white/20"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                  {clinic.city || "Clinic profile"}
                </p>
                <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                  {clinic.name}
                </h1>
              </div>
            </div>
            {clinic.description ? (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80">
                {clinic.description}
              </p>
            ) : null}
            <p className="mt-5 text-sm text-white/70">
              {dedupeAddressSegments(clinic.address)}
              {clinic.landmark ? (
                <>
                  <span className="mx-2 text-white/40">·</span>
                  {clinic.landmark}
                </>
              ) : null}
              <span className="mx-2 text-white/40">·</span>
              {clinic.phone}
            </p>
            {(clinic.website || clinic.mapsUrl) && (
              <p className="mt-3 flex flex-wrap gap-3 text-sm">
                {clinic.website ? (
                  <a
                    href={clinic.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 text-white/85 hover:text-white"
                  >
                    Website
                  </a>
                ) : null}
                {clinic.mapsUrl ? (
                  <a
                    href={clinic.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 text-white/85 hover:text-white"
                  >
                    Directions
                  </a>
                ) : null}
              </p>
            )}
            {clinic.specialties.length ? (
              <p className="mt-5 flex flex-wrap gap-2">
                {clinic.specialties.map((s) => (
                  <span
                    key={s}
                    className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-medium"
                  >
                    {s}
                  </span>
                ))}
              </p>
            ) : null}
            {(clinic.languages?.length || clinic.facilities?.length) ? (
              <div className="mt-4 space-y-2 text-sm text-white/75">
                {clinic.languages?.length ? (
                  <p>
                    <span className="text-white/55">Languages: </span>
                    {clinic.languages.join(", ")}
                  </p>
                ) : null}
                {clinic.facilities?.length ? (
                  <p className="flex flex-wrap gap-2">
                    {clinic.facilities.map((f) => (
                      <span
                        key={f}
                        className="rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-xs"
                      >
                        {f}
                      </span>
                    ))}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-sm text-white/70">Online booking</p>
            <p className="mt-1 font-display text-2xl font-semibold">
              {clinic.bookingEnabled ? "Open" : "Paused"}
            </p>
            <p className="mt-2 text-sm text-white/65">
              {clinic.users.length} doctor
              {clinic.users.length === 1 ? "" : "s"} accepting visits
            </p>
            {hours.length ? (
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Clinic schedule">
                {hours.map((row) => (
                  <li
                    key={row.day}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                      row.closed
                        ? "border-white/10 bg-white/5 text-white/45"
                        : "border-white/25 bg-white/15 text-white"
                    }`}
                  >
                    <span className="font-semibold tracking-wide">{row.day}</span>
                    <span className={row.closed ? "text-white/40" : "text-white/75"}>
                      {row.time}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            {!signedIn ? (
              <Link
                href="/login"
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-4 text-sm font-semibold text-surface-deep transition-colors hover:bg-surface-muted"
              >
                Staff Sign In
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section aria-labelledby="doctors-heading" className="flex flex-col gap-4">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <h2
            id="doctors-heading"
            className="font-display text-2xl font-semibold text-ink"
          >
            Doctors
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a doctor, then choose a day and open slot.
          </p>
        </div>

        {!clinic.users.length ? (
          <p className="border-y border-dashed border-border bg-white/60 px-4 py-8 text-center text-muted-foreground sm:px-6">
            No doctors are listed yet.
          </p>
        ) : (
          <ul className="divide-y divide-border/80 border-y border-border/80">
            {clinic.users.map((doctor) => {
              const days = [
                ...new Set(doctor.availabilities.map((a) => a.dayOfWeek)),
              ]
                .sort((a, b) => a - b)
                .map((d) => DAY_LABELS[d])
                .join(" · ");
              return (
                <li
                  key={doctor.id}
                  className="min-w-0 overflow-hidden bg-white/90 px-4 py-5 sm:px-6 sm:py-6"
                >
                  <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <h3 className="font-display text-xl font-semibold">
                        {doctor.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {doctor.specialty || "General practice"}
                        {doctor.qualifications
                          ? ` · ${doctor.qualifications}`
                          : ""}
                      </p>
                      {doctor.consultationFee ? (
                        <p className="mt-2 text-sm font-medium text-ink">
                          Consultation ₹
                          {Number(doctor.consultationFee.toString()).toFixed(0)}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                        {days || "Hours not published"}
                      </p>
                    </div>
                    {clinic.bookingEnabled && doctor.availabilities.length ? (
                      <ClinicBookingPanel
                        clinicSlug={clinic.slug}
                        doctorId={doctor.id}
                        doctorName={doctor.name}
                        signedIn={signedIn}
                        accountName={accountName}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Booking unavailable
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

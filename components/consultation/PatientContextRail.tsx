import Link from "next/link";
import { cn, formatPhone } from "@/lib/utils";

type PatientContextRailProps = {
  patientName: string;
  /** Unique hospital ID — typically the patient MRN. */
  uhid: string;
  episodeNo: string;
  patientPhone?: string | null;
  patientAge?: string | null;
  patientGender?: string | null;
  doctorName: string;
  patientHref?: string;
  className?: string;
  /** When true, name is omitted (page title already shows it). */
  hideName?: boolean;
};

function MetaCell({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  const display = value?.trim();
  return (
    <div className="min-w-0">
      <dt className="whitespace-nowrap text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd
        className="mt-0.5 truncate text-sm font-medium text-ink"
        title={display || undefined}
      >
        {display || <span className="font-normal text-muted-foreground">—</span>}
      </dd>
    </div>
  );
}

export function PatientContextRail({
  patientName,
  uhid,
  episodeNo,
  patientPhone,
  patientAge,
  patientGender,
  doctorName,
  patientHref,
  className,
  hideName = false,
}: PatientContextRailProps) {
  return (
    <aside
      className={cn("border-border bg-card", className)}
      aria-label="Patient context"
    >
      <div className="flex flex-col gap-0">
        {!hideName ? (
          patientHref ? (
            <Link
              href={patientHref}
              className="mb-3 w-fit font-display text-base font-semibold text-ink hover:text-primary"
            >
              {patientName}
            </Link>
          ) : (
            <p className="mb-3 font-display text-base font-semibold text-ink">
              {patientName}
            </p>
          )
        ) : null}

        <div className="overflow-x-auto overscroll-x-contain scrollbar-hide">
          <dl className="grid w-full min-w-[36rem] grid-cols-4 gap-x-6 gap-y-3 lg:min-w-0">
            <MetaCell label="UHID" value={uhid} />
            <MetaCell label="Episode" value={episodeNo} />
            <MetaCell
              label="Phone"
              value={patientPhone ? formatPhone(patientPhone) : null}
            />
            <MetaCell label="Age" value={patientAge} />
            <MetaCell label="Gender" value={patientGender} />
            <MetaCell
              label="Doctor"
              value={
                doctorName
                  ? doctorName.startsWith("Dr.")
                    ? doctorName
                    : `Dr. ${doctorName}`
                  : null
              }
            />
            {patientHref ? (
              <div className="min-w-0">
                <dt className="whitespace-nowrap text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Record
                </dt>
                <dd className="mt-0.5 whitespace-nowrap">
                  <Link
                    href={patientHref}
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Patient record
                  </Link>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </aside>
  );
}

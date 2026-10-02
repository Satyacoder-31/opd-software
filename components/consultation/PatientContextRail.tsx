import Link from "next/link";
import {
  faArrowUpRightFromSquare,
  faCalendarDays,
  faFlaskVial,
  faIdCard,
  faPhone,
  faUserDoctor,
  faVenusMars,
} from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
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
  labResultsCount?: number;
  onViewInvestigations?: () => void;
};

type ChipProps = {
  icon: React.ComponentProps<typeof Icon>["icon"];
  label: string;
  value?: string | null;
  iconColor: string;
  href?: string;
  onClick?: () => void;
};

function InfoChip({ icon, label, value, iconColor, href, onClick }: ChipProps) {
  const display = value?.trim();
  const inner = (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-1.5 text-xs transition-colors",
        (href || onClick) && "hover:border-primary/50 hover:bg-muted cursor-pointer",
      )}
      title={`${label}: ${display ?? "—"}`}
    >
      <div
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-lg",
          iconColor,
        )}
      >
        <Icon icon={icon} className="size-3" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="truncate font-semibold text-ink" style={{ maxWidth: "14ch" }}>
          {display ?? <span className="font-normal text-muted-foreground">—</span>}
        </p>
      </div>
      {href && (
        <Icon
          icon={faArrowUpRightFromSquare}
          className="ml-auto size-2.5 shrink-0 text-muted-foreground"
        />
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="contents">
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="contents text-left">
        {inner}
      </button>
    );
  }
  return inner;
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
  labResultsCount,
  onViewInvestigations,
}: PatientContextRailProps) {
  const initials = patientName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <aside
      className={cn("border-border bg-card", className)}
      aria-label="Patient context"
    >
      {!hideName ? (
        <div className="mb-3 flex items-center gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/80 to-primary font-bold text-sm text-white shadow-md shadow-primary/20"
            aria-hidden="true"
          >
            {initials || "P"}
          </div>
          {patientHref ? (
            <Link
              href={patientHref}
              className="font-display text-xl font-bold text-ink hover:text-primary transition-colors"
            >
              {patientName}
            </Link>
          ) : (
            <p className="font-display text-xl font-bold text-ink">{patientName}</p>
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <InfoChip
          icon={faIdCard}
          label="UHID"
          value={uhid}
          iconColor="bg-blue-500/15 text-blue-600"
        />
        <InfoChip
          icon={faCalendarDays}
          label="Episode"
          value={episodeNo}
          iconColor="bg-violet-500/15 text-violet-600"
        />
        {patientPhone ? (
          <InfoChip
            icon={faPhone}
            label="Phone"
            value={formatPhone(patientPhone)}
            iconColor="bg-emerald-500/15 text-emerald-600"
          />
        ) : null}
        {patientAge ? (
          <InfoChip
            icon={faIdCard}
            label="Age"
            value={patientAge}
            iconColor="bg-amber-500/15 text-amber-600"
          />
        ) : null}
        {patientGender ? (
          <InfoChip
            icon={faVenusMars}
            label="Gender"
            value={patientGender}
            iconColor="bg-rose-500/15 text-rose-600"
          />
        ) : null}
        <InfoChip
          icon={faUserDoctor}
          label="Doctor"
          value={
            doctorName
              ? doctorName.startsWith("Dr.")
                ? doctorName
                : `Dr. ${doctorName}`
              : null
          }
          iconColor="bg-teal-500/15 text-teal-600"
        />
        {labResultsCount != null && labResultsCount > 0 ? (
          <InfoChip
            icon={faFlaskVial}
            label="Lab Reports"
            value={`${labResultsCount} available`}
            iconColor="bg-sky-500/15 text-sky-600"
            onClick={onViewInvestigations}
          />
        ) : null}
        {patientHref ? (
          <InfoChip
            icon={faArrowUpRightFromSquare}
            label="Record"
            value="Patient record"
            iconColor="bg-primary/10 text-primary"
            href={patientHref}
          />
        ) : null}
      </div>
    </aside>
  );
}

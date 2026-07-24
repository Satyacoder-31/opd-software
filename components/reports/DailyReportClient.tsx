"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  faDownload,
  faMoneyBill,
  faStethoscope,
} from "@fortawesome/free-solid-svg-icons";
import { exportDailyReportCsv, type DailyReport } from "@/actions/reports";
import { parseLocalDateInput, toDateInputValue } from "@/lib/date-utils";
import { Banner } from "@/components/ui/Banner";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Calendar } from "@/components/ui/calendar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import { Field, FieldLabel } from "@/components/ui/shadcn/field";
import { usePendingAction } from "@/hooks/usePendingAction";

type DailyReportClientProps = {
  report: DailyReport;
};

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatInr(amount: number): string {
  return inrFormatter.format(amount);
}

function formatReportDate(value: string): string {
  return dateFormatter.format(new Date(`${value}T00:00:00`));
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function DailyReportClient({ report }: DailyReportClientProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingNav, startTransition] = useTransition();
  const { isPending, run } = usePendingAction<"export">();
  const selectedDate = parseLocalDateInput(report.date) ?? undefined;

  const openBillingCount =
    report.collections.draftCount + report.collections.unbilledCount;
  const billingHubBase = `/billing?date=${encodeURIComponent(report.date)}`;

  function selectDate(next: Date | undefined) {
    if (!next) return;
    const value = toDateInputValue(next);
    if (value === report.date) return;
    setError(null);
    startTransition(() => {
      router.push(`/reports/daily?date=${encodeURIComponent(value)}`);
    });
  }

  function handleExport() {
    setError(null);
    void run(async () => {
      const result = await exportDailyReportCsv(report.date);
      if (!result.success) {
        setError(result.error);
        return;
      }
      downloadCsv(result.data.csv, result.data.filename);
    }, "export");
  }

  return (
    <PageShell>
      <PageHeader
        backHref="/reports"
        backLabel="Reports"
        title="Daily close"
        description="Pick a date, check totals, clear open bills, then export if you need a record."
      />

      <section
        aria-label="Report date"
        aria-busy={pendingNav || undefined}
        className="border-y border-border bg-card"
      >
        <div className="px-6 py-5 md:px-8">
          <Field className="w-fit">
            <FieldLabel>Date</FieldLabel>
            <Calendar
              mode="single"
              selected={selectedDate}
              defaultMonth={selectedDate}
              onSelect={selectDate}
              className={pendingNav ? "pointer-events-none opacity-60" : undefined}
            />
          </Field>
        </div>
      </section>

      {error ? (
        <div className="px-6 pt-4 md:px-8">
          <Banner variant="error">{error}</Banner>
        </div>
      ) : null}

      <section
        aria-labelledby="daily-close-heading"
        className="border-b border-border bg-card"
      >
        <header className="border-b border-border bg-surface-muted/60 px-6 py-4 md:px-8">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Review the day
          </p>
          <h2
            id="daily-close-heading"
            className="mt-1 font-display text-xl font-semibold text-balance text-ink"
          >
            {formatReportDate(report.date)}
          </h2>
        </header>

        <div className="grid md:grid-cols-2">
          <div className="border-b border-border px-6 py-5 md:border-r md:border-b-0 md:px-8">
            <p className="text-sm font-medium text-muted-foreground">
              Patient visits
            </p>
            <p className="mt-2 font-display text-4xl font-semibold tabular-nums text-primary">
              {report.visits.total}
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <ReportMeasure label="Waiting" value={report.visits.waiting} />
              <ReportMeasure
                label="In progress"
                value={report.visits.inProgress}
              />
              <ReportMeasure label="Done" value={report.visits.done} />
            </div>
            {(report.visits.cancelled > 0 || report.visits.noShow > 0) && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <ReportMeasure
                  label="Cancelled"
                  value={report.visits.cancelled}
                />
                <ReportMeasure label="No show" value={report.visits.noShow} />
              </div>
            )}
          </div>

          <div className="px-6 py-5 md:px-8">
            <p className="text-sm font-medium text-muted-foreground">
              Collections
            </p>
            <p className="mt-2 font-display text-4xl font-semibold tabular-nums text-primary">
              {formatInr(report.collections.totalPaid)}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <ReportMeasure
                label="Paid"
                value={report.collections.paidCount}
                href={`${billingHubBase}&status=paid`}
              />
              <ReportMeasure
                label="Draft"
                value={report.collections.draftCount}
                href={`${billingHubBase}&status=draft`}
              />
              <ReportMeasure
                label="Unbilled"
                value={report.collections.unbilledCount}
                href={`${billingHubBase}&status=unbilled`}
              />
              <ReportMeasure
                label="Void"
                value={report.collections.voidCount}
                href={`${billingHubBase}&status=void`}
              />
            </div>
            {report.collections.draftAmount > 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Draft outstanding{" "}
                <span className="font-medium tabular-nums text-ink">
                  {formatInr(report.collections.draftAmount)}
                </span>
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section
        aria-label="Payment mode split"
        className="border-b border-border bg-card"
      >
        <header className="border-b border-border bg-surface-muted/60 px-6 py-4 md:px-8">
          <h2 className="font-display text-lg font-semibold text-ink">
            Payment mode split
          </h2>
        </header>
        {report.collections.byPaymentMode.length === 0 ? (
          <EmptyState
            icon={faMoneyBill}
            title="No paid invoices"
            description="No collections were recorded for this date."
            className="bg-card"
          />
        ) : (
          <ul className="divide-y divide-border">
            {report.collections.byPaymentMode.map((row) => (
              <li
                key={row.mode}
                className="flex min-w-0 items-center justify-between gap-3 px-6 py-4 md:px-8"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium capitalize text-ink">
                    {row.mode}
                  </p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {row.count} payment{row.count === 1 ? "" : "s"}
                  </p>
                </div>
                <p className="shrink-0 font-medium tabular-nums text-ink">
                  {formatInr(row.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        aria-label="Doctor-wise visits"
        className="border-b border-border bg-card"
      >
        <header className="border-b border-border bg-surface-muted/60 px-6 py-4 md:px-8">
          <h2 className="font-display text-lg font-semibold text-ink">
            Doctor-wise visits
          </h2>
        </header>
        {report.byDoctor.length === 0 ? (
          <EmptyState
            icon={faStethoscope}
            title="No consultations"
            description="No doctor visits were recorded for this date."
            className="bg-card"
          />
        ) : (
          <ul className="divide-y divide-border">
            {report.byDoctor.map((row) => (
              <li
                key={row.doctorId}
                className="flex min-w-0 items-center justify-between gap-3 px-6 py-4 md:px-8"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">
                    Dr. {row.doctorName}
                  </p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {row.visitCount} visit
                    {row.visitCount === 1 ? "" : "s"}
                  </p>
                </div>
                <p className="shrink-0 font-medium tabular-nums text-ink">
                  {formatInr(row.paidAmount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        aria-label="Open billing items"
        className="border-b border-border bg-card"
      >
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-muted/60 px-6 py-4 md:px-8">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-ink">
              Open items
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {openBillingCount > 0
                ? `${openBillingCount} draft or unbilled visit${openBillingCount === 1 ? "" : "s"} still need attention.`
                : "Nothing open — drafts and unbilled visits are clear for this date."}
            </p>
          </div>
          <Button
            nativeButton={false}
            render={<Link href={billingHubBase} />}
            size="sm"
            variant="secondary"
          >
            View in billing
          </Button>
        </header>

        {report.billingRows.length === 0 ? (
          <EmptyState
            icon={faMoneyBill}
            title="No billing activity"
            description="Completed visits with invoices or unbilled amounts will appear here."
            className="bg-card"
          />
        ) : (
          <ul className="divide-y divide-border">
            {report.billingRows.map((row) => (
              <li
                key={`${row.status}-${row.consultationId}`}
                className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between md:px-8"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-ink">
                      {row.patientName}
                    </p>
                    <StatusBadge status={row.status} />
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {row.patientMrn}
                    {row.doctorName ? ` · Dr. ${row.doctorName}` : ""}
                    {row.invoiceNumber ? ` · ${row.invoiceNumber}` : ""}
                    {row.amount != null ? ` · ${formatInr(row.amount)}` : ""}
                  </p>
                </div>
                <Button
                  nativeButton={false}
                  render={<Link href={`/billing/${row.consultationId}`} />}
                  size="sm"
                  variant="secondary"
                >
                  {row.status === "unbilled" ? "Create bill" : "Open"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        aria-label="Export daily close"
        className="border-b border-border bg-card"
      >
        <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-ink">
              Save a record
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Optional CSV for this day. For a longer range, use{" "}
              <Link
                href="/reports/exports"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Data exports
              </Link>
              .
            </p>
          </div>
          <Button
            type="button"
            onClick={handleExport}
            loading={isPending("export")}
            className="shrink-0"
          >
            <Icon icon={faDownload} data-icon="inline-start" />
            Export daily CSV
          </Button>
        </div>
      </section>
    </PageShell>
  );
}

function ReportMeasure({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const content = (
    <>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-ink">{value}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-lg bg-surface-muted px-3 py-2 transition-colors hover:bg-surface-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {content}
      </Link>
    );
  }

  return <div className="rounded-lg bg-surface-muted px-3 py-2">{content}</div>;
}

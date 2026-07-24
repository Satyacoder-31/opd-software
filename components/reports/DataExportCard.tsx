"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faDownload,
  faFileCsv,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import {
  exportBillingCsv,
  exportPatientsCsv,
  exportVisitsCsv,
} from "@/actions/export";
import { parseLocalDateInput, toDateInputValue } from "@/lib/date-utils";
import { todayDateString } from "@/lib/utils";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Calendar } from "@/components/ui/calendar";
import { Icon } from "@/components/ui/Icon";
import { Field, FieldLabel } from "@/components/ui/shadcn/field";
import { usePendingAction } from "@/hooks/usePendingAction";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function todayAsDate(): Date {
  return parseLocalDateInput(todayDateString()) ?? new Date();
}

function formatRangeLabel(range: DateRange | undefined): string {
  if (!range?.from) return "Select a start and end date";
  const fromLabel = dateFormatter.format(range.from);
  if (!range.to) return `${fromLabel} → …`;
  if (toDateInputValue(range.from) === toDateInputValue(range.to)) {
    return fromLabel;
  }
  return `${fromLabel} → ${dateFormatter.format(range.to)}`;
}

function rangeToStrings(range: DateRange | undefined): {
  from: string;
  to: string;
} | null {
  if (!range?.from) return null;
  const from = toDateInputValue(range.from);
  const to = toDateInputValue(range.to ?? range.from);
  return { from, to };
}

export function DataExportCard({
  canExportPatients = false,
}: {
  canExportPatients?: boolean;
}) {
  const today = todayAsDate();
  const [range, setRange] = useState<DateRange | undefined>({
    from: today,
    to: today,
  });
  const [error, setError] = useState<string | null>(null);
  const { isPending, run } = usePendingAction<
    "patients" | "visits" | "billing"
  >();

  function handlePatients() {
    setError(null);
    void run(async () => {
      const result = await exportPatientsCsv();
      if (!result.success) {
        setError(result.error);
        return;
      }
      downloadCsv(result.data.csv, result.data.filename);
    }, "patients");
  }

  function handleVisits() {
    const dates = rangeToStrings(range);
    if (!dates) {
      setError("Select a date range first.");
      return;
    }
    setError(null);
    void run(async () => {
      const result = await exportVisitsCsv(dates.from, dates.to);
      if (!result.success) {
        setError(result.error);
        return;
      }
      downloadCsv(result.data.csv, result.data.filename);
    }, "visits");
  }

  function handleBilling() {
    const dates = rangeToStrings(range);
    if (!dates) {
      setError("Select a date range first.");
      return;
    }
    setError(null);
    void run(async () => {
      const result = await exportBillingCsv(dates.from, dates.to);
      if (!result.success) {
        setError(result.error);
        return;
      }
      downloadCsv(result.data.csv, result.data.filename);
    }, "billing");
  }

  return (
    <>
      <section
        aria-label="Export date range"
        className="border-y border-border bg-card"
      >
        <div className="flex flex-col gap-3 px-6 py-5 md:px-8">
          <Field className="w-fit">
            <FieldLabel>Date range</FieldLabel>
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={range}
              defaultMonth={range?.from ?? today}
              onSelect={setRange}
              disabled={{ after: today }}
            />
          </Field>
          <p className="text-sm text-muted-foreground">
            {formatRangeLabel(range)}. Up to 90 days for visit and billing
            exports.
          </p>
        </div>
      </section>

      {error ? (
        <div className="px-6 pt-4 md:px-8">
          <Banner variant="error">{error}</Banner>
        </div>
      ) : null}

      <section
        aria-label="Available exports"
        className="border-b border-border bg-card"
      >
        <header className="border-b border-border bg-surface-muted/60 px-6 py-4 md:px-8">
          <h2 className="font-display text-lg font-semibold text-ink">
            Download a register
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Each export is a CSV you can open in Excel or share with accounting.
          </p>
        </header>

        <ul className="divide-y divide-border">
          <ExportOption
            icon={faFileCsv}
            title="Visit register"
            description="Tokens, appointment status, patients, and assigned doctors."
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={handleVisits}
                loading={isPending("visits")}
              >
                <Icon icon={faDownload} data-icon="inline-start" />
                Export visits
              </Button>
            }
          />
          <ExportOption
            icon={faFileCsv}
            title="Billing register"
            description="Invoices, payment status, tax values, and payment modes."
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={handleBilling}
                loading={isPending("billing")}
              >
                <Icon icon={faDownload} data-icon="inline-start" />
                Export billing
              </Button>
            }
          />
          {canExportPatients ? (
            <ExportOption
              icon={faUsers}
              title="Patient register"
              description="All patient demographics and clinical profile fields. Admin only."
              action={
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handlePatients}
                  loading={isPending("patients")}
                >
                  <Icon icon={faDownload} data-icon="inline-start" />
                  Export patients
                </Button>
              }
            />
          ) : null}
        </ul>
      </section>
    </>
  );
}

function ExportOption({
  icon,
  title,
  description,
  action,
}: {
  icon: IconDefinition;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <li className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-primary">
          <Icon icon={icon} aria-hidden className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold text-balance text-ink">
            {title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="shrink-0 sm:self-center">{action}</div>
    </li>
  );
}

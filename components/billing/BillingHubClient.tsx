"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  faDownload,
  faMoneyBillWave,
  faReceipt,
  faCalendarDay,
  faArrowTrendUp,
  faCheckDouble,
  faClockRotateLeft,
  faUserDoctor,
  faMagnifyingGlass,
  faFileInvoice,
} from "@fortawesome/free-solid-svg-icons";
import {
  generateReceiptPdf,
  type BillingHubRow,
} from "@/actions/invoices";
import type { BillingHubStatusFilter } from "@/lib/billing-hub";
import { parseLocalDateInput, toDateInputValue, clinicTodayDate } from "@/lib/date-utils";
import { downloadBase64Pdf, cn } from "@/lib/utils";
import { Banner } from "@/components/ui/Banner";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Calendar } from "@/components/ui/calendar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import { usePendingAction } from "@/hooks/usePendingAction";

type BillingHubClientProps = {
  date: string;
  status: BillingHubStatusFilter;
  q: string;
  rows: BillingHubRow[];
};

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatInr(amount: number): string {
  return inrFormatter.format(amount);
}

export function BillingHubClient({
  date: initialDate,
  status: initialStatus,
  q: initialQ,
  rows,
}: BillingHubClientProps) {
  const router = useRouter();
  const [date, setDate] = useState(initialDate);
  const [status, setStatus] = useState<BillingHubStatusFilter>(initialStatus);
  const [q, setQ] = useState(initialQ);
  const [showCalendar, setShowCalendar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingNav, startTransition] = useTransition();
  const { isPending, run } = usePendingAction();
  const selectedDate = parseLocalDateInput(date) ?? undefined;

  const todayStr = toDateInputValue(clinicTodayDate());

  // Metrics computation from rows
  const metrics = useMemo(() => {
    let totalCollected = 0;
    let paidCount = 0;
    let unbilledCount = 0;
    let draftCount = 0;

    for (const r of rows) {
      if (r.invoiceStatus === "paid") {
        totalCollected += r.amount || 0;
        paidCount++;
      } else if (r.kind === "unbilled") {
        unbilledCount++;
      } else if (r.invoiceStatus === "draft" || r.invoiceStatus === "partial") {
        draftCount++;
      }
    }

    return { totalCollected, paidCount, unbilledCount, draftCount, totalRows: rows.length };
  }, [rows]);

  function applyFilters(newDate?: string, newStatus?: BillingHubStatusFilter) {
    setError(null);
    const targetDate = newDate ?? date;
    const targetStatus = newStatus ?? status;
    const params = new URLSearchParams();
    params.set("date", targetDate);
    if (targetStatus !== "all") params.set("status", targetStatus);
    if (q.trim()) params.set("q", q.trim());
    startTransition(() => {
      router.push(`/billing?${params.toString()}`);
    });
  }

  function handleReprint(consultationId: string) {
    setError(null);
    void run(async () => {
      const result = await generateReceiptPdf(consultationId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      downloadBase64Pdf(result.data.pdfBase64, result.data.filename);
    }, `receipt-${consultationId}`);
  }

  const isToday = date === todayStr;

  return (
    <PageShell>
      <PageHeader
        title="Billing & Cashier Hub"
        description="Daily collection reconciliation, patient checkouts, and official tax invoice receipts"
        actions={
          <div className="flex items-center gap-2">
            <Button
              nativeButton={false}
              render={
                <Link href={`/reports/daily?date=${encodeURIComponent(date)}`} />
              }
              variant="secondary"
              size="sm"
            >
              Daily register close
            </Button>
          </div>
        }
      />

      {/* METRIC KPI TILES */}
      <section aria-label="Billing overview metrics" className="border-b border-border bg-card px-4 py-5 sm:px-6 md:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
          {/* Total Collections */}
          <div className="rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50/80 to-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-800">
                Collections Today
              </span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                <Icon icon={faArrowTrendUp} className="size-3.5" />
              </div>
            </div>
            <div className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">
              {formatInr(metrics.totalCollected)}
            </div>
            <span className="mt-1 block text-[11px] font-medium text-muted-foreground">
              {metrics.paidCount} settled transactions
            </span>
          </div>

          {/* Unbilled Completed Visits */}
          <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/80 to-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                Pending Checkout
              </span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <Icon icon={faClockRotateLeft} className="size-3.5" />
              </div>
            </div>
            <div className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">
              {metrics.unbilledCount}
            </div>
            <span className="mt-1 block text-[11px] font-medium text-amber-700">
              Finished visit, waiting for bill
            </span>
          </div>

          {/* Paid Invoices */}
          <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Paid Invoices
              </span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <Icon icon={faCheckDouble} className="size-3.5" />
              </div>
            </div>
            <div className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">
              {metrics.paidCount}
            </div>
            <span className="mt-1 block text-[11px] font-medium text-emerald-700">
              Receipts generated
            </span>
          </div>

          {/* Draft Invoices */}
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Drafts / Partial
              </span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Icon icon={faFileInvoice} className="size-3.5" />
              </div>
            </div>
            <div className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">
              {metrics.draftCount}
            </div>
            <span className="mt-1 block text-[11px] font-medium text-muted-foreground">
              In-progress bills
            </span>
          </div>
        </div>
      </section>

      {/* FILTER & SEARCH TOOLBAR */}
      <section
        aria-label="Billing filters"
        className="border-b border-border bg-card px-4 py-4 sm:px-6 md:px-8 space-y-3.5"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Quick Date Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1">
              Date:
            </span>
            <button
              type="button"
              onClick={() => {
                setDate(todayStr);
                applyFilters(todayStr);
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                isToday
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface-muted text-muted-foreground hover:bg-slate-200"
              )}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const y = new Date();
                y.setDate(y.getDate() - 1);
                const yStr = toDateInputValue(y);
                setDate(yStr);
                applyFilters(yStr);
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                !isToday && date !== todayStr
                  ? "bg-surface-muted text-ink border border-border"
                  : "bg-surface-muted text-muted-foreground hover:bg-slate-200"
              )}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-ink shadow-2xs hover:bg-slate-50"
            >
              <Icon icon={faCalendarDay} className="size-3 text-sky-600" />
              <span>{date}</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <Icon
                icon={faMagnifyingGlass}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-3.5"
              />
              <input
                type="text"
                placeholder="Search patient name, MRN, invoice #..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyFilters();
                }}
                className="w-full rounded-lg border border-border bg-white py-1.5 pl-9 pr-3 text-xs font-medium text-ink focus:border-primary focus:outline-hidden"
              />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => applyFilters()}
              loading={pendingNav}
            >
              Filter
            </Button>
          </div>
        </div>

        {/* Collapsible Calendar */}
        {showCalendar && (
          <div className="mt-2 rounded-xl border border-border bg-white p-3 shadow-md max-w-fit animate-in fade-in-50">
            <Calendar
              mode="single"
              selected={selectedDate}
              defaultMonth={selectedDate}
              onSelect={(next) => {
                if (next) {
                  const val = toDateInputValue(next);
                  setDate(val);
                  setShowCalendar(false);
                  applyFilters(val);
                }
              }}
            />
          </div>
        )}

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          {(
            [
              { key: "all", label: "All Items", count: rows.length },
              { key: "unbilled", label: "Pending Bill", count: metrics.unbilledCount },
              { key: "paid", label: "Paid", count: metrics.paidCount },
              { key: "draft", label: "Drafts", count: metrics.draftCount },
              { key: "void", label: "Voided", count: rows.filter((r) => r.invoiceStatus === "void").length },
            ] as const
          ).map((filter) => {
            const active = status === filter.key;
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => {
                  setStatus(filter.key);
                  applyFilters(undefined, filter.key);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all",
                  active
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                <span>{filter.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px] tabular-nums font-bold",
                    active ? "bg-white/20 text-white" : "bg-white text-slate-700"
                  )}
                >
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {error ? (
        <div className="px-6 pt-4 md:px-8">
          <Banner variant="error">{error}</Banner>
        </div>
      ) : null}

      {/* BILLING LIST TABLE */}
      <section aria-label="Billing list" className="border-b border-border bg-card">
        {rows.length === 0 ? (
          <EmptyState
            icon={faMoneyBillWave}
            title="No billing entries for this date"
            description="No visits completed or invoices registered for the chosen date or search criteria."
            className="py-12"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-surface-muted text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="px-5 py-3">Patient Details</th>
                  <th className="px-4 py-3">Consulting Doctor</th>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Payment Mode</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => {
                  const statusLabel =
                    row.kind === "unbilled" ? "unbilled" : row.invoiceStatus!;
                  return (
                    <tr
                      key={`${row.kind}-${row.consultationId}`}
                      className="hover:bg-sky-50/30 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 font-bold text-sky-800 text-xs">
                            {row.patientName.charAt(0)}
                          </div>
                          <div>
                            <Link
                              href={`/patients/${row.patientId}`}
                              className="font-bold text-ink hover:text-primary transition-colors text-sm"
                            >
                              {row.patientName}
                            </Link>
                            <div className="text-[11px] text-muted-foreground font-mono">
                              {row.patientMrn}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {row.doctorName ? (
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Icon icon={faUserDoctor} className="text-sky-600 size-3" />
                            <span className="font-medium">Dr. {row.doctorName}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">
                        {row.invoiceNumber ? (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-800">
                            {row.invoiceNumber}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">Not billed</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {row.amount != null ? (
                          <span className="font-display font-bold text-sm text-ink">
                            {formatInr(row.amount)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {row.paymentMode ? (
                          <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-700">
                            {row.paymentMode}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <StatusBadge status={statusLabel} />
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            nativeButton={false}
                            render={
                              <Link href={`/billing/${row.consultationId}`} />
                            }
                            size="sm"
                            variant={row.kind === "unbilled" ? "primary" : "secondary"}
                          >
                            <Icon icon={faReceipt} data-icon="inline-start" />
                            {row.kind === "unbilled" ? "Bill Patient" : "Open Bill"}
                          </Button>

                          {row.invoiceStatus === "paid" && (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              loading={isPending(`receipt-${row.consultationId}`)}
                              onClick={() => handleReprint(row.consultationId)}
                              title="Download PDF Receipt with Vitals"
                            >
                              <Icon icon={faDownload} data-icon="inline-start" />
                              Receipt
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PageShell>
  );
}

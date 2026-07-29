"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  faDownload,
  faMoneyBill,
  faReceipt,
} from "@fortawesome/free-solid-svg-icons";
import {
  generateReceiptPdf,
  type BillingHubRow,
} from "@/actions/invoices";
import type { BillingHubStatusFilter } from "@/lib/billing-hub";
import { parseLocalDateInput, toDateInputValue } from "@/lib/date-utils";
import { downloadBase64Pdf } from "@/lib/utils";
import { Banner } from "@/components/ui/Banner";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Calendar } from "@/components/ui/calendar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import { SearchField } from "@/components/ui/SearchField";
import { Select } from "@/components/ui/Select";
import { Field, FieldLabel } from "@/components/ui/shadcn/field";
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
  maximumFractionDigits: 2,
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
  const [error, setError] = useState<string | null>(null);
  const [pendingNav, startTransition] = useTransition();
  const { isPending, run } = usePendingAction();
  const selectedDate = parseLocalDateInput(date) ?? undefined;

  function applyFilters() {
    setError(null);
    const params = new URLSearchParams();
    params.set("date", date);
    if (status !== "all") params.set("status", status);
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

  return (
    <PageShell>
      <PageHeader
        title="Billing"
        description="Today’s invoices and unbilled completed visits"
        actions={
          <Button
            nativeButton={false}
            render={
              <Link href={`/reports/daily?date=${encodeURIComponent(date)}`} />
            }
            variant="secondary"
            size="sm"
          >
            Daily close
          </Button>
        }
      />

      <section
        aria-label="Billing filters"
        className="border-y border-border bg-card"
      >
        <div className="flex flex-col gap-4 px-6 py-5 md:px-8 lg:flex-row lg:items-start lg:gap-8">
          <Field className="w-fit shrink-0">
            <FieldLabel>Date</FieldLabel>
            <Calendar
              mode="single"
              selected={selectedDate}
              defaultMonth={selectedDate}
              onSelect={(next) => {
                if (next) setDate(toDateInputValue(next));
              }}
            />
            <input type="hidden" name="date" value={date} />
          </Field>

          <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
            <Select
              label="Status"
              name="status"
              className="bg-white px-3 py-2"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as BillingHubStatusFilter)
              }
              options={[
                { value: "all", label: "All" },
                { value: "unbilled", label: "Unbilled" },
                { value: "draft", label: "Draft" },
                { value: "partial", label: "Partial" },
                { value: "paid", label: "Paid" },
                { value: "void", label: "Void" },
              ]}
            />
            <SearchField
              label="Search"
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Patient, MRN, or invoice #"
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFilters();
              }}
            />
            <div className="flex items-end">
              <Button
                type="button"
                onClick={applyFilters}
                loading={pendingNav}
                className="w-full"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="px-6 pt-4 md:px-8">
          <Banner variant="error">{error}</Banner>
        </div>
      ) : null}

      <section aria-label="Billing list" className="border-b border-border">
        {rows.length === 0 ? (
          <EmptyState
            icon={faMoneyBill}
            title="No billing rows"
            description="Try another date or clear filters."
            className="bg-card"
          />
        ) : (
          <ul className="divide-y divide-border bg-card">
            {rows.map((row) => {
              const statusLabel =
                row.kind === "unbilled" ? "unbilled" : row.invoiceStatus!;
              return (
                <li
                  key={`${row.kind}-${row.consultationId}`}
                  className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between md:px-8"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/patients/${row.patientId}`}
                        className="truncate font-medium text-ink hover:text-primary"
                      >
                        {row.patientName}
                      </Link>
                      <StatusBadge status={statusLabel} />
                      {row.invoiceNumber ? (
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {row.invoiceNumber}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {row.patientMrn}
                      {row.doctorName ? ` · Dr. ${row.doctorName}` : ""}
                      {row.amount != null
                        ? ` · ${formatInr(row.amount)}`
                        : ""}
                      {row.paymentMode
                        ? ` · ${row.paymentMode.toUpperCase()}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      nativeButton={false}
                      render={
                        <Link href={`/billing/${row.consultationId}`} />
                      }
                      size="sm"
                    >
                      <Icon icon={faReceipt} data-icon="inline-start" />
                      {row.kind === "unbilled" ? "Create bill" : "Open"}
                    </Button>
                    {row.invoiceStatus === "paid" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        loading={isPending(`receipt-${row.consultationId}`)}
                        onClick={() => handleReprint(row.consultationId)}
                      >
                        <Icon icon={faDownload} data-icon="inline-start" />
                        Reprint
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </PageShell>
  );
}

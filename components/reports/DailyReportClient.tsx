"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  BanknoteIcon,
  DownloadIcon,
  StethoscopeIcon,
} from "lucide-react";
import { exportDailyReportCsv, type DailyReport } from "@/actions/reports";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import { DataExportCard } from "@/components/reports/DataExportCard";
import { usePendingAction } from "@/hooks/usePendingAction";

type DailyReportClientProps = {
  report: DailyReport;
};

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function DailyReportClient({ report }: DailyReportClientProps) {
  const router = useRouter();
  const [date, setDate] = useState(report.date);
  const [error, setError] = useState<string | null>(null);
  const [pendingNav, startTransition] = useTransition();
  const { isPending, run } = usePendingAction<"export">();

  function handleDateChange() {
    setError(null);
    startTransition(() => {
      router.push(`/reports?date=${encodeURIComponent(date)}`);
    });
  }

  function handleExport() {
    setError(null);
    void run(async () => {
      const result = await exportDailyReportCsv(date);
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
        title="Daily report"
        description={`Visits and collections for ${report.date}`}
        actions={
          <div className="flex flex-wrap items-end gap-3">
            <Input
              label="Report date"
              name="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleDateChange}
              loading={pendingNav}
            >
              Load
            </Button>
            <Button
              type="button"
              onClick={handleExport}
              loading={isPending("export")}
            >
              <DownloadIcon data-icon="inline-start" />
              Export CSV
            </Button>
          </div>
        }
      />

      {error && (
        <p className="px-6 text-sm text-danger md:px-8" role="alert">
          {error}
        </p>
      )}

      <div className="grid gap-px border-y border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Total visits" flush className="bg-card">
          <div className="px-5 py-5">
            <p className="font-display text-3xl font-semibold text-primary">
              {report.visits.total}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {report.visits.done} done · {report.visits.inProgress} in progress
              · {report.visits.waiting} waiting
            </p>
          </div>
        </Card>
        <Card title="Collections" flush className="bg-card">
          <div className="px-5 py-5">
            <p className="font-display text-3xl font-semibold text-primary">
              {formatInr(report.collections.totalPaid)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {report.collections.paidCount} paid invoices
            </p>
          </div>
        </Card>
        <Card title="Draft invoices" flush className="bg-card">
          <div className="px-5 py-5">
            <p className="font-display text-3xl font-semibold text-ink">
              {report.collections.draftCount}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Still awaiting payment
            </p>
          </div>
        </Card>
        <Card title="Void invoices" flush className="bg-card">
          <div className="px-5 py-5">
            <p className="font-display text-3xl font-semibold text-ink">
              {report.collections.voidCount}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Corrected or cancelled bills
            </p>
          </div>
        </Card>
      </div>

      <div className="grid gap-px border-b border-border bg-border lg:grid-cols-2">
        <Card title="Payment mode split" flush className="bg-card">
          <div className="px-5 py-5">
            {report.collections.byPaymentMode.length === 0 ? (
              <EmptyState
                icon={BanknoteIcon}
                title="No paid invoices"
                description="No collections recorded for this date."
                compact
              />
            ) : (
              <ul className="divide-y divide-border">
                {report.collections.byPaymentMode.map((row) => (
                  <li
                    key={row.mode}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium capitalize text-ink">
                        {row.mode}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.count} payment{row.count === 1 ? "" : "s"}
                      </p>
                    </div>
                    <p className="font-medium text-ink">
                      {formatInr(row.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card title="Doctor-wise visits" flush className="bg-card">
          <div className="px-5 py-5">
            {report.byDoctor.length === 0 ? (
              <EmptyState
                icon={StethoscopeIcon}
                title="No consultations"
                description="No doctor visits recorded for this date."
                compact
              />
            ) : (
              <ul className="divide-y divide-border">
                {report.byDoctor.map((row) => (
                  <li
                    key={row.doctorId}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-ink">
                        Dr. {row.doctorName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.visitCount} visit
                        {row.visitCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <p className="font-medium text-ink">
                      {formatInr(row.paidAmount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <DataExportCard />
    </PageShell>
  );
}

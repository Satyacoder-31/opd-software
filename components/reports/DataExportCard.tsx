"use client";

import { useState } from "react";
import { DownloadIcon } from "lucide-react";
import {
  exportBillingCsv,
  exportPatientsCsv,
  exportVisitsCsv,
} from "@/actions/export";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Banner } from "@/components/ui/Banner";
import { usePendingAction } from "@/hooks/usePendingAction";
import { todayDateString } from "@/lib/utils";

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function DataExportCard() {
  const [from, setFrom] = useState(todayDateString());
  const [to, setTo] = useState(todayDateString());
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
    setError(null);
    void run(async () => {
      const result = await exportVisitsCsv(from, to);
      if (!result.success) {
        setError(result.error);
        return;
      }
      downloadCsv(result.data.csv, result.data.filename);
    }, "visits");
  }

  function handleBilling() {
    setError(null);
    void run(async () => {
      const result = await exportBillingCsv(from, to);
      if (!result.success) {
        setError(result.error);
        return;
      }
      downloadCsv(result.data.csv, result.data.filename);
    }, "billing");
  }

  return (
    <Card title="Data export" flush className="border-b border-border">
      <div className="space-y-4 px-5 py-5">
        <p className="text-sm text-muted-foreground">
          Download CSV exports for backup or accounting.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="From"
            name="from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Input
            label="To"
            name="to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        {error && <Banner variant="error">{error}</Banner>}
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handlePatients}
            loading={isPending("patients")}
          >
            <DownloadIcon data-icon="inline-start" />
            Export patients
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleVisits}
            loading={isPending("visits")}
          >
            <DownloadIcon data-icon="inline-start" />
            Export visits
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleBilling}
            loading={isPending("billing")}
          >
            <DownloadIcon data-icon="inline-start" />
            Export billing
          </Button>
        </div>
      </div>
    </Card>
  );
}

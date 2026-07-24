import { redirect } from "next/navigation";
import { listBillingHub } from "@/actions/invoices";
import { BillingHubClient } from "@/components/billing/BillingHubClient";
import type { BillingHubStatusFilter } from "@/lib/billing-hub";
import { todayDateString } from "@/lib/utils";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

const STATUS_FILTERS: BillingHubStatusFilter[] = [
  "all",
  "draft",
  "paid",
  "void",
  "unbilled",
];

export default async function BillingHubPage({ searchParams }: Props) {
  const params = await searchParams;
  const date = first(params.date) || todayDateString();
  const statusRaw = first(params.status) ?? "all";
  const status = STATUS_FILTERS.includes(statusRaw as BillingHubStatusFilter)
    ? (statusRaw as BillingHubStatusFilter)
    : "all";
  const q = first(params.q) ?? "";

  const result = await listBillingHub({ date, status, q });
  if (!result) redirect("/queue");

  return (
    <BillingHubClient
      date={result.date}
      status={status}
      q={q}
      rows={result.rows}
    />
  );
}

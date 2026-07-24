import { redirect } from "next/navigation";
import { getDailyReport } from "@/actions/reports";
import { DailyReportClient } from "@/components/reports/DailyReportClient";
import { todayDateString } from "@/lib/utils";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function DailyClosePage({ searchParams }: Props) {
  const params = await searchParams;
  const date = first(params.date) || todayDateString();
  const report = await getDailyReport(date);

  if (!report) redirect("/queue");

  return <DailyReportClient report={report} />;
}

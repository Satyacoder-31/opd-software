import { redirect } from "next/navigation";
import { ReportsOverview } from "@/components/reports/ReportsOverview";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/** Hub for report jobs. Old `/reports?date=` links redirect to Daily close. */
export default async function ReportsPage({ searchParams }: Props) {
  const params = await searchParams;
  const date = first(params.date);
  if (date) {
    redirect(`/reports/daily?date=${encodeURIComponent(date)}`);
  }

  return <ReportsOverview />;
}

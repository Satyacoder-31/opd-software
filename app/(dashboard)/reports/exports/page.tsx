import { DataExportCard } from "@/components/reports/DataExportCard";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import { requireSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";

export default async function ReportsExportsPage() {
  const session = await requireSessionUser();

  return (
    <PageShell>
      <PageHeader
        backHref="/reports"
        backLabel="Reports"
        title="Data exports"
        description="Download clinic records for backup, reconciliation, and accounting. Choose a range, then export the register you need."
      />
      <DataExportCard
        canExportPatients={can(session, "reports.export.patients")}
      />
    </PageShell>
  );
}

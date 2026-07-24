import { Suspense } from "react";
import type { AuditAction } from "@prisma/client";
import { redirect } from "next/navigation";
import { getAuditLogs } from "@/actions/audit";
import { AuditLogViewer } from "@/components/settings/AuditLogViewer";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function AuditLogPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = {
    action: first(params.action) as AuditAction | "",
    resourceType: first(params.resourceType),
    actorId: first(params.actorId),
    from: first(params.from),
    to: first(params.to),
    page: Number(first(params.page) || "1") || 1,
  };

  const data = await getAuditLogs(filters);
  if (!data) redirect("/queue");

  return (
    <Suspense fallback={null}>
      <AuditLogViewer
        logs={data.logs}
        total={data.total}
        page={data.page}
        totalPages={data.totalPages}
        staff={data.staff}
        filters={{
          action: filters.action,
          resourceType: filters.resourceType,
          actorId: filters.actorId,
          from: filters.from,
          to: filters.to,
        }}
      />
    </Suspense>
  );
}

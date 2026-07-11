"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import type { AuditAction, Role } from "@prisma/client";

type AuditLogRow = {
  id: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string | null;
  ipAddress: string | null;
  createdAt: Date | string;
  metadata: unknown;
  actor: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
};

type AuditLogViewerProps = {
  logs: AuditLogRow[];
  total: number;
  page: number;
  totalPages: number;
  staff: Array<{ id: string; name: string; role: Role }>;
  filters: {
    action: string;
    resourceType: string;
    actorId: string;
    from: string;
    to: string;
  };
};

function formatWhen(value: Date | string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function metadataSummary(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object") return "—";
  try {
    return JSON.stringify(metadata);
  } catch {
    return "—";
  }
}

export function AuditLogViewer({
  logs,
  total,
  page,
  totalPages,
  staff,
  filters,
}: AuditLogViewerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [action, setAction] = useState(filters.action);
  const [resourceType, setResourceType] = useState(filters.resourceType);
  const [actorId, setActorId] = useState(filters.actorId);
  const [from, setFrom] = useState(filters.from);
  const [to, setTo] = useState(filters.to);

  function applyFilters(nextPage = 1) {
    const params = new URLSearchParams(searchParams.toString());
    const entries: Record<string, string> = {
      action,
      resourceType,
      actorId,
      from,
      to,
      page: String(nextPage),
    };

    for (const [key, value] of Object.entries(entries)) {
      if (value.trim()) params.set(key, value.trim());
      else params.delete(key);
    }

    startTransition(() => {
      router.push(`/settings/audit?${params.toString()}`);
    });
  }

  return (
    <PageShell>
      <PageHeader
        title="Audit log"
        description={`Who accessed or changed clinic records (${total} events)`}
        backHref="/settings"
        backLabel="Back to settings"
      />

      <Card title="Filters" flush className="border-y border-border">
        <div className="px-5 py-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Select
              label="Action"
              name="action"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              options={[
                { value: "", label: "All actions" },
                { value: "read", label: "Read" },
                { value: "create", label: "Create" },
                { value: "update", label: "Update" },
                { value: "delete", label: "Delete" },
                { value: "export", label: "Export" },
              ]}
            />
            <Select
              label="Resource"
              name="resourceType"
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              options={[
                { value: "", label: "All resources" },
                { value: "patient", label: "Patient" },
                { value: "consultation", label: "Consultation" },
                { value: "prescription", label: "Prescription" },
                { value: "invoice", label: "Invoice" },
                { value: "appointment", label: "Appointment" },
                { value: "user", label: "User" },
                { value: "clinic", label: "Clinic" },
                { value: "fee_item", label: "Fee item" },
                { value: "prescription_template", label: "Rx template" },
                { value: "consultation_attachment", label: "Attachment" },
              ]}
            />
            <Select
              label="Staff member"
              name="actorId"
              value={actorId}
              onChange={(e) => setActorId(e.target.value)}
              options={[
                { value: "", label: "All staff" },
                ...staff.map((member) => ({
                  value: member.id,
                  label: `${member.name} (${member.role})`,
                })),
              ]}
            />
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
          <div className="mt-4">
            <Button
              type="button"
              onClick={() => applyFilters(1)}
              loading={pending}
            >
              Apply filters
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Events" flush className="border-b border-border">
        {logs.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">
            No audit events match these filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Resource</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                  <th className="px-4 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-ink">
                      {formatWhen(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{log.actor.name}</div>
                      <div className="text-xs capitalize text-muted-foreground">
                        {log.actor.role}
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-ink">{log.action}</td>
                    <td className="px-4 py-3 text-ink">
                      <div>{log.resourceType}</div>
                      {log.resourceId ? (
                        <div className="font-mono text-xs text-muted-foreground">
                          {log.resourceId.slice(0, 8)}…
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {log.ipAddress ?? "—"}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-xs text-muted-foreground">
                      {metadataSummary(log.metadata)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 px-6 py-4 md:px-8">
          <Button
            type="button"
            variant="secondary"
            disabled={page <= 1 || pending}
            onClick={() => applyFilters(page - 1)}
          >
            Previous
          </Button>
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <Button
            type="button"
            variant="secondary"
            disabled={page >= totalPages || pending}
            onClick={() => applyFilters(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </PageShell>
  );
}

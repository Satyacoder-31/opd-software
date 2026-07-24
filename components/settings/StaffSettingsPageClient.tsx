"use client";

import Link from "next/link";
import { faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { StaffList } from "@/components/settings/StaffList";
import type { StaffMember } from "@/components/settings/types";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHeader, PageShell } from "@/components/ui/PageShell";

type StaffSettingsPageClientProps = {
  staff: StaffMember[];
};

export function StaffSettingsPageClient({ staff }: StaffSettingsPageClientProps) {
  return (
    <PageShell>
      <PageHeader
        title="Staff & access"
        description="Invite teammates and manage active accounts"
        backHref="/settings"
        backLabel="Back to settings"
        actions={
          <Button
            nativeButton={false}
            render={<Link href="/settings/staff/invite" />}
            size="sm"
          >
            <Icon icon={faUserPlus} data-icon="inline-start" />
            Invite staff
          </Button>
        }
      />
      <section
        aria-labelledby="staff-list-heading"
        className="border-y border-border"
      >
        <div className="flex items-baseline justify-between gap-3 border-b border-border px-5 py-3">
          <h2
            id="staff-list-heading"
            className="text-sm font-semibold text-ink"
          >
            Team members
          </h2>
          <p className="text-xs tabular-nums text-muted-foreground">
            {staff.length}
          </p>
        </div>
        <StaffList staff={staff} />
      </section>
    </PageShell>
  );
}

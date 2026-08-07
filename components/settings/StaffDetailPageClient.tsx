"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { setStaffActive } from "@/actions/auth";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { DetailRow } from "@/components/ui/DetailRow";
import { Icon } from "@/components/ui/Icon";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";
import { usePendingAction } from "@/hooks/usePendingAction";
import { ROLE_LABELS } from "@/lib/rbac";
import type { StaffMember } from "@/components/settings/types";

type StaffDetailPageClientProps = {
  member: StaffMember;
  currentUserId: string;
};

export function StaffDetailPageClient({
  member,
  currentUserId,
}: StaffDetailPageClientProps) {
  const router = useRouter();
  const isSelf = member.id === currentUserId;
  const isDoctor = member.role === "doctor";
  const [error, setError] = useState<string | null>(null);
  const { pending: statusPending, run: runStatus } = usePendingAction();

  function handleToggleActive() {
    const action = member.isActive ? "deactivate" : "reactivate";
    if (
      !window.confirm(
        `Are you sure you want to ${action} ${member.name}?${
          member.isActive ? " They will lose access until reactivated." : ""
        }`,
      )
    ) {
      return;
    }

    setError(null);
    void runStatus(async () => {
      const result = await setStaffActive(member.id, !member.isActive);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <PageShell>
      <PageHeader
        title={member.name}
        description={
          member.designation
            ? `${ROLE_LABELS[member.role]} · ${member.designation}`
            : member.specialty
              ? `${ROLE_LABELS[member.role]} · ${member.specialty}`
              : ROLE_LABELS[member.role]
        }
        backHref="/settings/staff"
        backLabel="Back to staff"
        actions={
          <Button
            nativeButton={false}
            render={<Link href={`/settings/staff/${member.id}/edit`} />}
            size="sm"
          >
            <Icon icon={faPen} data-icon="inline-start" />
            Edit
          </Button>
        }
      />
      <PageBody className="max-w-2xl">
        <div className="flex flex-col gap-6">
          {error && <Banner variant="error">{error}</Banner>}

          <section
            aria-labelledby="staff-details-heading"
            className="border-y border-border"
          >
            <h2 id="staff-details-heading" className="sr-only">
              Staff details
            </h2>
            <dl className="px-1">
              <DetailRow label="Email" value={member.email} />
              <DetailRow label="Role" value={ROLE_LABELS[member.role]} />
              <DetailRow
                label="Status"
                value={member.isActive ? "Active" : "Inactive"}
              />
              <DetailRow label="Phone" value={member.phone || "—"} />
            </dl>
          </section>

          <section
            aria-labelledby="staff-profile-heading"
            className="flex flex-col gap-3 border-y border-border py-4"
          >
            <h2
              id="staff-profile-heading"
              className="text-sm font-semibold text-ink"
            >
              {isDoctor ? "Doctor profile" : "Desk profile"}
            </h2>
            <dl>
              {isDoctor ? (
                <>
                  <DetailRow
                    label="Specialty"
                    value={member.specialty || "—"}
                  />
                  <DetailRow
                    label="Qualifications"
                    value={member.qualifications || "—"}
                  />
                  <DetailRow
                    label="Registration no."
                    value={member.registrationNo || "—"}
                  />
                  <DetailRow
                    label="Consultation fee"
                    value={
                      member.consultationFee
                        ? `₹${Number(member.consultationFee).toFixed(0)}`
                        : "—"
                    }
                  />
                </>
              ) : (
                <DetailRow
                  label="Designation"
                  value={member.designation || "—"}
                />
              )}
            </dl>
          </section>

          <section className="flex flex-col gap-2">
            {isSelf ? (
              <p className="text-sm text-muted-foreground">
                This is your account.
              </p>
            ) : (
              <Button
                type="button"
                variant={member.isActive ? "ghost" : "secondary"}
                size="sm"
                loading={statusPending}
                onClick={handleToggleActive}
                className="self-start"
              >
                {member.isActive ? "Deactivate account" : "Reactivate account"}
              </Button>
            )}
          </section>
        </div>
      </PageBody>
    </PageShell>
  );
}

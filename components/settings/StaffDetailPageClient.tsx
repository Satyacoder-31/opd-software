"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setStaffActive } from "@/actions/auth";
import { updateDoctorCredentials } from "@/actions/prescriptions";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { DetailRow } from "@/components/ui/DetailRow";
import { Input } from "@/components/ui/Input";
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
  const [editingCredentials, setEditingCredentials] = useState(false);
  const [credentialsMessage, setCredentialsMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const { pending: statusPending, run: runStatus } = usePendingAction();
  const { pending: credentialsPending, run: runCredentials } =
    usePendingAction();

  function handleToggleActive() {
    const action = member.isActive ? "deactivate" : "reactivate";
    if (
      !window.confirm(
        `Are you sure you want to ${action} ${member.name}?${
          member.isActive
            ? " They will lose access until reactivated."
            : ""
        }`
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

  function handleCredentialsSubmit(formData: FormData) {
    setCredentialsMessage(null);
    void runCredentials(async () => {
      const result = await updateDoctorCredentials(member.id, formData);
      if (result.success) {
        setCredentialsMessage({ type: "success", text: "Credentials saved." });
        setEditingCredentials(false);
        router.refresh();
        return;
      }
      setCredentialsMessage({ type: "error", text: result.error });
    });
  }

  return (
    <PageShell>
      <PageHeader
        title={member.name}
        description={ROLE_LABELS[member.role]}
        backHref="/settings/staff"
        backLabel="Back to staff"
      />
      <PageBody className="max-w-2xl">
        <div className="flex flex-col gap-6">
          {error && <Banner variant="error">{error}</Banner>}

          <section
            aria-labelledby="staff-details-heading"
            className="border-y border-border"
          >
            <h2
              id="staff-details-heading"
              className="sr-only"
            >
              Staff details
            </h2>
            <dl className="px-1">
              <DetailRow label="Email" value={member.email} />
              <DetailRow label="Role" value={ROLE_LABELS[member.role]} />
              <DetailRow
                label="Status"
                value={member.isActive ? "Active" : "Inactive"}
              />
            </dl>
          </section>

          {isDoctor && (
            <section
              aria-labelledby="doctor-credentials-heading"
              className="flex flex-col gap-3 border-y border-border py-4"
            >
              <h2
                id="doctor-credentials-heading"
                className="text-sm font-semibold text-ink"
              >
                Doctor credentials
              </h2>

              {credentialsMessage && (
                <Banner
                  variant={
                    credentialsMessage.type === "success" ? "success" : "error"
                  }
                >
                  {credentialsMessage.text}
                </Banner>
              )}

              {editingCredentials ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCredentialsSubmit(new FormData(e.currentTarget));
                  }}
                  className="grid gap-3 md:grid-cols-2"
                >
                  <Input
                    label="Qualifications"
                    name="qualifications"
                    autoComplete="off"
                    defaultValue={member.qualifications ?? ""}
                    placeholder="MBBS, MD…"
                  />
                  <Input
                    label="Registration no."
                    name="registrationNo"
                    autoComplete="off"
                    spellCheck={false}
                    defaultValue={member.registrationNo ?? ""}
                    placeholder="XXXXX…"
                  />
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap md:col-span-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingCredentials(false);
                        setCredentialsMessage(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      variant="secondary"
                      loading={credentialsPending}
                    >
                      Save credentials
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <dl>
                    <DetailRow
                      label="Qualifications"
                      value={member.qualifications || "—"}
                    />
                    <DetailRow
                      label="Registration no."
                      value={member.registrationNo || "—"}
                    />
                  </dl>
                  <div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setCredentialsMessage(null);
                        setEditingCredentials(true);
                      }}
                    >
                      Edit credentials
                    </Button>
                  </div>
                </>
              )}
            </section>
          )}

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

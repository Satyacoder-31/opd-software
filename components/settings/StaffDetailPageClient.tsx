"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setStaffActive, updateStaffProfile } from "@/actions/auth";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { DetailRow } from "@/components/ui/DetailRow";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";
import { usePendingAction } from "@/hooks/usePendingAction";
import { ROLE_LABELS } from "@/lib/rbac";
import {
  designationOptionsForRole,
  DOCTOR_SPECIALTY_OPTIONS,
} from "@/lib/staff-profile";
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
  const [editingProfile, setEditingProfile] = useState(false);
  const [specialty, setSpecialty] = useState(member.specialty ?? "");
  const [designation, setDesignation] = useState(member.designation ?? "");
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const { pending: statusPending, run: runStatus } = usePendingAction();
  const { pending: profilePending, run: runProfile } = usePendingAction();
  const designationOptions = designationOptionsForRole(member.role);
  const specialtyOptions = (() => {
    const base = [...DOCTOR_SPECIALTY_OPTIONS];
    if (
      member.specialty &&
      !base.some((option) => option.value === member.specialty)
    ) {
      base.unshift({ value: member.specialty, label: member.specialty });
    }
    return base;
  })();

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

  function handleProfileSubmit(formData: FormData) {
    setProfileMessage(null);
    void runProfile(async () => {
      const result = await updateStaffProfile(member.id, formData);
      if (result.success) {
        setProfileMessage({ type: "success", text: "Profile saved." });
        setEditingProfile(false);
        router.refresh();
        return;
      }
      setProfileMessage({ type: "error", text: result.error });
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

            {profileMessage && (
              <Banner
                variant={profileMessage.type === "success" ? "success" : "error"}
              >
                {profileMessage.text}
              </Banner>
            )}

            {editingProfile ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleProfileSubmit(new FormData(e.currentTarget));
                }}
                className="grid gap-3 md:grid-cols-2"
              >
                <Input
                  label="Phone"
                  name="phone"
                  type="tel"
                  defaultValue={member.phone ?? ""}
                  className="md:col-span-2"
                />
                {isDoctor ? (
                  <>
                    <div className="md:col-span-2">
                      <Select
                        label="Specialty"
                        name="specialty"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        options={specialtyOptions}
                        required
                        allowClear={false}
                      />
                    </div>
                    <Input
                      label="Qualifications"
                      name="qualifications"
                      defaultValue={member.qualifications ?? ""}
                      placeholder="MBBS, MD…"
                    />
                    <Input
                      label="Registration no."
                      name="registrationNo"
                      defaultValue={member.registrationNo ?? ""}
                      spellCheck={false}
                    />
                    <Input
                      label="Consultation fee (₹)"
                      name="consultationFee"
                      type="number"
                      min={0}
                      step="1"
                      defaultValue={member.consultationFee ?? ""}
                    />
                  </>
                ) : (
                  <div className="md:col-span-2">
                    <Select
                      label="Designation"
                      name="designation"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      options={
                        designation &&
                        !designationOptions.some(
                          (option) => option.value === designation,
                        )
                          ? [
                              {
                                value: designation,
                                label: designation,
                              },
                              ...designationOptions,
                            ]
                          : designationOptions
                      }
                      clearLabel="Select designation…"
                    />
                  </div>
                )}
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap md:col-span-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingProfile(false);
                      setProfileMessage(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    variant="secondary"
                    loading={profilePending}
                  >
                    Save profile
                  </Button>
                </div>
              </form>
            ) : (
              <>
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
                <div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setProfileMessage(null);
                      setSpecialty(member.specialty ?? "");
                      setDesignation(member.designation ?? "");
                      setEditingProfile(true);
                    }}
                  >
                    Edit profile
                  </Button>
                </div>
              </>
            )}
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

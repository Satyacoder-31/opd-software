"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateStaffProfile } from "@/actions/auth";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
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

type StaffEditPageClientProps = {
  member: StaffMember;
};

export function StaffEditPageClient({ member }: StaffEditPageClientProps) {
  const router = useRouter();
  const isDoctor = member.role === "doctor";
  const [specialty, setSpecialty] = useState(member.specialty ?? "");
  const [designation, setDesignation] = useState(member.designation ?? "");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const { pending, run } = usePendingAction();
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

  function handleProfileSubmit(formData: FormData) {
    setMessage(null);
    void run(async () => {
      const result = await updateStaffProfile(member.id, formData);
      if (result.success) {
        router.push(`/settings/staff/${member.id}`);
        router.refresh();
        return;
      }
      setMessage({ type: "error", text: result.error });
    });
  }

  return (
    <PageShell>
      <PageHeader
        title={`Edit ${member.name}`}
        description={
          isDoctor
            ? `${ROLE_LABELS[member.role]} profile`
            : `${ROLE_LABELS[member.role]} desk profile`
        }
        backHref={`/settings/staff/${member.id}`}
        backLabel="Back to staff member"
      />
      <PageBody className="max-w-2xl">
        <div className="flex flex-col gap-4">
          {message ? (
            <Banner variant={message.type === "success" ? "success" : "error"}>
              {message.text}
            </Banner>
          ) : null}

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
                nativeButton={false}
                render={
                  <a href={`/settings/staff/${member.id}`} />
                }
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={pending}>
                Save profile
              </Button>
            </div>
          </form>
        </div>
      </PageBody>
    </PageShell>
  );
}

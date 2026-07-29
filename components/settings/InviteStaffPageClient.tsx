"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { inviteStaff } from "@/actions/auth";
import { useServerActionForm } from "@/hooks/useServerActionForm";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Banner } from "@/components/ui/Banner";
import { Card } from "@/components/ui/Card";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";
import {
  designationOptionsForRole,
  DOCTOR_SPECIALTY_OPTIONS,
} from "@/lib/staff-profile";

export function InviteStaffPageClient() {
  const router = useRouter();
  const { handleSubmit, error, fieldError, pending, values, setValue } =
    useServerActionForm(inviteStaff, {
      onSuccess: () => {
        router.push("/settings/staff");
        router.refresh();
      },
    });

  const role = values.role ?? "doctor";
  const designationOptions = designationOptionsForRole(role);

  return (
    <PageShell>
      <PageHeader
        title="Invite staff member"
        description="Send an invite email to add an admin, doctor, or receptionist"
        backHref="/settings/staff"
        backLabel="Back to staff"
      />
      <PageBody className="max-w-2xl">
        <Card title="Invitation" className="border border-border">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Name"
              name="name"
              autoComplete="name"
              value={values.name ?? ""}
              onChange={(e) => setValue("name", e.target.value)}
              error={fieldError("name")}
              required
            />
            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              value={values.email ?? ""}
              onChange={(e) => setValue("email", e.target.value)}
              error={fieldError("email")}
              required
            />
            <Input
              label="Phone (optional)"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={values.phone ?? ""}
              onChange={(e) => setValue("phone", e.target.value)}
              error={fieldError("phone")}
            />
            <Select
              label="Role"
              name="role"
              value={role}
              onChange={(e) => {
                setValue("role", e.target.value);
                setValue("specialty", "");
                setValue("designation", "");
              }}
              options={[
                { value: "doctor", label: "Doctor" },
                { value: "receptionist", label: "Receptionist / desk" },
                { value: "admin", label: "Admin" },
              ]}
            />
            <p className="text-xs text-muted-foreground">
              Receptionist / desk covers front desk, billing, lab desk, and
              nursing/vitals. Doctors need a specialty for public booking. Admins manage
              clinic settings and staff.
            </p>

            {role === "doctor" ? (
              <div className="grid gap-4 rounded-xl border border-border bg-surface-muted/40 p-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Select
                    label="Specialty"
                    name="specialty"
                    value={values.specialty ?? ""}
                    onChange={(e) => setValue("specialty", e.target.value)}
                    options={DOCTOR_SPECIALTY_OPTIONS}
                    required
                    allowClear={false}
                    error={fieldError("specialty")}
                  />
                </div>
                <Input
                  label="Qualifications"
                  name="qualifications"
                  value={values.qualifications ?? ""}
                  onChange={(e) => setValue("qualifications", e.target.value)}
                  placeholder="MBBS, MD…"
                />
                <Input
                  label="Registration no."
                  name="registrationNo"
                  value={values.registrationNo ?? ""}
                  onChange={(e) => setValue("registrationNo", e.target.value)}
                  spellCheck={false}
                  placeholder="Council registration…"
                />
                <Input
                  label="Consultation fee (₹)"
                  name="consultationFee"
                  type="number"
                  min={0}
                  step="1"
                  value={values.consultationFee ?? ""}
                  onChange={(e) => setValue("consultationFee", e.target.value)}
                />
              </div>
            ) : null}

            {designationOptions.length ? (
              <Select
                label="Designation"
                name="designation"
                value={values.designation ?? ""}
                onChange={(e) => setValue("designation", e.target.value)}
                options={designationOptions}
                clearLabel="Select designation…"
              />
            ) : null}

            {error && <Banner variant="error">{error}</Banner>}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap">
              <Button
                nativeButton={false}
                render={<Link href="/settings/staff" />}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button type="submit" loading={pending}>
                Send invite
              </Button>
            </div>
          </form>
        </Card>
      </PageBody>
    </PageShell>
  );
}

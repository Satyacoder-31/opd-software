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

export function InviteStaffPageClient() {
  const router = useRouter();
  const { handleSubmit, error, fieldError, pending, values, setValue } =
    useServerActionForm(inviteStaff, {
      onSuccess: () => {
        router.push("/settings/staff");
        router.refresh();
      },
    });

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
            <Select
              label="Role"
              name="role"
              value={values.role ?? "doctor"}
              onChange={(e) => setValue("role", e.target.value)}
              options={[
                { value: "doctor", label: "Doctor" },
                { value: "receptionist", label: "Receptionist" },
                { value: "admin", label: "Admin" },
              ]}
            />
            <p className="text-xs text-muted-foreground">
              Receptionists handle registration, queue, vitals prep, and billing.
              Doctors run consultations and prescriptions. Admins can manage
              clinic settings and staff.
            </p>
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

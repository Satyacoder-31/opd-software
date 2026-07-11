"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import { inviteStaff } from "@/actions/auth";
import { useServerActionForm } from "@/hooks/useServerActionForm";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Banner } from "@/components/ui/Banner";
import { Card } from "@/components/ui/Card";
import { PageShell } from "@/components/ui/PageShell";

export function InviteStaffPageClient() {
  const router = useRouter();
  const { handleSubmit, error, fieldError, pending, values, setValue } =
    useServerActionForm(inviteStaff, {
      onSuccess: () => {
        router.push("/settings");
        router.refresh();
      },
    });

  return (
    <PageShell>
      <Card flush className="min-h-full border-y border-border">
        <div className="border-b border-border px-5 py-4">
          <Link
            href="/settings"
            aria-label="Back to settings"
            className="inline-flex items-center gap-1 text-ink hover:text-primary"
          >
            <ChevronLeftIcon className="size-5 shrink-0" aria-hidden />
            <h1 className="font-display text-lg font-semibold">
              Invite staff member
            </h1>
          </Link>
          <p className="mt-1 pl-6 text-sm text-muted-foreground">
            Send an invite email to add a doctor or receptionist
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-5">
          <Input
            label="Name"
            name="name"
            value={values.name ?? ""}
            onChange={(e) => setValue("name", e.target.value)}
            error={fieldError("name")}
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
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
            ]}
          />
          {error && <Banner variant="error">{error}</Banner>}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/settings"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-white px-4 text-sm font-medium text-ink hover:bg-surface-muted"
            >
              Cancel
            </Link>
            <Button type="submit" loading={pending}>
              Send invite
            </Button>
          </div>
        </form>
      </Card>
    </PageShell>
  );
}

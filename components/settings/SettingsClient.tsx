"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import { ClinicProfile } from "@/components/settings/ClinicProfile";
import { ClinicProfileActions } from "@/components/settings/ClinicProfileActions";
import { FeeMasterCard } from "@/components/settings/FeeMasterCard";
import { StaffList } from "@/components/settings/StaffList";
import type { Clinic, User } from "@prisma/client";

type FeeRow = {
  id: string;
  name: string;
  amount: number;
  isActive: boolean;
};

type SettingsClientProps = {
  clinic: Clinic;
  staff: User[];
  currentUserId: string;
  feeItems: FeeRow[];
};

export function SettingsClient({
  clinic,
  staff,
  currentUserId,
  feeItems,
}: SettingsClientProps) {
  const router = useRouter();

  return (
    <PageShell>
      <PageHeader
        title="Settings"
        description="Clinic profile, fees, staff, and subscription"
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => router.push("/settings/audit")}
            >
              View audit log
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => router.push("/reports")}
            >
              Reports & exports
            </Button>
          </>
        }
      />

      <Card title="Clinic profile" flush className="border-y border-border">
        <div className="space-y-4 px-5 py-5">
          <ClinicProfile clinic={clinic} />
          <ClinicProfileActions />
        </div>
      </Card>

      <Card title="Fee master" flush className="border-b border-border">
        <div className="px-5 py-5">
          <FeeMasterCard initialItems={feeItems} />
        </div>
      </Card>

      <Card title="Subscription" flush className="border-b border-border">
        <div className="px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium capitalize text-primary">
              {clinic.plan} plan
            </span>
            <span className="text-sm text-muted-foreground capitalize">
              {clinic.subscriptionStatus.replace("_", " ")}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Razorpay billing integration coming soon.
          </p>
        </div>
      </Card>

      <Card title="Staff" flush className="border-b border-border">
        <div className="space-y-4 px-5 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {staff.length} team member{staff.length === 1 ? "" : "s"}
            </p>
            <Link href="/settings/invite">
              <Button type="button" size="sm">
                Invite staff
              </Button>
            </Link>
          </div>
          <StaffList staff={staff} currentUserId={currentUserId} />
        </div>
      </Card>
    </PageShell>
  );
}

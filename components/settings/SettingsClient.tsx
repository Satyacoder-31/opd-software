"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import { ClinicProfile } from "@/components/settings/ClinicProfile";
import { ClinicProfileActions } from "@/components/settings/ClinicProfileActions";
import { StaffList } from "@/components/settings/StaffList";
import type { Clinic, Role } from "@prisma/client";

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  qualifications: string | null;
  registrationNo: string | null;
  createdAt: Date;
  updatedAt: Date;
  clinicId: string;
};

type SettingsClientProps = {
  clinic: Clinic;
  staff: StaffMember[];
  currentUserId: string;
  feeItemCount: number;
};

export function SettingsClient({
  clinic,
  staff,
  currentUserId,
  feeItemCount,
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
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5">
          <div>
            <p className="text-sm text-muted-foreground">
              {feeItemCount} fee item{feeItemCount === 1 ? "" : "s"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Consultation and procedure fees used in billing
            </p>
          </div>
          <Link href="/settings/fees">
            <Button type="button" size="sm">
              Manage fees
            </Button>
          </Link>
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

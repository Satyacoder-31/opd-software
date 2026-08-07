import { redirect } from "next/navigation";
import Link from "next/link";
import { faCreditCard } from "@fortawesome/free-solid-svg-icons";
import { getClinicProfile } from "@/actions/auth";
import { PlanSwitcher } from "@/components/settings/PlanSwitcher";
import { RazorpayKeyForm } from "@/components/settings/RazorpayKeyForm";
import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";
import { requireSessionUser } from "@/lib/auth";
import { PLAN_LABELS } from "@/lib/plan-features";
import { can } from "@/lib/rbac";

export default async function EditSubscriptionSettingsPage() {
  const [clinic, session] = await Promise.all([
    getClinicProfile(),
    requireSessionUser(),
  ]);

  if (!can(session, "subscription.manage")) {
    redirect("/settings/subscription");
  }

  return (
    <PageShell>
      <PageHeader
        title="Edit subscription"
        description="Update plan and clinic payment key"
        backHref="/settings/subscription"
        backLabel="Back to subscription"
        actions={
          <Button
            nativeButton={false}
            render={<Link href="/settings/subscription" />}
            variant="secondary"
            size="sm"
          >
            Done
          </Button>
        }
      />
      <PageBody className="flex max-w-2xl flex-col gap-6">
        <Card title="Current plan" className="border border-border">
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant="secondary"
              className="capitalize tabular-nums text-primary"
            >
              {PLAN_LABELS[clinic.plan]} plan
            </Badge>
            <span className="text-sm capitalize text-muted-foreground">
              {clinic.subscriptionStatus.replaceAll("_", " ")}
            </span>
          </div>
          <EmptyState
            icon={faCreditCard}
            title="Automated billing coming soon"
            description="Razorpay checkout isn’t wired yet. Use the plan switcher below until billing goes live."
            compact
          />
        </Card>

        <Card
          title="Online payments (clinic key)"
          className="border border-border"
        >
          <RazorpayKeyForm initialKeyId={clinic.razorpayKeyId ?? null} />
        </Card>

        <PlanSwitcher currentPlan={clinic.plan} />
      </PageBody>
    </PageShell>
  );
}

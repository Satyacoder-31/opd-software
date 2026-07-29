import { faCreditCard } from "@fortawesome/free-solid-svg-icons";
import { getClinicProfile } from "@/actions/auth";
import { PlanSwitcher } from "@/components/settings/PlanSwitcher";
import { RazorpayKeyForm } from "@/components/settings/RazorpayKeyForm";
import { Badge } from "@/components/ui/shadcn/badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";
import { requireSessionUser } from "@/lib/auth";
import { featuresForPlan, PLAN_LABELS } from "@/lib/plan-features";
import { can } from "@/lib/rbac";

export default async function SubscriptionSettingsPage() {
  const [clinic, session] = await Promise.all([getClinicProfile(), requireSessionUser()]);
  const statusLabel = clinic.subscriptionStatus.replaceAll("_", " ");
  const features = featuresForPlan(clinic.plan);
  const canManage = can(session, "subscription.manage");

  return (
    <PageShell>
      <PageHeader
        title="Subscription"
        description="Current plan and billing status"
        backHref="/settings"
        backLabel="Back to settings"
      />
      <PageBody className="flex max-w-2xl flex-col gap-6">
        <Card title="Current plan" className="border border-border">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant="secondary"
                className="capitalize tabular-nums text-primary"
              >
                {PLAN_LABELS[clinic.plan]} plan
              </Badge>
              <span className="text-sm capitalize text-muted-foreground">
                {statusLabel}
              </span>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Included features</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {features.map((feature) => (
                  <li key={feature} className="rounded-lg bg-muted/50 px-3 py-2 text-sm capitalize">
                    {feature.replaceAll("_", " ")}
                  </li>
                ))}
              </ul>
            </div>
            <EmptyState
              icon={faCreditCard}
              title="Automated billing coming soon"
              description="Razorpay checkout isn’t wired yet. Use the plan switcher below until billing goes live."
              compact
            />
          </div>
        </Card>

        {canManage ? (
          <Card title="Online payments (clinic key)" className="border border-border">
            <RazorpayKeyForm initialKeyId={clinic.razorpayKeyId ?? null} />
          </Card>
        ) : null}

        {canManage ? <PlanSwitcher currentPlan={clinic.plan} /> : null}
      </PageBody>
    </PageShell>
  );
}

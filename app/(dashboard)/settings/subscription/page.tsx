import { faCreditCard } from "@fortawesome/free-solid-svg-icons";
import { getClinicProfile } from "@/actions/auth";
import { Badge } from "@/components/ui/shadcn/badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";

export default async function SubscriptionSettingsPage() {
  const clinic = await getClinicProfile();
  const statusLabel = clinic.subscriptionStatus.replaceAll("_", " ");

  return (
    <PageShell>
      <PageHeader
        title="Subscription"
        description="Current plan and billing status"
        backHref="/settings"
        backLabel="Back to settings"
      />
      <PageBody className="max-w-2xl">
        <Card title="Current plan" className="border border-border">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant="secondary"
                className="capitalize tabular-nums text-primary"
              >
                {clinic.plan} plan
              </Badge>
              <span className="text-sm capitalize text-muted-foreground">
                {statusLabel}
              </span>
            </div>
            <EmptyState
              icon={faCreditCard}
              title="Billing management unavailable"
              description="Razorpay billing integration is coming soon. Your current plan status is shown above."
              compact
            />
          </div>
        </Card>
      </PageBody>
    </PageShell>
  );
}

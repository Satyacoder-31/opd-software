import Link from "next/link";
import { faCreditCard, faPen } from "@fortawesome/free-solid-svg-icons";
import { getClinicProfile } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DetailRow } from "@/components/ui/DetailRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";
import { requireSessionUser } from "@/lib/auth";
import { featuresForPlan, PLAN_LABELS } from "@/lib/plan-features";
import { can } from "@/lib/rbac";

export default async function SubscriptionSettingsPage() {
  const [clinic, session] = await Promise.all([
    getClinicProfile(),
    requireSessionUser(),
  ]);
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
        actions={
          canManage ? (
            <Button
              nativeButton={false}
              render={<Link href="/settings/subscription/edit" />}
              size="sm"
            >
              <Icon icon={faPen} data-icon="inline-start" />
              Edit
            </Button>
          ) : null
        }
      />
      <PageBody className="flex max-w-2xl flex-col gap-6">
        <Card title="Current plan" flush className="border border-border">
          <div className="flex flex-col gap-4 px-5 py-5">
            <dl>
              <DetailRow label="Plan" value={`${PLAN_LABELS[clinic.plan]} plan`} />
              <DetailRow
                label="Status"
                value={<span className="capitalize">{statusLabel}</span>}
              />
              <DetailRow
                label="Razorpay key"
                value={
                  clinic.razorpayKeyId
                    ? `${clinic.razorpayKeyId.slice(0, 12)}…`
                    : "Not set"
                }
              />
            </dl>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Included features</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {features.map((feature) => (
                  <li
                    key={feature}
                    className="rounded-lg bg-muted/50 px-3 py-2 text-sm capitalize"
                  >
                    {feature.replaceAll("_", " ")}
                  </li>
                ))}
              </ul>
            </div>
            <EmptyState
              icon={faCreditCard}
              title="Automated billing coming soon"
              description="Razorpay checkout isn’t wired yet. Change plan or payment key from Edit."
              compact
            />
          </div>
        </Card>
      </PageBody>
    </PageShell>
  );
}

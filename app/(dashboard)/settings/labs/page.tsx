import { listLabTests } from "@/actions/labs";
import { LabCatalogManager } from "@/components/settings/LabCatalogManager";
import { Card } from "@/components/ui/Card";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";

export default async function LabCatalogPage() {
  const tests = await listLabTests(false);
  return (
    <PageShell>
      <PageHeader title="Lab catalog" description="Tests, samples, pricing, and billing codes" backHref="/settings" backLabel="Back to settings" />
      <PageBody className="max-w-4xl">
        <Card title="Available tests" className="border border-border">
          <LabCatalogManager initialTests={tests} />
        </Card>
      </PageBody>
    </PageShell>
  );
}

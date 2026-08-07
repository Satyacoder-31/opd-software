import { listLabTests } from "@/actions/labs";
import { LabCatalogEdit } from "@/components/settings/LabCatalogEdit";
import { Card } from "@/components/ui/Card";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";

export default async function EditLabCatalogPage() {
  const tests = await listLabTests(false);
  return (
    <PageShell>
      <PageHeader
        title="Edit lab catalog"
        description="Add or deactivate tests, samples, and fees"
        backHref="/settings/labs"
        backLabel="Back to lab catalog"
      />
      <PageBody className="max-w-4xl">
        <Card title="Manage tests" className="border border-border">
          <LabCatalogEdit initialTests={tests} />
        </Card>
      </PageBody>
    </PageShell>
  );
}

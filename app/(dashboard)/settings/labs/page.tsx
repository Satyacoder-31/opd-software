import Link from "next/link";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { listLabTests } from "@/actions/labs";
import { LabCatalogView } from "@/components/settings/LabCatalogView";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";

export default async function LabCatalogPage() {
  const tests = await listLabTests(false);
  return (
    <PageShell>
      <PageHeader
        title="Lab catalog"
        description="Tests, samples, pricing, and billing codes"
        backHref="/settings"
        backLabel="Back to settings"
        actions={
          <Button
            nativeButton={false}
            render={<Link href="/settings/labs/edit" />}
            size="sm"
          >
            <Icon icon={faPen} data-icon="inline-start" />
            Edit
          </Button>
        }
      />
      <PageBody className="max-w-4xl">
        <Card title="Available tests" className="border border-border">
          <LabCatalogView tests={tests} />
        </Card>
      </PageBody>
    </PageShell>
  );
}

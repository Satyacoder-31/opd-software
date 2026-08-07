import Link from "next/link";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { listFeeItems } from "@/actions/fees";
import { FeeMasterView } from "@/components/settings/FeeMasterView";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";

export default async function FeeMasterPage() {
  const feeItems = await listFeeItems(false);

  return (
    <PageShell>
      <PageHeader
        title="Fee master"
        description="Consultation and procedure fees used in billing"
        backHref="/settings"
        backLabel="Back to settings"
        actions={
          <Button
            nativeButton={false}
            render={<Link href="/settings/fees/edit" />}
            size="sm"
          >
            <Icon icon={faPen} data-icon="inline-start" />
            Edit
          </Button>
        }
      />
      <PageBody className="max-w-3xl">
        <Card title="Fee items" className="border border-border">
          <FeeMasterView
            items={feeItems.map((item) => ({
              id: item.id,
              name: item.name,
              amount: Number(item.amount),
              isActive: item.isActive,
              hsnSac: item.hsnSac,
            }))}
          />
        </Card>
      </PageBody>
    </PageShell>
  );
}

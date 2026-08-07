import { listFeeItems } from "@/actions/fees";
import { FeeMasterEdit } from "@/components/settings/FeeMasterEdit";
import { Card } from "@/components/ui/Card";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";

export default async function EditFeeMasterPage() {
  const feeItems = await listFeeItems(false);

  return (
    <PageShell>
      <PageHeader
        title="Edit fee master"
        description="Add, deactivate, or reactivate consultation and procedure fees"
        backHref="/settings/fees"
        backLabel="Back to fee master"
      />
      <PageBody className="max-w-3xl">
        <Card title="Manage fee items" className="border border-border">
          <FeeMasterEdit
            initialItems={feeItems.map((item) => ({
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

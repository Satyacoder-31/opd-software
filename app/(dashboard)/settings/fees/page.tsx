import { listFeeItems } from "@/actions/fees";
import { FeeMasterPageClient } from "@/components/settings/FeeMasterPageClient";

export default async function FeeMasterPage() {
  const feeItems = await listFeeItems(false);

  return (
    <FeeMasterPageClient
      initialItems={feeItems.map((item) => ({
        id: item.id,
        name: item.name,
        amount: Number(item.amount),
        isActive: item.isActive,
        hsnSac: item.hsnSac,
      }))}
    />
  );
}

import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireSessionUser } from "@/lib/auth";
import { listFeeItems } from "@/actions/fees";
import { FeeMasterPageClient } from "@/components/settings/FeeMasterPageClient";

export default async function FeeMasterPage() {
  const session = await requireSessionUser();
  if (session.role !== Role.admin) redirect("/queue");

  const feeItems = await listFeeItems(false);

  return (
    <FeeMasterPageClient
      initialItems={feeItems.map((item) => ({
        id: item.id,
        name: item.name,
        amount: Number(item.amount),
        isActive: item.isActive,
      }))}
    />
  );
}

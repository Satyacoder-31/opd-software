import Link from "next/link";
import { listLabOrders } from "@/actions/labs";
import { LabsBoard } from "@/components/labs/LabsBoard";
import { Button } from "@/components/ui/Button";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";

export default async function LabsPage() {
  const orders = await listLabOrders();
  return (
    <PageShell>
      <PageHeader
        title="Laboratory"
        description="Collect samples and enter results"
        actions={<Button nativeButton={false} render={<Link href="/settings/labs" />} variant="secondary">Manage catalog</Button>}
      />
      <PageBody><LabsBoard initialOrders={orders} /></PageBody>
    </PageShell>
  );
}

"use client";

import { FeeMasterCard } from "@/components/settings/FeeMasterCard";
import { Card } from "@/components/ui/Card";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";

type FeeRow = {
  id: string;
  name: string;
  amount: number;
  isActive: boolean;
};

type FeeMasterPageClientProps = {
  initialItems: FeeRow[];
};

export function FeeMasterPageClient({ initialItems }: FeeMasterPageClientProps) {
  return (
    <PageShell>
      <PageHeader
        title="Fee master"
        description="Manage consultation and procedure fees for billing"
        backHref="/settings"
        backLabel="Back to settings"
      />
      <PageBody className="max-w-3xl">
        <Card title="Fee items" className="border border-border">
          <FeeMasterCard initialItems={initialItems} />
        </Card>
      </PageBody>
    </PageShell>
  );
}

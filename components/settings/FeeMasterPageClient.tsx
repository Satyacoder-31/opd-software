"use client";

import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { FeeMasterCard } from "@/components/settings/FeeMasterCard";
import { Card } from "@/components/ui/Card";
import { PageShell } from "@/components/ui/PageShell";

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
      <Card flush className="min-h-full border-y border-border">
        <div className="border-b border-border px-5 py-4">
          <Link
            href="/settings"
            aria-label="Back to settings"
            className="inline-flex items-center gap-1 text-ink hover:text-primary"
          >
            <ChevronLeftIcon className="size-5 shrink-0" aria-hidden />
            <h1 className="font-display text-lg font-semibold">Fee master</h1>
          </Link>
          <p className="mt-1 pl-6 text-sm text-muted-foreground">
            Manage consultation and procedure fees for billing
          </p>
        </div>
        <div className="px-5 py-5">
          <FeeMasterCard initialItems={initialItems} />
        </div>
      </Card>
    </PageShell>
  );
}

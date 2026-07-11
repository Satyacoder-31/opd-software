import Link from "next/link";
import { notFound } from "next/navigation";
import { getBillingContext } from "@/actions/invoices";
import { BillingForm } from "@/components/billing/BillingForm";
import { Card } from "@/components/ui/Card";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import type { LineItem } from "@/lib/types";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function BillingPage({ params }: Props) {
  const { id } = await params;
  const billing = await getBillingContext(id);

  if (!billing) notFound();

  const invoice = billing.invoice;

  return (
    <PageShell>
      <PageHeader
        title="Billing"
        description={`${billing.patient.name} · ${billing.patient.mrn}`}
        backHref={`/patients/${billing.patient.id}`}
        backLabel="Back to patient"
      />

      <Card title="Invoice" flush className="border-y border-border">
        <div className="px-5 py-5">
          <BillingForm
            consultationId={id}
            initial={{
              amount: invoice ? Number(invoice.amount) : 0,
              lineItems: (invoice?.lineItems as LineItem[] | null) ?? null,
              status: invoice?.status ?? "draft",
              paymentMode: invoice?.paymentMode ?? null,
              voidReason: invoice?.voidReason ?? null,
              taxRate: invoice?.taxRate != null ? Number(invoice.taxRate) : null,
              taxableAmount:
                invoice?.taxableAmount != null
                  ? Number(invoice.taxableAmount)
                  : null,
              taxAmount:
                invoice?.taxAmount != null ? Number(invoice.taxAmount) : null,
              invoiceNumber: invoice?.invoiceNumber ?? null,
            }}
          />
        </div>
      </Card>
    </PageShell>
  );
}

import { notFound } from "next/navigation";
import { getBillingContext } from "@/actions/invoices";
import { BillingForm } from "@/components/billing/BillingForm";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import type { LineItem, Vitals } from "@/lib/types";

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
        title="Patient Billing & Checkout"
        description={`${billing.patient.name} · UHID: ${billing.patient.mrn}`}
        backHref="/billing"
        backLabel="Back to billing hub"
      />

      <div className="border-y border-border bg-card px-4 py-6 sm:px-6 md:px-8">
        <BillingForm
          consultationId={id}
          patient={billing.patient}
          doctor={billing.doctor}
          appointment={billing.appointment}
          prescription={billing.prescription}
          clinic={billing.clinic}
          clinical={{
            chiefComplaint: billing.chiefComplaint,
            diagnosis: billing.diagnosis,
            notes: billing.notes,
          }}
          vitals={(billing.vitals as Vitals | null) ?? null}
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
    </PageShell>
  );
}

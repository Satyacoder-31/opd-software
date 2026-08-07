import { listClinicDrugItems } from "@/actions/drug-catalog";
import { DrugDictionaryEdit } from "@/components/settings/DrugDictionaryEdit";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";
import { COMMON_DRUGS } from "@/lib/drug-catalog";

export default async function EditMedicineDictionaryPage() {
  const items = await listClinicDrugItems();

  return (
    <PageShell>
      <PageHeader
        title="Edit medicine dictionary"
        description={`Add or update clinic medicines (${COMMON_DRUGS.length} common medicines always available)`}
        backHref="/settings/medicines"
        backLabel="Back to medicine dictionary"
      />
      <PageBody className="max-w-3xl">
        <DrugDictionaryEdit
          initialItems={items.map((item) => ({
            id: item.id,
            name: item.name,
            isActive: item.isActive,
            usageCount: item.usageCount,
            dosage: item.dosage,
            route: item.route,
            frequency: item.frequency,
            duration: item.duration,
            quantity: item.quantity,
            instructions: item.instructions,
          }))}
        />
      </PageBody>
    </PageShell>
  );
}

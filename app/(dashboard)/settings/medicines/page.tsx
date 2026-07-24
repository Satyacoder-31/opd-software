import { listClinicDrugItems } from "@/actions/drug-catalog";
import { DrugDictionaryCard } from "@/components/settings/DrugDictionaryCard";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";
import { COMMON_DRUGS } from "@/lib/drug-catalog";

export default async function MedicineDictionaryPage() {
  const items = await listClinicDrugItems();

  return (
    <PageShell>
      <PageHeader
        title="Medicine dictionary"
        description={`${COMMON_DRUGS.length} common medicines plus your clinic’s own entries`}
        backHref="/settings"
        backLabel="Back to settings"
      />
      <PageBody className="max-w-3xl">
        <DrugDictionaryCard
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

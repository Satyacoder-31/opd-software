import Link from "next/link";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { listClinicDrugItems } from "@/actions/drug-catalog";
import { DrugDictionaryView } from "@/components/settings/DrugDictionaryView";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
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
        actions={
          <Button
            nativeButton={false}
            render={<Link href="/settings/medicines/edit" />}
            size="sm"
          >
            <Icon icon={faPen} data-icon="inline-start" />
            Edit
          </Button>
        }
      />
      <PageBody className="max-w-3xl">
        <DrugDictionaryView
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

import { listMedicines, getMedicineStats, listStockMovements } from "@/actions/medicines";
import { MedicinesDashboard } from "@/components/medicines/MedicinesDashboard";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";

export const metadata = {
  title: "Medicines Directory | Dr. Ortho OPD",
  description: "Global drug catalog master, generic formulations, dosages, and prescribing templates.",
};

export default async function MedicinesPage() {
  const [medicines, stats, movements] = await Promise.all([
    listMedicines(),
    getMedicineStats(),
    listStockMovements(),
  ]);

  return (
    <PageShell>
      <PageHeader
        title="Medicines Directory"
        description="Global drug catalog master, generic salts, therapeutic classes, and consultation prescribing templates"
      />
      <PageBody>
        <MedicinesDashboard
          initialMedicines={medicines}
          initialStats={stats}
          initialMovements={movements}
        />
      </PageBody>
    </PageShell>
  );
}

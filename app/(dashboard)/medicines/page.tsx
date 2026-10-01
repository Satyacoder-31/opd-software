import { listMedicines, getMedicineStats, listStockMovements } from "@/actions/medicines";
import { MedicinesDashboard } from "@/components/medicines/MedicinesDashboard";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";

export const metadata = {
  title: "Medicines & Pharmacy Stock | Dr. Ortho OPD",
  description: "Manage clinic medicine catalog, inventory stocks, batches, and consultation dispensing.",
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
        title="Medicines & Pharmacy Inventory"
        description="Catalog master, real-time stock balances, batch & expiry tracking, and consultation dispensing"
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

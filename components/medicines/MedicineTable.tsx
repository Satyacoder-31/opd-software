"use client";

import { useState } from "react";
import {
  faCircleCheck,
  faTriangleExclamation,
  faCircleExclamation,
  faPlus,
  faPen,
  faSliders,
  faTrash,
  faCalendarDays,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { MedicineRecord } from "@/actions/medicines";
import { deleteMedicine } from "@/actions/medicines";
import { AddStockModal } from "./AddStockModal";
import { AdjustStockModal } from "./AdjustStockModal";
import { EditMedicineModal } from "./EditMedicineModal";

type MedicineTableProps = {
  medicines: MedicineRecord[];
  onRefresh: () => void;
  onFilterHistoryByDrug?: (drugId: string) => void;
};

export function MedicineTable({
  medicines,
  onRefresh,
  onFilterHistoryByDrug,
}: MedicineTableProps) {
  const [activeRestockMed, setActiveRestockMed] = useState<MedicineRecord | null>(null);
  const [activeAdjustMed, setActiveAdjustMed] = useState<MedicineRecord | null>(null);
  const [activeEditMed, setActiveEditMed] = useState<MedicineRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(med: MedicineRecord) {
    if (!window.confirm(`Deactivate / remove "${med.name}" from the active pharmacy catalog?`)) {
      return;
    }
    setDeletingId(med.id);
    await deleteMedicine(med.id);
    setDeletingId(null);
    onRefresh();
  }

  if (medicines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center bg-card">
        <p className="text-sm font-medium text-ink">No medicines found</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          No medicines match your current search or filter criteria. Try clearing filters or click &ldquo;Add Medicine&rdquo; to register new stock.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Medicine & Salt</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Available Stock</th>
              <th className="px-4 py-3">Batch & Expiry</th>
              <th className="px-4 py-3 text-right">MRP (₹)</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3 text-center">Rx Used</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {medicines.map((med) => {
              const isLow = med.status === "low_stock";
              const isOut = med.status === "out_of_stock";

              return (
                <tr key={med.id} className="hover:bg-muted/15 transition-colors group">
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-ink group-hover:text-primary transition-colors">
                      {med.name}
                    </div>
                    {med.genericName ? (
                      <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                        {med.genericName}
                      </div>
                    ) : null}
                    {med.strength ? (
                      <span className="inline-block text-[11px] font-medium text-muted-foreground">
                        {med.strength}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {med.category || "General"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          isOut
                            ? "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                            : isLow
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                            : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        )}
                      >
                        <Icon
                          icon={
                            isOut
                              ? faCircleExclamation
                              : isLow
                              ? faTriangleExclamation
                              : faCircleCheck
                          }
                          className="size-3"
                        />
                        {med.stockQuantity} units
                      </span>
                      {isLow ? (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400">
                          Min: {med.reorderLevel}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                    <div className="font-mono text-ink text-[11px]">
                      {med.batchNumber || "—"}
                    </div>
                    {med.expiryDate ? (
                      <div
                        className={cn(
                          "flex items-center gap-1 mt-0.5 font-medium",
                          med.isExpired
                            ? "text-rose-600 dark:text-rose-400"
                            : med.isExpiringSoon
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-muted-foreground"
                        )}
                      >
                        <Icon icon={faCalendarDays} className="size-2.5" />
                        <span>{med.expiryDate}</span>
                        {med.isExpired ? (
                          <span className="text-[10px] font-bold text-rose-600">(Expired)</span>
                        ) : med.isExpiringSoon ? (
                          <span className="text-[10px] font-bold text-amber-600">(&lt;60d)</span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-right font-medium text-ink">
                    {med.unitPrice != null ? `₹${med.unitPrice}` : "—"}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted-foreground">
                    {med.rackLocation ? (
                      <span className="inline-flex items-center gap-1 text-ink/80">
                        <Icon icon={faLocationDot} className="size-3 text-muted-foreground" />
                        {med.rackLocation}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-center text-xs text-muted-foreground font-medium">
                    {med.usageCount > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-primary text-[11px]">
                        {med.usageCount}×
                      </span>
                    ) : (
                      "0"
                    )}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-8 px-2.5 text-xs font-medium"
                        onClick={() => setActiveRestockMed(med)}
                        title="Restock units"
                      >
                        <Icon icon={faPlus} className="size-3 text-emerald-600 dark:text-emerald-400" />
                        Restock
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs"
                        onClick={() => setActiveAdjustMed(med)}
                        title="Adjust inventory count"
                      >
                        <Icon icon={faSliders} className="size-3 text-muted-foreground" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs"
                        onClick={() => setActiveEditMed(med)}
                        title="Edit medicine details"
                      >
                        <Icon icon={faPen} className="size-3 text-muted-foreground" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                        onClick={() => handleDelete(med)}
                        loading={deletingId === med.id}
                        title="Remove / Deactivate"
                      >
                        <Icon icon={faTrash} className="size-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {activeRestockMed ? (
        <AddStockModal
          medicine={activeRestockMed}
          open={Boolean(activeRestockMed)}
          onClose={() => setActiveRestockMed(null)}
          onSuccess={onRefresh}
        />
      ) : null}

      {activeAdjustMed ? (
        <AdjustStockModal
          medicine={activeAdjustMed}
          open={Boolean(activeAdjustMed)}
          onClose={() => setActiveAdjustMed(null)}
          onSuccess={onRefresh}
        />
      ) : null}

      {activeEditMed ? (
        <EditMedicineModal
          medicine={activeEditMed}
          open={Boolean(activeEditMed)}
          onClose={() => setActiveEditMed(null)}
          onSuccess={onRefresh}
        />
      ) : null}
    </>
  );
}

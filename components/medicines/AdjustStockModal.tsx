"use client";

import { useState } from "react";
import { adjustStock } from "@/actions/medicines";
import type { MedicineRecord } from "@/actions/medicines";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

type AdjustStockModalProps = {
  medicine: MedicineRecord;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function AdjustStockModal({
  medicine,
  open,
  onClose,
  onSuccess,
}: AdjustStockModalProps) {
  const [newQuantity, setNewQuantity] = useState(String(medicine.stockQuantity));
  const [reason, setReason] = useState<"correction" | "damaged" | "expired" | "return" | "other">(
    "correction"
  );
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const currentQty = medicine.stockQuantity;
  const targetQty = parseInt(newQuantity, 10);
  const diff = isNaN(targetQty) ? 0 : targetQty - currentQty;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isNaN(targetQty) || targetQty < 0) {
      setError("Please enter a non-negative stock quantity.");
      return;
    }

    setPending(true);
    setError(null);

    const result = await adjustStock({
      medicineId: medicine.id,
      newQuantity: targetQty,
      reason,
      notes: notes.trim() || undefined,
    });

    setPending(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onSuccess();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl animate-in fade-in-50 zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-border pb-3 mb-4">
          <h2 className="text-lg font-semibold text-ink">Adjust Stock Count</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit or physical count correction for <strong className="text-ink">{medicine.name}</strong>
          </p>
        </header>

        {error ? <Banner variant="error" className="mb-4">{error}</Banner> : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 text-xs">
            <div>
              <span className="text-muted-foreground block">System Stock:</span>
              <strong className="text-sm text-ink">{currentQty} units</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Net Change:</span>
              <strong
                className={`text-sm ${
                  diff > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : diff < 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-muted-foreground"
                }`}
              >
                {diff > 0 ? `+${diff}` : diff} units
              </strong>
            </div>
          </div>

          <Input
            label="Actual Physical Stock Count *"
            type="number"
            min="0"
            required
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
          />

          <Select
            label="Reason for Adjustment *"
            value={reason}
            onChange={(e) => setReason(e.target.value as "correction" | "damaged" | "expired" | "return" | "other")}
            options={[
              { value: "correction", label: "Physical count audit / correction" },
              { value: "damaged", label: "Damaged / Broken packaging" },
              { value: "expired", label: "Expired product discarded" },
              { value: "return", label: "Returned to distributor / supplier" },
              { value: "other", label: "Other reason" },
            ]}
          />

          <Textarea
            label="Adjustment Remarks / Audit Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Month-end inventory verification count"
            rows={2}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Save Adjustment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { addStock } from "@/actions/medicines";
import type { MedicineRecord } from "@/actions/medicines";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

type AddStockModalProps = {
  medicine: MedicineRecord;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function AddStockModal({
  medicine,
  open,
  onClose,
  onSuccess,
}: AddStockModalProps) {
  const [quantity, setQuantity] = useState("50");
  const [batchNumber, setBatchNumber] = useState(medicine.batchNumber || "");
  const [expiryDate, setExpiryDate] = useState(medicine.expiryDate || "");
  const [purchasePrice, setPurchasePrice] = useState(
    medicine.purchasePrice != null ? String(medicine.purchasePrice) : ""
  );
  const [unitPrice, setUnitPrice] = useState(
    medicine.unitPrice != null ? String(medicine.unitPrice) : ""
  );
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setError("Please enter a valid stock quantity to add.");
      return;
    }

    setPending(true);
    setError(null);

    const result = await addStock({
      medicineId: medicine.id,
      quantity: qty,
      batchNumber: batchNumber.trim() || undefined,
      expiryDate: expiryDate.trim() || undefined,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      unitPrice: unitPrice ? parseFloat(unitPrice) : undefined,
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
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl animate-in fade-in-50 zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-border pb-3 mb-4">
          <h2 className="text-lg font-semibold text-ink">Restock Medicine</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Receive incoming stock for <strong className="text-ink">{medicine.name}</strong>
          </p>
        </header>

        {error ? <Banner variant="error" className="mb-4">{error}</Banner> : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 text-xs">
            <div>
              <span className="text-muted-foreground block">Current Stock:</span>
              <strong className="text-sm text-ink">{medicine.stockQuantity} units</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">After Restock:</span>
              <strong className="text-sm text-emerald-600 dark:text-emerald-400">
                {medicine.stockQuantity + (parseInt(quantity, 10) || 0)} units
              </strong>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantity to Add *"
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 100"
            />
            <Input
              label="Batch Number"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder="e.g. BTH-2026-09"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Expiry Date"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
            <Input
              label="Selling Price / MRP (₹)"
              type="number"
              min="0"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="e.g. 120"
            />
          </div>

          <Input
            label="Purchase Cost per Unit (₹)"
            type="number"
            min="0"
            step="0.01"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            placeholder="e.g. 75"
          />

          <Textarea
            label="Vendor / Invoice / Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Received from Sun Pharma Distributor, Invoice #INV-8891"
            rows={2}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Confirm Restock
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

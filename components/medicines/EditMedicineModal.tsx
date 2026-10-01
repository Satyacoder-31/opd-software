"use client";

import { useState } from "react";
import { updateMedicine } from "@/actions/medicines";
import type { MedicineRecord } from "@/actions/medicines";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type EditMedicineModalProps = {
  medicine: MedicineRecord;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const CATEGORIES = [
  { value: "Tablet", label: "Tablet" },
  { value: "Capsule", label: "Capsule" },
  { value: "Syrup", label: "Syrup / Suspension" },
  { value: "Injection", label: "Injection / Ampoule" },
  { value: "IV Fluid", label: "IV Fluid / Infusion" },
  { value: "Gel / Ointment", label: "Gel / Ointment / Cream" },
  { value: "Drops", label: "Drops (Eye / Ear / Nasal)" },
  { value: "Inhaler", label: "Inhaler / Respule" },
  { value: "Sachet", label: "Sachet / Powder" },
  { value: "Suppository", label: "Suppository / Pessary" },
  { value: "Other", label: "Other" },
];

export function EditMedicineModal({
  medicine,
  open,
  onClose,
  onSuccess,
}: EditMedicineModalProps) {
  const [form, setForm] = useState({
    name: medicine.name,
    genericName: medicine.genericName || "",
    category: medicine.category || "Tablet",
    strength: medicine.strength || "",
    manufacturer: medicine.manufacturer || "",
    batchNumber: medicine.batchNumber || "",
    expiryDate: medicine.expiryDate || "",
    reorderLevel: String(medicine.reorderLevel),
    unitPrice: medicine.unitPrice != null ? String(medicine.unitPrice) : "",
    purchasePrice: medicine.purchasePrice != null ? String(medicine.purchasePrice) : "",
    rackLocation: medicine.rackLocation || "",
    dosage: medicine.dosage || "",
    route: medicine.route || "",
    frequency: medicine.frequency || "",
    duration: medicine.duration || "",
    instructions: medicine.instructions || "",
    isActive: medicine.isActive,
  });

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Please enter a medicine name.");
      return;
    }

    setPending(true);
    setError(null);

    const result = await updateMedicine(medicine.id, {
      name: form.name.trim(),
      genericName: form.genericName.trim() || null,
      category: form.category || null,
      strength: form.strength.trim() || null,
      manufacturer: form.manufacturer.trim() || null,
      batchNumber: form.batchNumber.trim() || null,
      expiryDate: form.expiryDate.trim() || null,
      reorderLevel: parseInt(form.reorderLevel, 10) || 10,
      unitPrice: form.unitPrice ? parseFloat(form.unitPrice) : null,
      purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : null,
      rackLocation: form.rackLocation.trim() || null,
      dosage: form.dosage.trim() || null,
      route: form.route.trim() || null,
      frequency: form.frequency.trim() || null,
      duration: form.duration.trim() || null,
      instructions: form.instructions.trim() || null,
      isActive: form.isActive,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl my-8 max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card p-6 shadow-xl animate-in fade-in-50 zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-border pb-3 mb-4 shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ink">Edit Medicine Details</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Update information, pricing, location, or prescribing defaults.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground block">Current Stock:</span>
            <span className="text-sm font-bold text-ink">{medicine.stockQuantity} units</span>
          </div>
        </header>

        {error ? <Banner variant="error" className="mb-4 shrink-0">{error}</Banner> : null}

        <form onSubmit={handleSubmit} className="overflow-y-auto pr-1 space-y-4 flex-1">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Product Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Medicine Name *"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                label="Generic Name / Active Salts"
                value={form.genericName}
                onChange={(e) => setForm({ ...form, genericName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                options={CATEGORIES}
              />
              <Input
                label="Strength"
                value={form.strength}
                onChange={(e) => setForm({ ...form, strength: e.target.value })}
              />
              <Input
                label="Manufacturer"
                value={form.manufacturer}
                onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Inventory & Location
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Input
                label="Reorder Alert Level *"
                type="number"
                min="0"
                required
                value={form.reorderLevel}
                onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
              />
              <Input
                label="Selling Price (MRP ₹)"
                type="number"
                min="0"
                step="0.01"
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
              />
              <Input
                label="Purchase Cost (₹)"
                type="number"
                min="0"
                step="0.01"
                value={form.purchasePrice}
                onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Batch Number"
                value={form.batchNumber}
                onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
              />
              <Input
                label="Expiry Date"
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              />
              <Input
                label="Shelf / Storage Rack"
                value={form.rackLocation}
                onChange={(e) => setForm({ ...form, rackLocation: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Prescription Defaults
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Input
                label="Dosage"
                value={form.dosage}
                onChange={(e) => setForm({ ...form, dosage: e.target.value })}
              />
              <Input
                label="Route"
                value={form.route}
                onChange={(e) => setForm({ ...form, route: e.target.value })}
              />
              <Input
                label="Frequency"
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Duration"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
              />
              <Input
                label="Instructions"
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-border">
            <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="size-4 rounded border-border"
              />
              <span>Active in pharmacy & prescription catalog</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border shrink-0">
            <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

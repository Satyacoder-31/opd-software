"use client";

import { useState } from "react";
import { createMedicine } from "@/actions/medicines";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type AddMedicineModalProps = {
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

export function AddMedicineModal({ open, onClose, onSuccess }: AddMedicineModalProps) {
  const [form, setForm] = useState({
    name: "",
    genericName: "",
    category: "Tablet",
    strength: "",
    manufacturer: "",
    batchNumber: "",
    expiryDate: "",
    stockQuantity: "100",
    reorderLevel: "15",
    unitPrice: "",
    purchasePrice: "",
    rackLocation: "",
    dosage: "1 tablet",
    route: "Oral",
    frequency: "Twice daily",
    duration: "5 Days",
    instructions: "After meals",
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

    const result = await createMedicine({
      name: form.name.trim(),
      genericName: form.genericName.trim() || null,
      category: form.category || null,
      strength: form.strength.trim() || null,
      manufacturer: form.manufacturer.trim() || null,
      batchNumber: form.batchNumber.trim() || null,
      expiryDate: form.expiryDate.trim() || null,
      stockQuantity: parseInt(form.stockQuantity, 10) || 0,
      reorderLevel: parseInt(form.reorderLevel, 10) || 10,
      unitPrice: form.unitPrice ? parseFloat(form.unitPrice) : null,
      purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : null,
      rackLocation: form.rackLocation.trim() || null,
      dosage: form.dosage.trim() || null,
      route: form.route.trim() || null,
      frequency: form.frequency.trim() || null,
      duration: form.duration.trim() || null,
      instructions: form.instructions.trim() || null,
      isActive: true,
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
        <header className="border-b border-border pb-3 mb-4 shrink-0">
          <h2 className="text-xl font-semibold text-ink">Add New Medicine</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Register a medicine into the clinic pharmacy catalog and set initial inventory.
          </p>
        </header>

        {error ? <Banner variant="error" className="mb-4 shrink-0">{error}</Banner> : null}

        <form onSubmit={handleSubmit} className="overflow-y-auto pr-1 space-y-4 flex-1">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Product & Composition
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Medicine Name *"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Augmentin 625 Duo"
              />
              <Input
                label="Generic Name / Active Salts"
                value={form.genericName}
                onChange={(e) => setForm({ ...form, genericName: e.target.value })}
                placeholder="e.g. Amoxicillin + Clavulanic Acid"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Form / Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                options={CATEGORIES}
              />
              <Input
                label="Strength"
                value={form.strength}
                onChange={(e) => setForm({ ...form, strength: e.target.value })}
                placeholder="e.g. 625 mg"
              />
              <Input
                label="Manufacturer / Brand"
                value={form.manufacturer}
                onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                placeholder="e.g. GSK, Cipla"
              />
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Inventory, Stock & Pricing
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input
                label="Initial Stock *"
                type="number"
                min="0"
                required
                value={form.stockQuantity}
                onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                placeholder="100"
              />
              <Input
                label="Reorder Level *"
                type="number"
                min="0"
                required
                value={form.reorderLevel}
                onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
                placeholder="15"
              />
              <Input
                label="MRP / Sale (₹)"
                type="number"
                min="0"
                step="0.01"
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                placeholder="180"
              />
              <Input
                label="Cost Price (₹)"
                type="number"
                min="0"
                step="0.01"
                value={form.purchasePrice}
                onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                placeholder="120"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Batch Number"
                value={form.batchNumber}
                onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                placeholder="e.g. BTH-2026-01"
              />
              <Input
                label="Expiry Date"
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              />
              <Input
                label="Shelf / Rack Location"
                value={form.rackLocation}
                onChange={(e) => setForm({ ...form, rackLocation: e.target.value })}
                placeholder="e.g. Shelf A-3"
              />
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Prescription Defaults (for Doctor Auto-fill)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Input
                label="Default Dose"
                value={form.dosage}
                onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                placeholder="1 tablet"
              />
              <Input
                label="Route"
                value={form.route}
                onChange={(e) => setForm({ ...form, route: e.target.value })}
                placeholder="Oral"
              />
              <Input
                label="Frequency"
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                placeholder="Twice daily"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Duration"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="5 Days"
              />
              <Input
                label="Instructions"
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                placeholder="After meals with water"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border shrink-0">
            <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Save Medicine & Stock
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { createLabTest, deleteLabTest, listLabTests } from "@/actions/labs";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Test = Awaited<ReturnType<typeof listLabTests>>[number];

type LabCatalogEditProps = {
  initialTests: Test[];
};

export function LabCatalogEdit({ initialTests }: LabCatalogEditProps) {
  const [tests, setTests] = useState(initialTests);
  const [form, setForm] = useState({
    name: "",
    code: "",
    sampleType: "",
    feeAmount: "",
    hsnSac: "",
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await createLabTest({
      name: form.name,
      code: form.code,
      sampleType: form.sampleType,
      feeAmount: form.feeAmount ? Number(form.feeAmount) : undefined,
      hsnSac: form.hsnSac,
    });
    setPending(false);
    if (!result.success) return setError(result.error);
    setForm({ name: "", code: "", sampleType: "", feeAmount: "", hsnSac: "" });
    setTests(await listLabTests(false));
  }

  async function remove(id: string) {
    const result = await deleteLabTest(id);
    if (!result.success) return setError(result.error);
    setTests(await listLabTests(false));
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={add} className="grid gap-3 md:grid-cols-2">
        <Input
          label="Test name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <Input
          label="Code"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
        />
        <Input
          label="Sample type"
          value={form.sampleType}
          onChange={(e) => setForm({ ...form, sampleType: e.target.value })}
          placeholder="Blood, urine…"
        />
        <Input
          label="Fee (₹)"
          type="number"
          min="0"
          step="0.01"
          value={form.feeAmount}
          onChange={(e) => setForm({ ...form, feeAmount: e.target.value })}
        />
        <Input
          label="HSN / SAC"
          value={form.hsnSac}
          onChange={(e) => setForm({ ...form, hsnSac: e.target.value })}
        />
        <div className="flex items-end">
          <Button type="submit" loading={pending}>
            Add lab test
          </Button>
        </div>
      </form>
      {error ? <Banner variant="error">{error}</Banner> : null}
      <ul className="divide-y divide-border rounded-lg border border-border">
        {tests.map((test) => (
          <li
            key={test.id}
            className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
          >
            <span>
              <strong>{test.name}</strong>
              <span className="block text-muted-foreground">
                {[
                  test.code,
                  test.sampleType,
                  test.feeAmount ? `₹${Number(test.feeAmount)}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                {!test.isActive ? " · inactive" : ""}
              </span>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void remove(test.id)}
            >
              {test.isActive ? "Deactivate" : "Remove"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

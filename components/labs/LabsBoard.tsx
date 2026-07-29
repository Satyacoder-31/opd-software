"use client";

import { useState } from "react";
import { enterLabResult, listLabOrders, updateLabItemStatus } from "@/actions/labs";
import { LabItemStatus } from "@prisma/client";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Order = Awaited<ReturnType<typeof listLabOrders>>[number];

export function LabsBoard({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [drafts, setDrafts] = useState<Record<string, { value: string; unit: string; notes: string }>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  async function refresh() {
    setOrders(await listLabOrders());
  }
  async function collect(id: string) {
    setPending(id);
    const result = await updateLabItemStatus(id, LabItemStatus.collected);
    setPending(null);
    if (!result.success) return setError(result.error);
    await refresh();
  }
  async function save(id: string) {
    const draft = drafts[id] ?? { value: "", unit: "", notes: "" };
    setPending(id);
    const result = await enterLabResult(id, { resultValue: draft.value, resultUnit: draft.unit, resultNotes: draft.notes });
    setPending(null);
    if (!result.success) return setError(result.error);
    await refresh();
  }
  return (
    <div className="flex flex-col gap-4">
      {error ? <Banner variant="error">{error}</Banner> : null}
      {!orders.length ? <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">No lab orders yet.</p> : null}
      {orders.map((order) => (
        <section key={order.id} className="rounded-xl border border-border bg-card">
          <header className="flex flex-wrap justify-between gap-2 border-b border-border px-4 py-3">
            <div><strong>{order.patient.name}</strong><span className="ml-2 text-sm text-muted-foreground">{order.patient.mrn}</span></div>
            <span className="text-sm capitalize text-muted-foreground">{order.status} · {order.createdAt.toLocaleString("en-IN")}</span>
          </header>
          <div className="divide-y divide-border">
            {order.items.map((item) => {
              const draft = drafts[item.id] ?? { value: item.resultValue ?? "", unit: item.resultUnit ?? "", notes: item.resultNotes ?? "" };
              return (
                <div key={item.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_1fr_8rem_auto]">
                  <div className="text-sm"><strong>{item.labTest.name}</strong><span className="block capitalize text-muted-foreground">{item.status}</span></div>
                  <Input aria-label={`${item.labTest.name} result`} placeholder="Result value" value={draft.value} onChange={(e) => setDrafts({ ...drafts, [item.id]: { ...draft, value: e.target.value } })} />
                  <Input aria-label={`${item.labTest.name} unit`} placeholder="Unit" value={draft.unit} onChange={(e) => setDrafts({ ...drafts, [item.id]: { ...draft, unit: e.target.value } })} />
                  <div className="flex items-center gap-2">
                    {item.status === LabItemStatus.pending ? <Button type="button" size="sm" variant="secondary" onClick={() => void collect(item.id)} loading={pending === item.id}>Collect</Button> : null}
                    <Button type="button" size="sm" onClick={() => void save(item.id)} loading={pending === item.id}>Save result</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

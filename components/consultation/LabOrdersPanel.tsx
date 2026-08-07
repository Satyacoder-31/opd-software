"use client";

import { useEffect, useState } from "react";
import { createLabOrder, getLabOrdersForConsultation, listLabTests } from "@/actions/labs";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";

type Test = Awaited<ReturnType<typeof listLabTests>>[number];
type Order = Awaited<ReturnType<typeof getLabOrdersForConsultation>>[number];

export function LabOrdersPanel({ consultationId }: { consultationId: string }) {
  const [tests, setTests] = useState<Test[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    void Promise.all([listLabTests(), getLabOrdersForConsultation(consultationId)]).then(([nextTests, nextOrders]) => {
      setTests(nextTests);
      setOrders(nextOrders);
    });
  }, [consultationId]);
  async function submit() {
    setPending(true);
    setMessage(null);
    const result = await createLabOrder(consultationId, selected);
    setPending(false);
    if (!result.success) {
      setMessage(result.error);
      return;
    }
    setSelected([]);
    setOrders(await getLabOrdersForConsultation(consultationId));
  }
  return (
    <CollapsibleSection flush density="compact" contentClassName="px-3 py-3 md:px-4" title="Lab orders">
      <div className="flex flex-col gap-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {tests.map((test) => (
            <label key={test.id} className="flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm">
              <input type="checkbox" checked={selected.includes(test.id)} onChange={(e) => setSelected((prev) => e.target.checked ? [...prev, test.id] : prev.filter((id) => id !== test.id))} />
              <span>{test.name}{test.sampleType ? ` · ${test.sampleType}` : ""}</span>
            </label>
          ))}
        </div>
        {message ? <Banner variant="error">{message}</Banner> : null}
        <div><Button type="button" onClick={submit} loading={pending} disabled={!selected.length}>Order selected tests</Button></div>
        {orders.length ? (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {orders.map((order) => (
              <li key={order.id} className="px-3 py-2 text-sm">
                <strong className="capitalize">{order.status}</strong>
                <span className="text-muted-foreground"> · {order.items.map((item) => item.labTest.name).join(", ")}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">No lab orders for this visit.</p>}
      </div>
    </CollapsibleSection>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  faCheck,
  faFlaskVial,
  faMagnifyingGlass,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { createLabOrder, getLabOrdersForConsultation, listLabTests } from "@/actions/labs";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type Test = Awaited<ReturnType<typeof listLabTests>>[number];
type Order = Awaited<ReturnType<typeof getLabOrdersForConsultation>>[number];

const RECOMMENDED_LAB_PANELS = [
  {
    name: "Arthritis & Joint Panel",
    keywords: ["uric", "crp", "esr", "cbc", "ra", "rheumatoid", "calcium"],
  },
  {
    name: "Diabetes & Metabolic Screen",
    keywords: ["sugar", "glucose", "fbs", "hba1c", "lipid", "creatinine"],
  },
  {
    name: "Fever & Infection Profile",
    keywords: ["cbc", "esr", "crp", "urine", "widal", "dengue"],
  },
  {
    name: "Pre-Operative / Baseline Workup",
    keywords: ["cbc", "blood group", "pt", "inr", "creatinine", "viral", "hiv", "hcv", "hbsag"],
  },
] as const;

export function LabOrdersPanel({ consultationId }: { consultationId: string }) {
  const [tests, setTests] = useState<Test[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void Promise.all([
      listLabTests(),
      getLabOrdersForConsultation(consultationId),
    ]).then(([nextTests, nextOrders]) => {
      setTests(nextTests);
      setOrders(nextOrders);
    });
  }, [consultationId]);

  const filteredTests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tests;
    return tests.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.sampleType && t.sampleType.toLowerCase().includes(q))
    );
  }, [tests, searchQuery]);

  function applyPanel(panelKeywords: readonly string[]) {
    const matchedIds = tests
      .filter((t) =>
        panelKeywords.some((kw) => t.name.toLowerCase().includes(kw))
      )
      .map((t) => t.id);

    setSelected((prev) => Array.from(new Set([...prev, ...matchedIds])));
  }

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
    <CollapsibleSection
      flush
      density="compact"
      contentClassName="px-3 py-3 md:px-4"
      title="Lab orders"
      summary={
        orders.length > 0
          ? `${orders.length} ${orders.length === 1 ? "order" : "orders"} placed`
          : undefined
      }
    >
      <div className="flex flex-col gap-3.5">
        {/* Clean Recommended Panels Dropdown */}
        {tests.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Icon icon={faFlaskVial} className="size-3.5 text-primary" />
              <label htmlFor="lab-panel-dropdown" className="text-xs font-semibold text-ink">
                Test panels:
              </label>
              <select
                id="lab-panel-dropdown"
                defaultValue=""
                onChange={(e) => {
                  const found = RECOMMENDED_LAB_PANELS.find((p) => p.name === e.target.value);
                  if (found) {
                    applyPanel(found.keywords);
                    e.target.value = "";
                  }
                }}
                className="h-8 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-ink transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="" disabled>Select recommended panel ▾</option>
                {RECOMMENDED_LAB_PANELS.map((p) => (
                  <option key={p.name} value={p.name}>
                    + {p.name}
                  </option>
                ))}
              </select>
            </div>

            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => setSelected([])}
                className="text-xs font-medium text-muted-foreground hover:text-danger transition-colors px-1"
                title="Clear selected tests"
              >
                Clear selected ({selected.length})
              </button>
            )}
          </div>
        )}

        {/* Search bar */}
        {tests.length > 4 && (
          <div className="relative max-w-sm">
            <Icon
              icon={faMagnifyingGlass}
              className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests (e.g. CBC, ESR, Uric acid, Sugar)…"
              className="h-8 w-full rounded-md border border-border bg-card pl-8 pr-7 text-xs text-ink placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink"
              >
                <Icon icon={faXmark} className="size-2.5" />
              </button>
            )}
          </div>
        )}

        {/* Tests grid */}
        <div className="grid gap-2 sm:grid-cols-2">
          {filteredTests.map((test) => {
            const isChecked = selected.includes(test.id);
            return (
              <label
                key={test.id}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-lg border border-border px-3 text-sm transition-colors",
                  isChecked
                    ? "border-primary/50 bg-primary/5 font-medium text-ink"
                    : "bg-card hover:border-primary/30"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) =>
                      setSelected((prev) =>
                        e.target.checked
                          ? [...prev, test.id]
                          : prev.filter((id) => id !== test.id)
                      )
                    }
                    className="size-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="truncate">{test.name}</span>
                </div>
                {test.sampleType && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {test.sampleType}
                  </span>
                )}
              </label>
            );
          })}
        </div>

        {filteredTests.length === 0 && tests.length > 0 && (
          <p className="py-2 text-xs text-muted-foreground">
            No lab tests found matching “{searchQuery}”.
          </p>
        )}

        {message ? <Banner variant="error">{message}</Banner> : null}

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={submit}
            loading={pending}
            disabled={!selected.length}
          >
            Order selected tests ({selected.length})
          </Button>
          {selected.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {selected.length} {selected.length === 1 ? "test" : "tests"} selected
            </span>
          )}
        </div>

        {/* Existing placed orders */}
        {orders.length ? (
          <div className="mt-2 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Orders Placed for this visit ({orders.length}):
            </h4>
            <ul className="divide-y divide-border rounded-lg border border-border bg-card">
              {orders.map((order) => (
                <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium text-ink">
                      {order.items.map((item) => item.labTest.name).join(", ")}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold capitalize text-primary">
                    <Icon icon={faCheck} className="size-2.5" />
                    {order.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No lab tests have been ordered yet for this visit.
          </p>
        )}
      </div>
    </CollapsibleSection>
  );
}

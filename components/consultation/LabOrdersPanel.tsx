"use client";

import { useEffect, useMemo, useState } from "react";
import {
  faCheck,
  faFlaskVial,
  faMagnifyingGlass,
  faPlus,
  faRotate,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import {
  createLabOrder,
  createLabTest,
  getLabOrdersForConsultation,
  listLabTests,
} from "@/actions/labs";
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
    keywords: ["sugar", "glucose", "fbs", "ppbs", "hba1c", "lipid", "creatinine"],
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
  const [messageType, setMessageType] = useState<"error" | "info" | "success">("error");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);

  // Quick custom test creation
  const [customTestName, setCustomTestName] = useState("");
  const [addingCustom, setAddingCustom] = useState(false);

  async function loadData() {
    setLoading(true);
    setMessage(null);
    try {
      const [nextTests, nextOrders] = await Promise.all([
        listLabTests(),
        getLabOrdersForConsultation(consultationId),
      ]);
      setTests(nextTests);
      setOrders(nextOrders);
    } catch {
      setMessage("Failed to load lab test catalog. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [consultationId]);

  const filteredTests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tests;
    return tests.filter((t) => {
      const name = t.name.toLowerCase();
      const sample = (t.sampleType ?? "").toLowerCase();
      const code = (t.code ?? "").toLowerCase();
      return name.includes(q) || sample.includes(q) || code.includes(q);
    });
  }, [tests, searchQuery]);

  function applyPanel(panelKeywords: readonly string[], panelTitle: string) {
    const matchedIds = tests
      .filter((t) => {
        const name = t.name.toLowerCase();
        const code = (t.code ?? "").toLowerCase();
        return panelKeywords.some(
          (kw) => name.includes(kw.toLowerCase()) || code.includes(kw.toLowerCase())
        );
      })
      .map((t) => t.id);

    if (matchedIds.length === 0) {
      setMessage(`No matching tests found in catalog for ${panelTitle}.`);
      setMessageType("info");
      return;
    }

    setSelected((prev) => Array.from(new Set([...prev, ...matchedIds])));
    setMessage(`Selected ${matchedIds.length} tests for ${panelTitle}.`);
    setMessageType("info");
  }

  function toggleTest(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  async function handleAddCustomTest(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = customTestName.trim();
    if (!trimmed) return;

    setAddingCustom(true);
    setMessage(null);
    const res = await createLabTest({
      name: trimmed,
      sampleType: "Blood",
    });
    setAddingCustom(false);

    if (!res.success) {
      setMessage(res.error);
      setMessageType("error");
      return;
    }

    const updatedTests = await listLabTests();
    setTests(updatedTests);
    setSelected((prev) => [...prev, res.data.id]);
    setCustomTestName("");
    setMessage(`Added "${trimmed}" and marked for order.`);
    setMessageType("success");
  }

  async function submit() {
    setPending(true);
    setMessage(null);
    const result = await createLabOrder(consultationId, selected);
    setPending(false);
    if (!result.success) {
      setMessage(result.error);
      setMessageType("error");
      return;
    }
    setSelected([]);
    setMessage("Lab order placed successfully.");
    setMessageType("success");
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
        {loading ? (
          <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
            <Icon icon={faRotate} className="size-3.5 animate-spin text-primary" />
            <span>Loading diagnostic test catalog…</span>
          </div>
        ) : (
          <>
            {/* Top Bar: Recommended Panels & Quick Clear */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
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
                      applyPanel(found.keywords, found.name);
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

            {/* Search and Quick-Add Row */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-sm">
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

              {/* Inline Custom Test Adder */}
              <form onSubmit={handleAddCustomTest} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={customTestName}
                  onChange={(e) => setCustomTestName(e.target.value)}
                  placeholder="Add custom test…"
                  className="h-8 w-36 sm:w-44 rounded-md border border-border bg-card px-2.5 text-xs text-ink placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-xs shrink-0"
                  loading={addingCustom}
                  disabled={!customTestName.trim()}
                  title="Add custom test to clinic catalog & select for this visit"
                >
                  <Icon icon={faPlus} className="mr-1 size-2.5" />
                  Add
                </Button>
              </form>
            </div>

            {/* Test Checkbox Grid */}
            {filteredTests.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTests.map((test) => {
                  const isChecked = selected.includes(test.id);
                  return (
                    <div
                      key={test.id}
                      onClick={() => toggleTest(test.id)}
                      className={cn(
                        "flex min-h-11 cursor-pointer select-none items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors",
                        isChecked
                          ? "border-primary/70 bg-primary/10 font-semibold text-primary"
                          : "border-border bg-card hover:border-primary/40 hover:bg-muted/40 text-ink"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent div onClick
                          className="size-4 rounded border-border text-primary focus:ring-primary pointer-events-none"
                        />
                        <span className="truncate">{test.name}</span>
                      </div>
                      {test.sampleType && (
                        <span
                          className={cn(
                            "shrink-0 rounded px-1.5 py-0.5 text-[10px]",
                            isChecked
                              ? "bg-primary/20 text-primary font-medium"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {test.sampleType}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : tests.length > 0 ? (
              <p className="py-2 text-xs text-muted-foreground">
                No lab tests found matching “{searchQuery}”. You can add it using the “Add custom test” input above.
              </p>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-4 text-center">
                <p className="text-xs text-muted-foreground mb-2">
                  No tests found in your clinic catalog.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={loadData}
                >
                  <Icon icon={faRotate} className="mr-1.5 size-3" />
                  Load Standard Laboratory Tests
                </Button>
              </div>
            )}

            {message ? (
              <Banner variant={messageType === "error" ? "error" : "info"}>
                {message}
              </Banner>
            ) : null}

            {/* Place Order Action Bar */}
            <div className="flex items-center gap-3 pt-1">
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
                  {selected.length} {selected.length === 1 ? "test" : "tests"} ready to order
                </span>
              )}
            </div>

            {/* Existing placed orders list */}
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
          </>
        )}
      </div>
    </CollapsibleSection>
  );
}

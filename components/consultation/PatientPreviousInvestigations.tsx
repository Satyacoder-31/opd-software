"use client";

import { useMemo, useState } from "react";
import {
  faCheck,
  faChevronDown,
  faChevronUp,
  faClockRotateLeft,
  faCopy,
  faFileWaveform,
  faFlaskVial,
  faMagnifyingGlass,
  faNotesMedical,
  faRotateRight,
  faXRay,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import type {
  PatientAdvisedInvestigationItem,
  PatientInvestigationHistory,
  PatientLabResultItem,
  PatientPreviousInvestigationRecord,
} from "@/actions/labs";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type PatientPreviousInvestigationsProps = {
  history: PatientInvestigationHistory;
  loading?: boolean;
  onCopyLabResult?: (text: string) => void;
  onCopyPastFindings?: (field: "labs" | "imaging" | "other", text: string) => void;
  onReorderTests?: (testIds: string[]) => void;
};

type ViewTab = "labs" | "advised" | "findings";

export function PatientPreviousInvestigations({
  history,
  loading = false,
  onCopyLabResult,
  onCopyPastFindings,
  onReorderTests,
}: PatientPreviousInvestigationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>("labs");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { labResults, advisedInvestigations, previousConsultationInvestigations } = history;

  const totalRecords =
    labResults.length + advisedInvestigations.length + previousConsultationInvestigations.length;

  const filteredLabResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return labResults;
    return labResults.filter(
      (r) =>
        r.testName.toLowerCase().includes(q) ||
        (r.testCode && r.testCode.toLowerCase().includes(q)) ||
        (r.resultValue && r.resultValue.toLowerCase().includes(q)) ||
        (r.resultNotes && r.resultNotes.toLowerCase().includes(q))
    );
  }, [labResults, searchQuery]);

  const filteredAdvised = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return advisedInvestigations;
    return advisedInvestigations.filter(
      (order) =>
        order.tests.some((t) => t.name.toLowerCase().includes(q)) ||
        order.orderedByName.toLowerCase().includes(q)
    );
  }, [advisedInvestigations, searchQuery]);

  const filteredFindings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return previousConsultationInvestigations;
    return previousConsultationInvestigations.filter(
      (item) =>
        (item.investigationResults.labs && item.investigationResults.labs.toLowerCase().includes(q)) ||
        (item.investigationResults.imaging && item.investigationResults.imaging.toLowerCase().includes(q)) ||
        (item.investigationResults.other && item.investigationResults.other.toLowerCase().includes(q)) ||
        (item.diagnosis && item.diagnosis.toLowerCase().includes(q)) ||
        (item.advice && item.advice.toLowerCase().includes(q))
    );
  }, [previousConsultationInvestigations, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 border-b border-border bg-sky-500/[0.04] px-3 py-2 text-xs text-muted-foreground md:px-4">
        <Icon icon={faClockRotateLeft} className="size-3 animate-spin text-sky-600" />
        <span>Loading patient investigation & lab history…</span>
      </div>
    );
  }

  if (totalRecords === 0) {
    return null;
  }

  function handleCopy(key: string, text: string, action?: () => void) {
    if (action) {
      action();
    }
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 2000);
  }

  return (
    <section
      aria-label="Patient previous investigations and lab results"
      className="border-b border-border bg-sky-500/[0.03] transition-colors"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 md:px-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded-md bg-sky-500/15 text-sky-600"
            aria-hidden
          >
            <Icon icon={faFlaskVial} className="size-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ink sm:text-sm">
                Previous Investigations & Lab Results
              </h4>
              <div className="flex items-center gap-1.5">
                {labResults.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    {labResults.length} {labResults.length === 1 ? "lab result" : "lab results"}
                  </span>
                )}
                {advisedInvestigations.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                    {advisedInvestigations.length} advised {advisedInvestigations.length === 1 ? "order" : "orders"}
                  </span>
                )}
                {previousConsultationInvestigations.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-violet-500/15 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:text-violet-300">
                    {previousConsultationInvestigations.length} prior {previousConsultationInvestigations.length === 1 ? "visit" : "visits"}
                  </span>
                )}
              </div>
            </div>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Review previous lab test results, advice investigations, and clinical imaging notes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Most recent result preview chip when collapsed */}
          {!isOpen && labResults[0] && (
            <div
              className="hidden max-w-xs truncate rounded-md border border-border/80 bg-card px-2.5 py-1 text-xs md:block cursor-pointer hover:border-sky-500/40"
              onClick={() => setIsOpen(true)}
              title="Click to view all past investigations"
            >
              <span className="text-muted-foreground">Latest:</span>{" "}
              <strong className="text-ink">{labResults[0].testName}</strong>{" "}
              <span className="font-semibold text-primary">
                {labResults[0].resultValue} {labResults[0].resultUnit ?? ""}
              </span>
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen((prev) => !prev)}
            className="h-8 gap-1.5 px-2.5 text-xs font-medium text-ink"
            aria-expanded={isOpen}
          >
            <span>{isOpen ? "Hide history" : "View investigations"}</span>
            <Icon
              icon={isOpen ? faChevronUp : faChevronDown}
              className="size-3 text-muted-foreground"
            />
          </Button>
        </div>
      </div>

      {/* Expanded Drawer / Body */}
      {isOpen && (
        <div className="border-t border-border/70 bg-card px-3 py-3 md:px-4">
          {/* Sub-tabs and Search Row */}
          <div className="mb-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab("labs")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                  activeTab === "labs"
                    ? "bg-card text-sky-700 dark:text-sky-400 shadow-sm"
                    : "text-muted-foreground hover:text-ink"
                )}
              >
                Lab Results ({labResults.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("advised")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                  activeTab === "advised"
                    ? "bg-card text-sky-700 dark:text-sky-400 shadow-sm"
                    : "text-muted-foreground hover:text-ink"
                )}
              >
                Advised Investigations ({advisedInvestigations.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("findings")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                  activeTab === "findings"
                    ? "bg-card text-sky-700 dark:text-sky-400 shadow-sm"
                    : "text-muted-foreground hover:text-ink"
                )}
              >
                Clinical Findings ({previousConsultationInvestigations.length})
              </button>
            </div>

            {/* Quick Filter */}
            <div className="relative w-full sm:w-64">
              <Icon
                icon={faMagnifyingGlass}
                className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tests or results…"
                className="h-7 w-full rounded-md border border-border bg-card pl-8 pr-7 text-xs text-ink placeholder:text-muted-foreground focus-visible:border-sky-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-500"
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
          </div>

          {/* TAB 1: LAB RESULTS */}
          {activeTab === "labs" && (
            <div>
              {filteredLabResults.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
                  {searchQuery ? "No lab results matched your search." : "No laboratory results recorded yet for this patient."}
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredLabResults.map((result) => {
                    const formattedDate = result.resultedAt
                      ? new Date(result.resultedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : new Date(result.orderedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        });

                    const copySnippet = `${result.testName}: ${result.resultValue} ${result.resultUnit ?? ""}`.trim();
                    const isCopied = copiedKey === `lab-${result.id}`;

                    return (
                      <div
                        key={result.id}
                        className="flex flex-col justify-between rounded-lg border border-border bg-card p-3 shadow-xs hover:border-sky-500/40 transition-colors"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-ink line-clamp-1">
                              {result.testName}
                            </span>
                            <span
                              className={cn(
                                "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold capitalize",
                                result.status === "resulted"
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                  : result.status === "collected"
                                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                    : "bg-sky-500/10 text-sky-700 dark:text-sky-400"
                              )}
                            >
                              {result.status}
                            </span>
                          </div>

                          {/* Value Display */}
                          <div className="my-2 rounded-md bg-muted/30 px-2.5 py-1.5">
                            <span className="font-display text-base font-bold text-ink">
                              {result.resultValue ?? "—"}
                            </span>
                            {result.resultUnit && (
                              <span className="ml-1 text-xs font-medium text-muted-foreground">
                                {result.resultUnit}
                              </span>
                            )}
                            {result.resultNotes && (
                              <p className="mt-0.5 text-[11px] text-muted-foreground italic line-clamp-2">
                                Note: {result.resultNotes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Meta and Copy Action */}
                        <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
                          <span title={`Ordered by ${result.orderedByName}`}>
                            {formattedDate} {result.tokenNumber ? `· #${result.tokenNumber}` : ""}
                          </span>

                          {onCopyLabResult && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(`lab-${result.id}`, copySnippet, () =>
                                  onCopyLabResult(copySnippet)
                                )
                              }
                              className={cn(
                                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors",
                                isCopied
                                  ? "bg-emerald-500/15 text-emerald-700 font-semibold"
                                  : "bg-sky-500/10 text-sky-700 hover:bg-sky-500/20"
                              )}
                              title="Copy test name and value into consultation notes"
                            >
                              <Icon
                                icon={isCopied ? faCheck : faCopy}
                                className="size-2.5"
                              />
                              {isCopied ? "Copied" : "Copy to notes"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADVISED INVESTIGATIONS */}
          {activeTab === "advised" && (
            <div className="space-y-3">
              {filteredAdvised.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
                  {searchQuery ? "No advised investigations matched your search." : "No previous investigation orders found."}
                </div>
              ) : (
                filteredAdvised.map((order) => {
                  const formattedDate = new Date(order.orderedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const testIds = order.tests.map((t) => t.testId);

                  return (
                    <div
                      key={order.id}
                      className="rounded-lg border border-border bg-card p-3 shadow-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-ink">
                            Visit on {formattedDate}
                          </span>
                          {order.tokenNumber && (
                            <span className="text-xs text-muted-foreground">
                              · Token #{order.tokenNumber}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            · Dr. {order.orderedByName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                              order.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-700"
                                : order.status === "collected"
                                  ? "bg-amber-500/10 text-amber-700"
                                  : "bg-sky-500/10 text-sky-700"
                            )}
                          >
                            {order.status}
                          </span>

                          {onReorderTests && testIds.length > 0 && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => onReorderTests(testIds)}
                              className="h-6 gap-1 px-2 text-[11px]"
                              title="Select these tests to order in the current visit"
                            >
                              <Icon icon={faRotateRight} className="size-2.5" />
                              Order again
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Tests in this order */}
                      <div className="mt-2.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {order.tests.map((test) => (
                          <div
                            key={test.id}
                            className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-muted/20 px-2.5 py-1.5 text-xs"
                          >
                            <div className="min-w-0">
                              <span className="block font-medium text-ink truncate">
                                {test.name}
                              </span>
                              {test.sampleType && (
                                <span className="text-[10px] text-muted-foreground">
                                  {test.sampleType}
                                </span>
                              )}
                            </div>
                            <div className="shrink-0 text-right">
                              {test.resultValue ? (
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                  {test.resultValue} {test.resultUnit ?? ""}
                                </span>
                              ) : (
                                <span className="text-[10px] capitalize text-muted-foreground">
                                  {test.status}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {order.notes && (
                        <p className="mt-2 text-xs text-muted-foreground italic">
                          Notes: {order.notes}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: CLINICAL FINDINGS FROM PRIOR VISITS */}
          {activeTab === "findings" && (
            <div className="space-y-3">
              {filteredFindings.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
                  {searchQuery ? "No clinical findings matched your search." : "No previous investigation notes on file."}
                </div>
              ) : (
                filteredFindings.map((rec) => {
                  const formattedDate = new Date(rec.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <div
                      key={rec.consultationId}
                      className="rounded-lg border border-border bg-card p-3 shadow-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2 text-xs">
                        <div className="flex items-center gap-2">
                          <strong>Visit: {formattedDate}</strong>
                          {rec.tokenNumber && <span>· Token #{rec.tokenNumber}</span>}
                          <span className="text-muted-foreground">· Dr. {rec.doctorName}</span>
                          {rec.diagnosis && (
                            <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-ink">
                              {rec.diagnosis}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-2.5 space-y-2 text-xs">
                        {rec.investigationResults.labs && (
                          <div className="rounded-md border border-sky-500/20 bg-sky-500/[0.04] p-2.5">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 font-semibold text-sky-800 dark:text-sky-300">
                                <Icon icon={faFlaskVial} className="size-3" />
                                Lab Findings
                              </span>
                              {onCopyPastFindings && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopy(
                                      `find-labs-${rec.consultationId}`,
                                      rec.investigationResults.labs!,
                                      () => onCopyPastFindings("labs", rec.investigationResults.labs!)
                                    )
                                  }
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-700 hover:underline"
                                >
                                  <Icon
                                    icon={copiedKey === `find-labs-${rec.consultationId}` ? faCheck : faCopy}
                                    className="size-2.5"
                                  />
                                  {copiedKey === `find-labs-${rec.consultationId}` ? "Copied" : "Copy to current visit"}
                                </button>
                              )}
                            </div>
                            <p className="mt-1 whitespace-pre-wrap text-ink">
                              {rec.investigationResults.labs}
                            </p>
                          </div>
                        )}

                        {rec.investigationResults.imaging && (
                          <div className="rounded-md border border-violet-500/20 bg-violet-500/[0.04] p-2.5">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 font-semibold text-violet-800 dark:text-violet-300">
                                <Icon icon={faXRay} className="size-3" />
                                Imaging Findings
                              </span>
                              {onCopyPastFindings && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopy(
                                      `find-img-${rec.consultationId}`,
                                      rec.investigationResults.imaging!,
                                      () => onCopyPastFindings("imaging", rec.investigationResults.imaging!)
                                    )
                                  }
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-violet-700 hover:underline"
                                >
                                  <Icon
                                    icon={copiedKey === `find-img-${rec.consultationId}` ? faCheck : faCopy}
                                    className="size-2.5"
                                  />
                                  {copiedKey === `find-img-${rec.consultationId}` ? "Copied" : "Copy to current visit"}
                                </button>
                              )}
                            </div>
                            <p className="mt-1 whitespace-pre-wrap text-ink">
                              {rec.investigationResults.imaging}
                            </p>
                          </div>
                        )}

                        {rec.investigationResults.other && (
                          <div className="rounded-md border border-teal-500/20 bg-teal-500/[0.04] p-2.5">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 font-semibold text-teal-800 dark:text-teal-300">
                                <Icon icon={faFileWaveform} className="size-3" />
                                Other Investigations
                              </span>
                              {onCopyPastFindings && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopy(
                                      `find-oth-${rec.consultationId}`,
                                      rec.investigationResults.other!,
                                      () => onCopyPastFindings("other", rec.investigationResults.other!)
                                    )
                                  }
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 hover:underline"
                                >
                                  <Icon
                                    icon={copiedKey === `find-oth-${rec.consultationId}` ? faCheck : faCopy}
                                    className="size-2.5"
                                  />
                                  {copiedKey === `find-oth-${rec.consultationId}` ? "Copied" : "Copy to current visit"}
                                </button>
                              )}
                            </div>
                            <p className="mt-1 whitespace-pre-wrap text-ink">
                              {rec.investigationResults.other}
                            </p>
                          </div>
                        )}

                        {rec.advice && (
                          <div className="rounded-md border border-border/70 bg-muted/20 p-2.5">
                            <span className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                              <Icon icon={faNotesMedical} className="size-3" />
                              Past Advice / Advised Tests
                            </span>
                            <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                              {rec.advice}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

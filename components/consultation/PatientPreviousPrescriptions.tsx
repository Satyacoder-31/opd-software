"use client";

import { useState } from "react";
import {
  faClockRotateLeft,
  faChevronDown,
  faChevronUp,
  faPlus,
  faRotateRight,
  faCheck,
  faNotesMedical,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { PatientPrescriptionHistoryItem } from "@/actions/prescriptions";
import type { Medicine } from "@/lib/types";
import { cn } from "@/lib/utils";

type PatientPreviousPrescriptionsProps = {
  prescriptions: PatientPrescriptionHistoryItem[];
  loading?: boolean;
  onRepeatPrescription: (
    item: PatientPrescriptionHistoryItem,
    mode: "replace" | "append"
  ) => void;
  onRepeatMedicine: (medicine: Medicine) => void;
  onCopyAdvice?: (advice: string, followUp: string) => void;
};

export function PatientPreviousPrescriptions({
  prescriptions,
  loading = false,
  onRepeatPrescription,
  onRepeatMedicine,
  onCopyAdvice,
}: PatientPreviousPrescriptionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(
    prescriptions[0]?.id ?? null
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center gap-2 border-b border-border bg-surface-muted/30 px-3 py-2 text-xs text-muted-foreground md:px-4">
        <Icon icon={faClockRotateLeft} className="size-3 animate-spin text-primary" />
        <span>Loading past prescriptions…</span>
      </div>
    );
  }

  if (prescriptions.length === 0) {
    return null;
  }

  function handleRepeat(
    item: PatientPrescriptionHistoryItem,
    mode: "replace" | "append"
  ) {
    onRepeatPrescription(item, mode);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  }

  return (
    <section
      aria-label="Patient prescription history"
      className="border-b border-border bg-primary/[0.03] transition-colors"
    >
      {/* Summary Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 md:px-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
            aria-hidden
          >
            <Icon icon={faClockRotateLeft} className="size-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ink sm:text-sm">
                Patient Prescription History
              </h4>
              <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                {prescriptions.length} {prescriptions.length === 1 ? "visit" : "visits"}
              </span>
            </div>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Repeat previous regimens or select specific medicines to adjust dosages.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Repeat most recent button if collapsed */}
          {!isOpen && prescriptions[0] && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleRepeat(prescriptions[0], "replace")}
              className="h-8 gap-1.5 text-xs"
              title="Repeat the most recent prescription and adjust dosages"
            >
              <Icon icon={faRotateRight} className="size-3" />
              Repeat latest Rx
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen((prev) => !prev)}
            className="h-8 gap-1.5 px-2.5 text-xs font-medium text-ink"
            aria-expanded={isOpen}
          >
            <span>{isOpen ? "Hide history" : "View all past Rx"}</span>
            <Icon icon={isOpen ? faChevronUp : faChevronDown} className="size-3 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Expanded Accordion of Past Visits */}
      {isOpen && (
        <div className="border-t border-border/70 bg-card px-3 py-3 md:px-4 space-y-3">
          {copiedId && (
            <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-800 dark:text-emerald-300">
              <Icon icon={faCheck} className="size-3.5" />
              <span>
                Prescription loaded into active draft! You can now edit dosages, frequency, and instructions below.
              </span>
            </div>
          )}

          <div className="space-y-2.5">
            {prescriptions.map((item, index) => {
              const isExpanded = expandedId === item.id;
              const formattedDate = new Date(item.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });

              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-lg border border-border bg-card transition-all",
                    isExpanded ? "ring-1 ring-primary/20 shadow-xs" : "hover:border-primary/40"
                  )}
                >
                  {/* Visit Summary Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="flex flex-1 items-center gap-2 text-left focus-visible:outline-none"
                    >
                      <Icon
                        icon={isExpanded ? faChevronUp : faChevronDown}
                        className="size-3 text-muted-foreground"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-ink">
                            {formattedDate}
                          </span>
                          {index === 0 && (
                            <span className="rounded-sm bg-primary/10 px-1.5 py-0.2 text-[11px] font-semibold text-primary">
                              Latest visit
                            </span>
                          )}
                          {item.tokenNumber && (
                            <span className="text-xs text-muted-foreground">
                              (Token #{item.tokenNumber})
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            · Dr. {item.doctorName}
                          </span>
                        </div>
                        {item.diagnosis && (
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                            Diagnosis: <span className="font-medium text-ink">{item.diagnosis}</span>
                          </p>
                        )}
                      </div>
                    </button>

                    {/* Action buttons for entire visit */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRepeat(item, "replace")}
                        className="h-8 gap-1.5 text-xs font-medium"
                        title="Replace current draft with this prescription (allows dosage edits)"
                      >
                        <Icon icon={faRotateRight} className="size-3 text-primary" />
                        <span>Repeat Rx</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRepeat(item, "append")}
                        className="h-8 gap-1 text-xs text-muted-foreground hover:text-ink"
                        title="Add these medicines to current draft"
                      >
                        <Icon icon={faPlus} className="size-3" />
                        <span>Append</span>
                      </Button>
                    </div>
                  </div>

                  {/* Medicines List in This Past Visit */}
                  {isExpanded && (
                    <div className="border-t border-border/60 bg-muted/20 px-3 py-2.5 sm:px-4">
                      <h5 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Prescribed Medicines ({item.medicines.length}):
                      </h5>

                      <ul className="space-y-1.5">
                        {item.medicines.map((med, mIdx) => (
                          <li
                            key={mIdx}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/50 bg-card p-2 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline gap-1.5">
                                <span className="font-semibold text-ink">
                                  {med.name}
                                </span>
                                {med.dosage && (
                                  <span className="rounded-sm bg-primary/10 px-1.5 py-0.2 font-medium text-primary">
                                    {med.dosage}
                                  </span>
                                )}
                                {med.route && (
                                  <span className="text-muted-foreground">
                                    ({med.route})
                                  </span>
                                )}
                              </div>
                              <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
                                {med.frequency && <span>Freq: {med.frequency}</span>}
                                {med.duration && <span>· Duration: {med.duration}</span>}
                                {med.instructions && (
                                  <span className="italic">· {med.instructions}</span>
                                )}
                              </div>
                            </div>

                            {/* Button to repeat just this individual medicine */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                onRepeatMedicine(med);
                                setCopiedId(item.id);
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                              className="h-7 shrink-0 gap-1 px-2 text-[11px] text-primary hover:bg-primary/10"
                              title={`Repeat ${med.name} into current draft with this dosage`}
                            >
                              <Icon icon={faPlus} className="size-2.5" />
                              <span>Repeat dose</span>
                            </Button>
                          </li>
                        ))}
                      </ul>

                      {/* Clinical Advice & Follow Up if available */}
                      {(item.advice || item.followUp) && (
                        <div className="mt-2.5 rounded-md border border-border/40 bg-card/60 p-2 text-xs text-muted-foreground">
                          {item.advice && (
                            <p className="line-clamp-2">
                              <span className="font-medium text-ink">Advice:</span> {item.advice}
                            </p>
                          )}
                          {item.followUp && (
                            <p className="mt-1">
                              <span className="font-medium text-ink">Follow-up:</span> {item.followUp}
                            </p>
                          )}
                          {onCopyAdvice && item.advice && (
                            <button
                              type="button"
                              onClick={() => onCopyAdvice(item.advice ?? "", item.followUp ?? "")}
                              className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                            >
                              <Icon icon={faNotesMedical} className="size-2.5" />
                              Copy advice & follow-up to draft
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

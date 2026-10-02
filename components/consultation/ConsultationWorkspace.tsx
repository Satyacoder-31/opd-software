"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  faCheckCircle,
  faCircleExclamation,
  faCloudArrowUp,
  faFileLines,
  faFlaskVial,
  faPaperclip,
  faPills,
  faStethoscope,
} from "@fortawesome/free-solid-svg-icons";
import { completeVisit, saveVisitDraft } from "@/actions/consultations";
import {
  ConsultationClinicalSections,
  InvestigationSections,
  MedicalCertificateSections,
} from "@/components/consultation/ClinicalSections";
import { ConsultationAttachments } from "@/components/consultation/ConsultationAttachments";
import { PatientContextRail } from "@/components/consultation/PatientContextRail";
import {
  emptyMedicine,
  PrescriptionBuilder,
} from "@/components/consultation/PrescriptionBuilder";
import { PatientSafetyBanner } from "@/components/patients/PatientSafetyBanner";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { Icon } from "@/components/ui/Icon";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { firstFieldError } from "@/lib/form-utils";
import {
  isCompleteVisitShortcut,
  isSaveDraftShortcut,
  isWorkspaceTabId,
  WORKSPACE_TABS,
  workspaceShortcutTab,
  type WorkspaceTabId,
} from "@/lib/consultation-workspace";
import { hasPatientSafetyAlerts } from "@/lib/consultation-utils";
import type { ConsultationClinicalData, Medicine } from "@/lib/types";
import { usePendingAction } from "@/hooks/usePendingAction";
import {
  LabOrdersPanel,
  type LabOrdersPanelHandle,
} from "@/components/consultation/LabOrdersPanel";
import { ReferralSections } from "@/components/consultation/ReferralSections";
import {
  getPatientInvestigationHistory,
  type PatientInvestigationHistory,
} from "@/actions/labs";
import { PatientPreviousInvestigations } from "@/components/consultation/PatientPreviousInvestigations";

const AUTOSAVE_MS = 3000;

type ConsultationWorkspaceProps = {
  consultationId: string;
  patientId: string;
  patientName: string;
  uhid: string;
  episodeNo: string;
  patientPhone?: string | null;
  patientAge?: string | null;
  patientGender?: string | null;
  doctorName: string;
  clinical: ConsultationClinicalData;
  medicines: Medicine[];
  advice?: string | null;
  followUp?: string | null;
  patientAllergies?: string | null;
  patientChronicConditions?: string | null;
};

export function ConsultationWorkspace({
  consultationId,
  patientId,
  patientName,
  uhid,
  episodeNo,
  patientPhone,
  patientAge,
  patientGender,
  doctorName,
  clinical: initialClinical,
  medicines: initialMedicines,
  advice: initialAdvice,
  followUp: initialFollowUp,
  patientAllergies,
  patientChronicConditions,
}: ConsultationWorkspaceProps) {
  const router = useRouter();
  const [tab, setTab] = useState<WorkspaceTabId>("consultation");
  const [clinical, setClinical] =
    useState<ConsultationClinicalData>(initialClinical);
  const [medicines, setMedicines] = useState<Medicine[]>(
    initialMedicines.length > 0 ? initialMedicines : [emptyMedicine()],
  );
  const [advice, setAdvice] = useState(initialAdvice ?? "");
  const [followUp, setFollowUp] = useState(initialFollowUp ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );
  const [autosaveStatus, setAutosaveStatus] = useState<
    "idle" | "saving" | "saved" | "offline"
  >("idle");
  const { isPending, run } = usePendingAction<"save" | "complete">();
  const autosaveInFlight = useRef(false);
  const isDirty = useRef(false);
  const skipDirtyMark = useRef(true);

  // Patient previous investigations & lab results
  const [investigationHistory, setInvestigationHistory] =
    useState<PatientInvestigationHistory>({
      labResults: [],
      advisedInvestigations: [],
      previousConsultationInvestigations: [],
    });
  const [investigationHistoryLoading, setInvestigationHistoryLoading] =
    useState(false);
  const labOrdersPanelRef = useRef<LabOrdersPanelHandle>(null);

  useEffect(() => {
    if (!patientId) return;
    let active = true;
    setInvestigationHistoryLoading(true);
    void getPatientInvestigationHistory(patientId, consultationId)
      .then((data) => {
        if (active && data) {
          setInvestigationHistory(data);
        }
      })
      .finally(() => {
        if (active) setInvestigationHistoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [patientId, consultationId]);

  const handleCopyLabResult = useCallback((text: string) => {
    setClinical((prev) => {
      const existing = prev.investigationResults?.labs?.trim() ?? "";
      const next = existing ? `${existing}\n• ${text}` : `• ${text}`;
      return {
        ...prev,
        investigationResults: {
          ...prev.investigationResults,
          labs: next,
        },
      };
    });
    setMessage("Copied lab result into consultation notes.");
    setMessageType("success");
  }, []);

  const handleCopyPastFindings = useCallback(
    (field: "labs" | "imaging" | "other", text: string) => {
      setClinical((prev) => {
        const existing = prev.investigationResults?.[field]?.trim() ?? "";
        const next = existing ? `${existing}\n${text}` : text;
        return {
          ...prev,
          investigationResults: {
            ...prev.investigationResults,
            [field]: next,
          },
        };
      });
      setMessage(`Copied previous ${field} findings into consultation notes.`);
      setMessageType("success");
    },
    []
  );

  const handleAppendAdvisedToRxAdvice = useCallback((testsSummary: string) => {
    setAdvice((prev) => {
      const prefix = "Advised Investigations:\n";
      const existing = prev?.trim() ?? "";
      if (existing.includes("Advised Investigations:")) {
        return `${existing}\n${testsSummary}`;
      }
      return existing
        ? `${existing}\n\n${prefix}${testsSummary}`
        : `${prefix}${testsSummary}`;
    });
    setMessage("Appended advised investigations to prescription advice.");
    setMessageType("success");
  }, []);

  const handleReorderTests = useCallback((testIds: string[]) => {
    labOrdersPanelRef.current?.addTests(testIds);
  }, []);

  const draftPayload = useCallback(
    () => ({
      clinical,
      medicines,
      advice,
      followUp,
    }),
    [clinical, medicines, advice, followUp],
  );

  const saveDraftRef = useRef<() => void>(() => {});
  const completeVisitRef = useRef<() => void>(() => {});
  const pendingRef = useRef(isPending);
  pendingRef.current = isPending;

  const autosaveDraft = useCallback(async () => {
    if (!isDirty.current) return;
    if (autosaveInFlight.current) return;
    if (!navigator.onLine) {
      setAutosaveStatus("offline");
      return;
    }

    autosaveInFlight.current = true;
    setAutosaveStatus("saving");
    try {
      const result = await saveVisitDraft(consultationId, draftPayload());
      if (result.success) {
        isDirty.current = false;
        setAutosaveStatus("saved");
      } else {
        setAutosaveStatus("idle");
      }
    } catch {
      setAutosaveStatus("idle");
    } finally {
      autosaveInFlight.current = false;
    }
  }, [consultationId, draftPayload]);

  useEffect(() => {
    if (skipDirtyMark.current) {
      skipDirtyMark.current = false;
      return;
    }
    isDirty.current = true;
    setAutosaveStatus("idle");
    const timer = window.setTimeout(() => {
      void autosaveDraft();
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [clinical, medicines, advice, followUp, autosaveDraft]);

  useEffect(() => {
    function handleOnline() {
      if (isDirty.current) void autosaveDraft();
      else setAutosaveStatus((prev) => (prev === "offline" ? "idle" : prev));
    }
    function handleOffline() {
      setAutosaveStatus("offline");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [autosaveDraft]);

  function handleSaveDraft() {
    setMessage(null);
    void run(async () => {
      const result = await saveVisitDraft(consultationId, draftPayload());
      setMessageType(result.success ? "success" : "error");
      if (result.success) {
        isDirty.current = false;
        setAutosaveStatus("saved");
        setMessage("Draft saved");
      } else {
        setMessage(
          result.fieldErrors
            ? (firstFieldError(result.fieldErrors) ?? result.error)
            : result.error,
        );
      }
    }, "save");
  }

  function handleCompleteVisit() {
    setMessage(null);
    void run(async () => {
      const result = await completeVisit(consultationId, draftPayload());
      if (result.success) {
        isDirty.current = false;
        setAutosaveStatus("idle");
        router.refresh();
        return;
      }
      setMessageType("error");
      setMessage(
        result.fieldErrors
          ? (firstFieldError(result.fieldErrors) ?? result.error)
          : result.error,
      );
    }, "complete");
  }

  saveDraftRef.current = handleSaveDraft;
  completeVisitRef.current = handleCompleteVisit;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const shortcutEvent = {
        key: event.key,
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
      };

      const nextTab = workspaceShortcutTab(shortcutEvent);
      if (nextTab) {
        event.preventDefault();
        setTab(nextTab);
        return;
      }

      if (isSaveDraftShortcut(shortcutEvent)) {
        event.preventDefault();
        if (!pendingRef.current()) saveDraftRef.current();
        return;
      }

      if (isCompleteVisitShortcut(shortcutEvent)) {
        if (event.target instanceof HTMLElement) {
          const inMenu = event.target.closest(
            '[role="listbox"], [role="menu"]',
          );
          if (inMenu) return;
        }
        event.preventDefault();
        if (!pendingRef.current()) completeVisitRef.current();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const autosaveLabel =
    autosaveStatus === "saving"
      ? "Saving…"
      : autosaveStatus === "saved"
        ? "Saved"
        : autosaveStatus === "offline"
          ? "Offline"
          : null;

  return (
    <PageShell className="min-h-0">
      {/* Patient Header — gradient card */}
      <div className="border-b border-border bg-gradient-to-b from-card to-muted/20">
        <PageHeader
          className="pb-3 md:pb-3"
          title={patientName}
          backHref="/queue"
          backLabel="Queue"
          backAccessory={
            autosaveLabel ? (
              <span
                role="status"
                className={
                  autosaveStatus === "saved"
                    ? "inline-flex items-center gap-1.5 shrink-0 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700"
                    : autosaveStatus === "saving"
                      ? "inline-flex items-center gap-1.5 shrink-0 text-xs font-medium text-muted-foreground"
                      : "inline-flex items-center gap-1.5 shrink-0 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700"
                }
              >
                <Icon
                  icon={
                    autosaveStatus === "saved"
                      ? faCheckCircle
                      : autosaveStatus === "saving"
                        ? faCloudArrowUp
                        : faCircleExclamation
                  }
                  className="size-3"
                />
                {autosaveLabel}
              </span>
            ) : null
          }
        />
        <PatientContextRail
          className="px-6 pb-5 md:px-8"
          hideName
          patientName={patientName}
          uhid={uhid}
          episodeNo={episodeNo}
          patientPhone={patientPhone}
          patientAge={patientAge}
          patientGender={patientGender}
          doctorName={doctorName}
          patientHref={`/patients/${patientId}`}
          labResultsCount={investigationHistory.labResults.length}
          onViewInvestigations={() => setTab("investigations")}
        />
      </div>

      {message ? (
        <div className="px-4 pb-2 md:px-6">
          <Banner variant={messageType === "error" ? "error" : "info"}>
            {message}
          </Banner>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 border-b border-border bg-card">
        <Tabs
          value={tab}
          onValueChange={(value) => {
            if (isWorkspaceTabId(value)) setTab(value);
          }}
          className="gap-0"
        >
          {/* Sticky tab bar */}
          <div className="sticky top-0 z-10 overflow-x-auto border-b border-border bg-card/95 px-2 py-2 backdrop-blur scrollbar-hide md:px-3">
            <TabsList
              variant="line"
              className="h-auto w-max min-w-full justify-start gap-0.5"
            >
              {([
                { id: "consultation", label: "Consultation", icon: faStethoscope, color: "text-blue-600" },
                { id: "prescription", label: "Prescription", icon: faPills, color: "text-violet-600" },
                { id: "investigations", label: "Investigations", icon: faFlaskVial, color: "text-sky-600" },
                { id: "documents", label: "Documents", icon: faFileLines, color: "text-orange-600" },
              ] as const).map((item) => {
                const totalInvCount =
                  investigationHistory.labResults.length +
                  investigationHistory.advisedInvestigations.length;

                return (
                  <TabsTrigger
                    key={item.id}
                    value={item.id}
                    className="min-h-10 flex-none shrink-0 px-3 gap-1.5"
                    title={item.label}
                  >
                    <Icon
                      icon={item.icon}
                      className={`size-3.5 ${tab === item.id ? item.color : "text-muted-foreground"}`}
                    />
                    {item.label}
                    {item.id === "investigations" && totalInvCount > 0 && (
                      <span className="ml-1 inline-flex items-center rounded-full bg-sky-500/15 px-1.5 py-0.2 text-[10px] font-bold text-sky-700 dark:text-sky-300">
                        {totalInvCount}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <TabsContent value="consultation" className="mt-0">
            {hasPatientSafetyAlerts({
              allergies: patientAllergies,
              chronicConditions: patientChronicConditions,
            }) ? (
              <div className="border-b border-border/70 bg-rose-50/50 px-3 py-3 md:px-4">
                <PatientSafetyBanner
                  allergies={patientAllergies}
                  chronicConditions={patientChronicConditions}
                />
              </div>
            ) : null}

            {investigationHistory.labResults.length > 0 ||
            investigationHistory.advisedInvestigations.length > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 bg-sky-500/10 px-3 py-2 text-xs text-sky-950 dark:text-sky-200 md:px-4">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon icon={faFlaskVial} className="size-3.5 shrink-0 text-sky-600" />
                  <span className="truncate">
                    <strong>Previous records:</strong> {investigationHistory.labResults.length} past lab {investigationHistory.labResults.length === 1 ? "result" : "results"}, {investigationHistory.advisedInvestigations.length} advised investigation {investigationHistory.advisedInvestigations.length === 1 ? "order" : "orders"} on file.
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setTab("investigations")}
                  className="h-7 text-xs font-semibold text-sky-700 hover:text-sky-800 dark:text-sky-300 shrink-0"
                >
                  View investigations ➔
                </Button>
              </div>
            ) : null}

            <ConsultationClinicalSections
              value={clinical}
              onChange={setClinical}
            />
          </TabsContent>

          <TabsContent value="prescription" className="mt-0">
            <PrescriptionBuilder
              consultationId={consultationId}
              patientId={patientId}
              medicines={medicines}
              advice={advice}
              followUp={followUp}
              onMedicinesChange={setMedicines}
              onAdviceChange={setAdvice}
              onFollowUpChange={setFollowUp}
              patientAllergies={patientAllergies}
              hideSaveActions
              saveTemplateInFooter={tab === "prescription"}
            />
          </TabsContent>

          <TabsContent value="investigations" className="mt-0">
            <PatientPreviousInvestigations
              history={investigationHistory}
              loading={investigationHistoryLoading}
              onCopyLabResult={handleCopyLabResult}
              onCopyPastFindings={handleCopyPastFindings}
              onReorderTests={handleReorderTests}
            />
            <LabOrdersPanel
              ref={labOrdersPanelRef}
              consultationId={consultationId}
              onAppendToRxAdvice={handleAppendAdvisedToRxAdvice}
            />
            <InvestigationSections
              value={clinical}
              onChange={setClinical}
              previousLabsNote={investigationHistory.previousConsultationInvestigations[0]?.investigationResults?.labs}
              previousImagingNote={investigationHistory.previousConsultationInvestigations[0]?.investigationResults?.imaging}
              previousOtherNote={investigationHistory.previousConsultationInvestigations[0]?.investigationResults?.other}
            />
          </TabsContent>

          <TabsContent value="documents" className="mt-0">
            <ReferralSections
              consultationId={consultationId}
              value={clinical}
              onChange={setClinical}
            />
            <MedicalCertificateSections
              value={clinical}
              onChange={setClinical}
            />
            <CollapsibleSection
              flush
              density="compact"
              contentClassName="px-3 py-3 md:px-4"
              title="Attachments"
              icon={faPaperclip}
              iconColor="bg-slate-500/15 text-slate-600"
            >
              <ConsultationAttachments consultationId={consultationId} />
            </CollapsibleSection>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sticky footer actions */}
      <div className="sticky bottom-0 z-10 border-t border-border bg-card/95 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 md:px-4">
          <div className="hidden text-xs text-muted-foreground sm:block">
            <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px]">Ctrl+S</kbd>{" "}
            Save draft &nbsp;·&nbsp;{" "}
            <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px]">Ctrl+↵</kbd>{" "}
            Complete visit
          </div>
          <div className="flex flex-wrap gap-2 ml-auto">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="min-h-10 gap-1.5"
              onClick={handleSaveDraft}
              loading={isPending("save")}
            >
              <Icon icon={faCloudArrowUp} className="size-3.5" />
              Save draft
            </Button>
            <Button
              type="button"
              size="sm"
              className="min-h-10 gap-1.5 bg-gradient-to-r from-primary to-primary/80 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-shadow"
              onClick={handleCompleteVisit}
              loading={isPending("complete")}
            >
              <Icon icon={faCheckCircle} className="size-3.5" />
              Complete visit
            </Button>
          </div>
        </div>
        <div id="prescription-save-template-host" />
      </div>
    </PageShell>
  );
}

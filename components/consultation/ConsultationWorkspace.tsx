"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  faBolt,
  faBone,
  faCheckCircle,
  faCircleExclamation,
  faCloudArrowUp,
  faFileLines,
  faFlaskVial,
  faPaperclip,
  faPills,
  faPlus,
  faRotate,
  faStethoscope,
} from "@fortawesome/free-solid-svg-icons";
import { completeVisit, saveVisitDraft } from "@/actions/consultations";
import { DoctorFastConsultation } from "@/components/consultation/DoctorFastConsultation";
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
import type {
  ClinicalTreatmentMode,
  ConsultationClinicalData,
  Medicine,
  PreviousVisitData,
} from "@/lib/types";
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
  previousVisit?: PreviousVisitData | null;
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
  previousVisit,
}: ConsultationWorkspaceProps) {
  const router = useRouter();
  const [tab, setTab] = useState<WorkspaceTabId>("consultation");
  const [workspaceViewMode, setWorkspaceViewMode] = useState<"fast" | "hospital">("fast");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("drorthos.workspace.viewMode");
      if (saved === "hospital" || saved === "fast") {
        setWorkspaceViewMode(saved);
      }
    } catch {
      // Storage unavailable in private browsing
    }
  }, []);

  const handleToggleViewMode = useCallback((mode: "fast" | "hospital") => {
    setWorkspaceViewMode(mode);
    try {
      window.localStorage.setItem("drorthos.workspace.viewMode", mode);
    } catch {
      // Storage unavailable in private browsing
    }
  }, []);

  const isFreshConsultation =
    (!initialClinical.diagnosis?.trim() || initialClinical.diagnosis === "null") &&
    (!initialClinical.chiefComplaint?.trim() || initialClinical.chiefComplaint === "null") &&
    (initialMedicines.length === 0 ||
      (initialMedicines.length === 1 && !initialMedicines[0]?.name?.trim()));

  const resolvedInitialAdvice =
    isFreshConsultation && previousVisit?.advice
      ? previousVisit.advice
      : (initialAdvice ?? initialClinical.advice ?? "");

  const [clinical, setClinical] = useState<ConsultationClinicalData>(() => {
    if (isFreshConsultation && previousVisit) {
      return {
        ...initialClinical,
        chiefComplaint: previousVisit.chiefComplaint || initialClinical.chiefComplaint || "",
        diagnosis: previousVisit.diagnosis || initialClinical.diagnosis || "",
        diagnosisCodes: (previousVisit.diagnosisCodes && previousVisit.diagnosisCodes.length > 0)
          ? previousVisit.diagnosisCodes
          : initialClinical.diagnosisCodes || [],
        examination: previousVisit.examination || initialClinical.examination,
        treatmentPlan: previousVisit.treatmentPlan || initialClinical.treatmentPlan,
        clinicalPresentation:
          previousVisit.clinicalPresentation || initialClinical.clinicalPresentation,
        patientHistory: previousVisit.patientHistory || initialClinical.patientHistory,
        investigationResults:
          previousVisit.investigationResults || initialClinical.investigationResults,
        notes: previousVisit.notes || initialClinical.notes || "",
        advice: resolvedInitialAdvice,
      };
    }
    return {
      ...initialClinical,
      advice: resolvedInitialAdvice,
    };
  });

  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    if (
      isFreshConsultation &&
      previousVisit?.medicines &&
      previousVisit.medicines.length > 0
    ) {
      return previousVisit.medicines;
    }
    return initialMedicines.length > 0 ? initialMedicines : [emptyMedicine()];
  });

  const [advice, setAdvice] = useState(resolvedInitialAdvice);
  const [followUp, setFollowUp] = useState<string>(() => {
    if (isFreshConsultation && previousVisit?.followUp) {
      return previousVisit.followUp;
    }
    return initialFollowUp ?? "";
  });

  const [visitMode, setVisitMode] = useState<"same_problem" | "new_problem">(
    previousVisit ? "same_problem" : "new_problem"
  );

  const [treatmentMode, setTreatmentMode] = useState<ClinicalTreatmentMode>(
    clinical.treatmentMode || previousVisit?.treatmentMode || "orthopedics"
  );

  const handleTreatmentModeChange = useCallback(
    (mode: ClinicalTreatmentMode) => {
      setTreatmentMode(mode);
      isDirty.current = true;
      setClinical((prev) => ({ ...prev, treatmentMode: mode }));
    },
    []
  );

  const handleSelectSameProblem = useCallback(() => {
    if (!previousVisit) return;
    setVisitMode("same_problem");
    isDirty.current = true;
    const nextClinical: ConsultationClinicalData = {
      ...clinical,
      chiefComplaint: previousVisit.chiefComplaint || clinical.chiefComplaint || "",
      diagnosis: previousVisit.diagnosis || clinical.diagnosis || "",
      diagnosisCodes: (previousVisit.diagnosisCodes && previousVisit.diagnosisCodes.length > 0)
        ? previousVisit.diagnosisCodes
        : clinical.diagnosisCodes || [],
      examination: previousVisit.examination || clinical.examination,
      treatmentPlan: previousVisit.treatmentPlan || clinical.treatmentPlan,
      clinicalPresentation:
        previousVisit.clinicalPresentation || clinical.clinicalPresentation,
      patientHistory: previousVisit.patientHistory || clinical.patientHistory,
      investigationResults:
        previousVisit.investigationResults || clinical.investigationResults,
      notes: previousVisit.notes || clinical.notes || "",
      advice: previousVisit.advice || advice || clinical.advice || "",
    };
    setClinical(nextClinical);
    if (previousVisit.advice) setAdvice(previousVisit.advice);
    if (previousVisit.followUp) setFollowUp(previousVisit.followUp);
    if (previousVisit.medicines && previousVisit.medicines.length > 0) {
      setMedicines(previousVisit.medicines);
    }
    setMessage(
      `Option 1 applied: Pre-filled complaints, diagnosis, exam, advice & ${previousVisit.medicines?.length || 0} medicines from previous visit.`
    );
    setMessageType("success");
  }, [previousVisit, clinical, advice]);

  const handleSelectNewProblem = useCallback(() => {
    setVisitMode("new_problem");
    isDirty.current = true;
    setClinical((prev) => ({
      ...prev,
      chiefComplaint: "",
      diagnosis: "",
      diagnosisCodes: [],
      examination: undefined,
      treatmentPlan: undefined,
      clinicalPresentation: undefined,
      notes: "",
      advice: "",
    }));
    setAdvice("");
    setFollowUp("");
    setMedicines([emptyMedicine()]);
    setMessage(
      "Option 2 applied: Cleared fields so you can input new details for a new problem."
    );
    setMessageType("success");
  }, []);

  const handleClinicalChange = useCallback((next: ConsultationClinicalData) => {
    setClinical(next);
    if (next.advice !== undefined) {
      setAdvice(next.advice);
    }
  }, []);

  const handleAdviceChange = useCallback((nextAdvice: string) => {
    setAdvice(nextAdvice);
    setClinical((prev) =>
      prev.advice === nextAdvice ? prev : { ...prev, advice: nextAdvice },
    );
  }, []);
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
        setMessage("Visit completed successfully! Loading summary...");
        setMessageType("success");
        window.location.assign(`/consultations/${consultationId}`);
        return new Promise(() => {}); // keep pending/spinner active until page unloads
      }
      setMessageType("error");
      const err = result.fieldErrors
        ? (firstFieldError(result.fieldErrors) ?? result.error)
        : result.error;
      setMessage(err);
      if (
        err?.toLowerCase().includes("medicine") ||
        err?.toLowerCase().includes("prescription")
      ) {
        setTab("prescription");
      }
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
        {/* VIEW MODE SELECTOR (FAST OPD VS DETAILED HOSPITAL) */}
        <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-white/95 px-3 py-2 backdrop-blur md:px-4 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Consultation Mode:
            </span>
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => handleToggleViewMode("fast")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  workspaceViewMode === "fast"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                }`}
                title="Doctor Fast Track: Everything on 1 clean, fast screen with 1-click super templates and dosing chips"
              >
                <Icon icon={faBolt} className="size-3 text-amber-300" />
                <span>⚡ Doctor Fast OPD (1-Screen)</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleViewMode("hospital")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  workspaceViewMode === "hospital"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold border border-slate-200 dark:border-slate-700"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                }`}
                title="Full Hospital Mode: Multi-tab layout for complex surgery planning, systemic exams, and certificates"
              >
                <Icon icon={faFileLines} className="size-3 text-slate-500" />
                <span>📑 Full Hospital Tabs</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="min-h-8 text-xs gap-1.5"
              onClick={handleSaveDraft}
              loading={isPending("save")}
              disabled={isPending("complete")}
            >
              <Icon icon={faCloudArrowUp} className="size-3" />
              Save draft
            </Button>
            <Button
              type="button"
              size="sm"
              className="min-h-8 text-xs gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-xs hover:from-emerald-700 hover:to-teal-700 cursor-pointer"
              onClick={handleCompleteVisit}
              loading={isPending("complete")}
              disabled={isPending("complete")}
            >
              <Icon icon={faCheckCircle} className="size-3" />
              {isPending("complete") ? "Completing..." : "Complete & Print Rx"}
            </Button>
          </div>
        </div>

        {workspaceViewMode === "fast" ? (
          <DoctorFastConsultation
            consultationId={consultationId}
            patientId={patientId}
            patientName={patientName}
            uhid={uhid}
            episodeNo={episodeNo}
            clinical={clinical}
            medicines={medicines}
            advice={advice}
            followUp={followUp}
            treatmentMode={treatmentMode}
            onClinicalChange={handleClinicalChange}
            onMedicinesChange={setMedicines}
            onAdviceChange={handleAdviceChange}
            onFollowUpChange={setFollowUp}
            onTreatmentModeChange={handleTreatmentModeChange}
            onCompleteVisit={handleCompleteVisit}
            onSaveDraft={handleSaveDraft}
            isSaving={isPending("save")}
            isCompleting={isPending("complete")}
            onViewInvestigations={() => {
              handleToggleViewMode("hospital");
              setTab("investigations");
            }}
            onViewDocuments={() => {
              handleToggleViewMode("hospital");
              setTab("documents");
            }}
            previousVisit={previousVisit}
            investigationHistoryCount={
              investigationHistory.labResults.length +
              investigationHistory.advisedInvestigations.length
            }
          />
        ) : (
        <Tabs
          value={tab}
          onValueChange={(value) => {
            if (isWorkspaceTabId(value)) setTab(value);
          }}
          className="gap-0"
        >
          {/* Sticky tab bar with treatment mode selector */}
          <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card/95 px-2 py-2 backdrop-blur scrollbar-hide md:px-3">
            <TabsList
              variant="line"
              className="h-auto w-max shrink-0 justify-start gap-0.5"
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

            {/* Specialty Mode Selector in Sticky Bar */}
            <div className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-muted/60 p-1 shrink-0 ml-auto">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1 hidden sm:inline">
                Specialty:
              </span>
              <button
                type="button"
                onClick={() => handleTreatmentModeChange("orthopedics")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  treatmentMode === "orthopedics"
                    ? "bg-primary text-primary-foreground shadow-xs ring-1 ring-primary/40"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Orthopedic Mode: Show orthopedic complaints, symptoms, joint exams & advice"
              >
                <Icon icon={faBone} className="size-3" />
                Orthopedics
              </button>
              <button
                type="button"
                onClick={() => handleTreatmentModeChange("general")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  treatmentMode === "general"
                    ? "bg-primary text-primary-foreground shadow-xs ring-1 ring-primary/40"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="General Treatment Mode: Show general medicine, fever, viral, cough & GI complaints"
              >
                <Icon icon={faStethoscope} className="size-3" />
                General Treatment
              </button>
              <button
                type="button"
                onClick={() => handleTreatmentModeChange("all")}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  treatmentMode === "all"
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Show all dropdown options"
              >
                All
              </button>
            </div>
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

            {previousVisit ? (
              <div className="border-b border-indigo-200/70 bg-gradient-to-r from-indigo-50/90 via-sky-50/50 to-indigo-50/60 p-3.5 dark:border-indigo-900/60 dark:from-indigo-950/40 dark:via-slate-900 dark:to-indigo-950/30 md:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                      <Icon icon={faRotate} className="size-3.5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                          Returning Patient Visit (फ़ॉलो-अप मरीज)
                        </span>
                        <span className="rounded-full border border-indigo-300/60 bg-white/80 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 shadow-2xs">
                          Previous Visit: {new Date(previousVisit.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Previous Diagnosis: <span className="font-semibold text-foreground">{previousVisit.diagnosis || "Under evaluation"}</span>
                        {previousVisit.chiefComplaint ? ` · Symptoms: ${previousVisit.chiefComplaint}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-[11px] font-medium text-muted-foreground">
                    Select visit option below:
                  </div>
                </div>

                {/* Option 1 vs Option 2 Selectable Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                  {/* Option 1: Same Problem (Details already filled) */}
                  <button
                    type="button"
                    onClick={handleSelectSameProblem}
                    className={`group relative flex flex-col text-left p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      visitMode === "same_problem"
                        ? "border-indigo-600 bg-white dark:bg-slate-900 shadow-sm ring-2 ring-indigo-500/20"
                        : "border-indigo-200/70 dark:border-indigo-900/40 bg-white/60 dark:bg-slate-900/40 hover:border-indigo-400"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-4 rounded-full flex items-center justify-center border transition-colors ${
                            visitMode === "same_problem"
                              ? "border-indigo-600 bg-indigo-600 text-white"
                              : "border-slate-300 group-hover:border-indigo-400"
                          }`}
                        >
                          {visitMode === "same_problem" && (
                            <span className="size-1.5 rounded-full bg-white" />
                          )}
                        </span>
                        <span className="text-xs font-bold text-foreground">
                          Option 1: Same Problem / Revisit (वही समस्या)
                        </span>
                      </div>
                      <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                        Details Pre-filled
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5 pl-6">
                      Pre-fills previous complaints, joint examination, diagnosis, advice, and medicines since patient is revisiting for the same condition.
                    </p>
                    {visitMode === "same_problem" && (
                      <div className="mt-2 pl-6 flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                        <Icon icon={faCheckCircle} className="size-3 text-indigo-600" />
                        <span>Active · Previous consultation records loaded</span>
                      </div>
                    )}
                  </button>

                  {/* Option 2: New Problem (Input new details) */}
                  <button
                    type="button"
                    onClick={handleSelectNewProblem}
                    className={`group relative flex flex-col text-left p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      visitMode === "new_problem"
                        ? "border-sky-600 bg-white dark:bg-slate-900 shadow-sm ring-2 ring-sky-500/20"
                        : "border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:border-sky-400"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-4 rounded-full flex items-center justify-center border transition-colors ${
                            visitMode === "new_problem"
                              ? "border-sky-600 bg-sky-600 text-white"
                              : "border-slate-300 group-hover:border-sky-400"
                          }`}
                        >
                          {visitMode === "new_problem" && (
                            <span className="size-1.5 rounded-full bg-white" />
                          )}
                        </span>
                        <span className="text-xs font-bold text-foreground">
                          Option 2: New Problem / Fresh Details (नई समस्या)
                        </span>
                      </div>
                      <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        Blank Slate
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5 pl-6">
                      Patient has presented with a new orthopedic complaint. Clears previous clinical details and medicines so new details can be entered.
                    </p>
                    {visitMode === "new_problem" && (
                      <div className="mt-2 pl-6 flex items-center gap-1.5 text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                        <Icon icon={faCheckCircle} className="size-3 text-sky-600" />
                        <span>Active · Ready for fresh examination & prescription</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            ) : null}

            <ConsultationClinicalSections
              value={clinical}
              onChange={handleClinicalChange}
              treatmentMode={treatmentMode}
              onTreatmentModeChange={handleTreatmentModeChange}
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
              onAdviceChange={handleAdviceChange}
              onFollowUpChange={setFollowUp}
              patientAllergies={patientAllergies}
              treatmentMode={treatmentMode}
              onTreatmentModeChange={handleTreatmentModeChange}
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
        )}
      </div>

      {/* Sticky footer actions */}
      <div className="sticky bottom-0 z-10 border-t border-border bg-card/95 backdrop-blur">
        {message && messageType === "error" && (
          <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive flex items-center justify-between gap-2 animate-in fade-in">
            <span>{message}</span>
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="text-destructive/80 hover:text-destructive font-bold text-sm"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}
        {message && messageType === "success" && (
          <div className="border-b border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-700 flex items-center gap-2 animate-in fade-in">
            <Icon icon={faCheckCircle} className="size-3.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}
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
              disabled={isPending("complete")}
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
              disabled={isPending("complete")}
            >
              <Icon icon={faCheckCircle} className="size-3.5" />
              {isPending("complete") ? "Completing visit..." : "Complete visit"}
            </Button>
          </div>
        </div>
        <div id="prescription-save-template-host" />
      </div>
    </PageShell>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import type { ConsultationClinicalData, Medicine } from "@/lib/types";
import { usePendingAction } from "@/hooks/usePendingAction";
import { LabOrdersPanel } from "@/components/consultation/LabOrdersPanel";
import { ReferralSections } from "@/components/consultation/ReferralSections";

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
      <div className="border-b border-border bg-card">
        <PageHeader
          className="pb-3 md:pb-3"
          title={
            <span className="flex w-full min-w-0 items-baseline justify-between gap-x-3">
              <span className="min-w-0 truncate">{patientName}</span>
              {autosaveLabel ? (
                <span
                  role="status"
                  className={
                    autosaveStatus === "saved"
                      ? "shrink-0 rounded-md bg-success/15 px-2 py-0.5 font-sans text-xs font-semibold tracking-wide text-success"
                      : autosaveStatus === "saving"
                        ? "shrink-0 font-sans text-xs font-medium text-muted-foreground"
                        : "shrink-0 rounded-md bg-accent/15 px-2 py-0.5 font-sans text-xs font-semibold tracking-wide text-accent-foreground"
                  }
                >
                  {autosaveLabel}
                </span>
              ) : null}
            </span>
          }
          backHref="/queue"
          backLabel="Queue"
        />
        <PatientContextRail
          className="px-6 pb-4 md:px-8"
          hideName
          patientName={patientName}
          uhid={uhid}
          episodeNo={episodeNo}
          patientPhone={patientPhone}
          patientAge={patientAge}
          patientGender={patientGender}
          doctorName={doctorName}
          patientHref={`/patients/${patientId}`}
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
          <div className="sticky top-0 z-1 overflow-x-auto border-b border-border bg-card/95 px-2 py-1.5 backdrop-blur scrollbar-hide md:px-3">
            <TabsList
              variant="line"
              className="h-auto w-max min-w-full justify-start gap-0.5"
            >
              {WORKSPACE_TABS.map((item) => (
                <TabsTrigger
                  key={item.id}
                  value={item.id}
                  className="min-h-10 flex-none shrink-0 gap-1.5 px-2.5"
                  title={`${item.label} (Alt+${item.shortcut})`}
                >
                  <span>{item.label}</span>
                  <kbd className="hidden rounded border border-border px-1 font-mono text-[10px] text-muted-foreground md:inline">
                    {item.shortcut}
                  </kbd>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="consultation" className="mt-0">
            {(patientAllergies?.trim() || patientChronicConditions?.trim()) ? (
              <div className="border-b border-border px-3 py-3 md:px-4">
                <PatientSafetyBanner
                  allergies={patientAllergies}
                  chronicConditions={patientChronicConditions}
                />
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
              medicines={medicines}
              advice={advice}
              followUp={followUp}
              onMedicinesChange={setMedicines}
              onAdviceChange={setAdvice}
              onFollowUpChange={setFollowUp}
              patientAllergies={patientAllergies}
              hideSaveActions
            />
          </TabsContent>

          <TabsContent value="investigations" className="mt-0">
            <LabOrdersPanel consultationId={consultationId} />
            <InvestigationSections value={clinical} onChange={setClinical} />
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
            >
              <ConsultationAttachments consultationId={consultationId} />
            </CollapsibleSection>
          </TabsContent>
        </Tabs>
      </div>

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-2 border-t border-border bg-card/95 px-3 py-2.5 backdrop-blur md:px-4">
        <p className="text-xs text-muted-foreground md:text-sm">
          <span className="md:hidden">Autosaves</span>
          <span className="hidden md:inline">
            Autosave · ⌘/Ctrl+S draft · ⌘/Ctrl+Enter complete
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="min-h-10"
            onClick={handleSaveDraft}
            loading={isPending("save")}
          >
            Save draft
          </Button>
          <Button
            type="button"
            size="sm"
            className="min-h-10"
            onClick={handleCompleteVisit}
            loading={isPending("complete")}
          >
            Complete visit
          </Button>
        </div>
      </div>
    </PageShell>
  );
}

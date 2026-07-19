"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  amendConsultation,
  saveConsultation,
  submitConsultation,
} from "@/actions/consultations";
import { Button } from "@/components/ui/Button";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  consultationClinicalSchema,
  emptyClinicalPresentation,
  emptyExamination,
  emptyInvestigationResults,
  emptyMedicalCertificate,
  emptyPatientHistory,
  sectionCompletion,
  sectionSummary,
} from "@/lib/consultation-clinical";
import { firstFieldError } from "@/lib/form-utils";
import type {
  ClinicalPresentation,
  ConsultationClinicalData,
  Examination,
  InvestigationResults,
  MedicalCertificate,
  PatientHistory,
  Vitals,
} from "@/lib/types";
import { usePendingAction } from "@/hooks/usePendingAction";

type ConsultationFormProps = {
  consultationId: string;
  initial: ConsultationClinicalData;
  cancelHref?: string;
  onSuccess?: () => void;
  mode?: "active" | "amend";
  amendmentReason?: string;
  onAmendmentReasonChange?: (value: string) => void;
};

const AUTOSAVE_MS = 3000;

export function ConsultationForm({
  consultationId,
  initial,
  cancelHref,
  onSuccess,
  mode = "active",
  amendmentReason = "",
  onAmendmentReasonChange,
}: ConsultationFormProps) {
  const isAmendMode = mode === "amend";
  const [chiefComplaint, setChiefComplaint] = useState(
    initial.chiefComplaint ?? ""
  );
  const [diagnosis, setDiagnosis] = useState(initial.diagnosis ?? "");
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [vitals, setVitals] = useState<Vitals>((initial.vitals as Vitals) ?? {});
  const [clinicalPresentation, setClinicalPresentation] =
    useState<ClinicalPresentation>(
      (initial.clinicalPresentation as ClinicalPresentation) ??
        emptyClinicalPresentation()
    );
  const [patientHistory, setPatientHistory] = useState<PatientHistory>(
    (initial.patientHistory as PatientHistory) ?? emptyPatientHistory()
  );
  const [examination, setExamination] = useState<Examination>(
    (initial.examination as Examination) ?? emptyExamination()
  );
  const [investigationResults, setInvestigationResults] =
    useState<InvestigationResults>(
      (initial.investigationResults as InvestigationResults) ??
        emptyInvestigationResults()
    );
  const [medicalCertificate, setMedicalCertificate] =
    useState<MedicalCertificate>(
      (initial.medicalCertificate as MedicalCertificate) ??
        emptyMedicalCertificate()
    );
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [autosaveStatus, setAutosaveStatus] = useState<
    "idle" | "saving" | "saved" | "offline"
  >("idle");
  const { isPending, run } = usePendingAction<"save" | "submit" | "amend">();
  const autosaveInFlight = useRef(false);
  const isDirty = useRef(false);
  const skipDirtyMark = useRef(true);

  const formData = useMemo(
    () => ({
      chiefComplaint,
      diagnosis,
      notes,
      vitals,
      clinicalPresentation,
      patientHistory,
      examination,
      investigationResults,
      medicalCertificate,
    }),
    [
      chiefComplaint,
      diagnosis,
      notes,
      vitals,
      clinicalPresentation,
      patientHistory,
      examination,
      investigationResults,
      medicalCertificate,
    ]
  );

  const completion = useMemo(() => sectionCompletion(formData), [formData]);

  const getPayload = useCallback((): ConsultationClinicalData => formData, [formData]);

  const validateForm = useCallback(() => {
    const parsed = consultationClinicalSchema.safeParse(getPayload());
    if (parsed.success) return null;

    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstKey = Object.keys(fieldErrors)[0];
    const firstMessage = firstKey
      ? fieldErrors[firstKey as keyof typeof fieldErrors]?.[0]
      : undefined;

    return firstMessage ?? "Please check the consultation form.";
  }, [getPayload]);

  const autosaveDraft = useCallback(async () => {
    if (!isDirty.current) return;

    if (autosaveInFlight.current || typeof navigator !== "undefined" && !navigator.onLine) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setAutosaveStatus("offline");
      }
      return;
    }

    const validationError = validateForm();
    if (validationError) return;

    autosaveInFlight.current = true;
    setAutosaveStatus("saving");

    try {
      const result = await saveConsultation(consultationId, getPayload(), {
        autosave: true,
      });

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
  }, [consultationId, getPayload, validateForm]);

  useEffect(() => {
    if (skipDirtyMark.current) {
      skipDirtyMark.current = false;
      return;
    }
    isDirty.current = true;
  }, [formData]);

  useEffect(() => {
    if (isAmendMode) return;
    if (!isDirty.current) return;

    const timer = setTimeout(() => {
      void autosaveDraft();
    }, AUTOSAVE_MS);

    return () => clearTimeout(timer);
  }, [autosaveDraft, isAmendMode, formData]);

  useEffect(() => {
    if (isAmendMode) return;

    function handleOnline() {
      setAutosaveStatus("idle");
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
  }, [isAmendMode]);

  function handleSave() {
    const validationError = validateForm();
    if (validationError) {
      setMessageType("error");
      setMessage(validationError);
      return;
    }

    void run(async () => {
      const result = await saveConsultation(consultationId, getPayload());
      setMessageType(result.success ? "success" : "error");
      if (result.success) {
        setMessage("Saved to server");
        setAutosaveStatus("saved");
      } else {
        setMessage(result.fieldErrors ? firstFieldError(result.fieldErrors) ?? result.error : result.error);
      }
    }, "save");
  }

  function handleSubmit() {
    const validationError = validateForm();
    if (validationError) {
      setMessageType("error");
      setMessage(validationError);
      return;
    }

    void run(async () => {
      const result = await submitConsultation(consultationId, getPayload());
      if (result.success) {
        setMessageType("success");
        setMessage("Consultation submitted");
        setAutosaveStatus("idle");
        onSuccess?.();
      } else {
        setMessageType("error");
        setMessage(result.fieldErrors ? firstFieldError(result.fieldErrors) ?? result.error : result.error);
      }
    }, "submit");
  }

  function handleAmend() {
    const validationError = validateForm();
    if (validationError) {
      setMessageType("error");
      setMessage(validationError);
      return;
    }

    if (amendmentReason.trim().length < 3) {
      setMessageType("error");
      setMessage("Amendment reason must be at least 3 characters.");
      return;
    }

    void run(async () => {
      const result = await amendConsultation(
        consultationId,
        getPayload(),
        amendmentReason
      );
      if (result.success) {
        setMessageType("success");
        setMessage("Amendment saved");
        onSuccess?.();
      } else {
        setMessageType("error");
        setMessage(
          result.fieldErrors
            ? firstFieldError(result.fieldErrors) ?? result.error
            : result.error
        );
      }
    }, "amend");
  }

  function updateVital(key: keyof Vitals, value: string) {
    setVitals((prev) => ({ ...prev, [key]: value }));
  }

  function updateRecordField<T extends Record<string, string | undefined>>(
    setter: Dispatch<SetStateAction<T>>,
    key: keyof T,
    value: string
  ) {
    setter((prev) => ({ ...prev, [key]: value }));
  }

  const autosaveLabel =
    autosaveStatus === "saving"
      ? "Saving draft..."
      : autosaveStatus === "saved"
        ? "Draft saved to server"
        : autosaveStatus === "offline"
          ? "Offline — draft not saved"
          : null;

  return (
    <div>
      {!isAmendMode && autosaveLabel && (
        <p className="border-b border-border px-4 py-2 text-xs text-muted-foreground" role="status">
          {autosaveLabel}
        </p>
      )}

      {isAmendMode && (
        <div className="border-b border-border px-4 py-4">
          <Textarea
            label="Reason for amendment"
            name="amendmentReason"
            value={amendmentReason}
            onChange={(e) => onAmendmentReasonChange?.(e.target.value)}
            placeholder="e.g. Corrected diagnosis after lab report review"
            rows={3}
            required
          />
        </div>
      )}

      <CollapsibleSection
        flush
        contentClassName="px-4 py-3"
        title="Vitals"
        summary={sectionSummary(completion.vitals)}
        filled={completion.vitals.filled}
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <Input
            label="BP"
            name="bp"
            value={vitals.bp ?? ""}
            onChange={(e) => updateVital("bp", e.target.value)}
            placeholder="120/80"
          />
          <Input
            label="Pulse"
            name="pulse"
            value={vitals.pulse ?? ""}
            onChange={(e) => updateVital("pulse", e.target.value)}
            placeholder="72 bpm"
          />
          <Input
            label="Temp"
            name="temp"
            value={vitals.temp ?? ""}
            onChange={(e) => updateVital("temp", e.target.value)}
            placeholder="98.6°F"
          />
          <Input
            label="Weight"
            name="weight"
            value={vitals.weight ?? ""}
            onChange={(e) => updateVital("weight", e.target.value)}
            placeholder="kg"
          />
          <Input
            label="SpO2"
            name="spo2"
            value={vitals.spo2 ?? ""}
            onChange={(e) => updateVital("spo2", e.target.value)}
            placeholder="%"
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        flush
        contentClassName="px-4 py-3"
        title="Clinical presentation"
        summary={sectionSummary(completion.clinicalPresentation)}
        filled={completion.clinicalPresentation.filled}
      >
        <div className="space-y-4">
          <Textarea
            label="Chief complaint"
            name="chiefComplaint"
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
          />
          <Textarea
            label="History of present illness"
            name="historyOfPresentIllness"
            value={clinicalPresentation.historyOfPresentIllness ?? ""}
            onChange={(e) =>
              updateRecordField(
                setClinicalPresentation,
                "historyOfPresentIllness",
                e.target.value
              )
            }
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Onset"
              name="onset"
              value={clinicalPresentation.onset ?? ""}
              onChange={(e) =>
                updateRecordField(
                  setClinicalPresentation,
                  "onset",
                  e.target.value
                )
              }
              placeholder="e.g. 3 days ago"
            />
            <Input
              label="Duration"
              name="duration"
              value={clinicalPresentation.duration ?? ""}
              onChange={(e) =>
                updateRecordField(
                  setClinicalPresentation,
                  "duration",
                  e.target.value
                )
              }
              placeholder="e.g. intermittent"
            />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        flush
        contentClassName="px-4 py-3"
        title="Patient history"
        summary={sectionSummary(completion.patientHistory)}
        filled={completion.patientHistory.filled}
      >
        <div className="space-y-4">
          <Textarea
            label="Past medical history"
            name="pastMedical"
            value={patientHistory.pastMedical ?? ""}
            onChange={(e) =>
              updateRecordField(setPatientHistory, "pastMedical", e.target.value)
            }
          />
          <Textarea
            label="Past surgical history"
            name="pastSurgical"
            value={patientHistory.pastSurgical ?? ""}
            onChange={(e) =>
              updateRecordField(
                setPatientHistory,
                "pastSurgical",
                e.target.value
              )
            }
          />
          <Textarea
            label="Allergies"
            name="allergies"
            value={patientHistory.allergies ?? ""}
            onChange={(e) =>
              updateRecordField(setPatientHistory, "allergies", e.target.value)
            }
          />
          <Textarea
            label="Current medications"
            name="medications"
            value={patientHistory.medications ?? ""}
            onChange={(e) =>
              updateRecordField(
                setPatientHistory,
                "medications",
                e.target.value
              )
            }
          />
          <Textarea
            label="Family history"
            name="familyHistory"
            value={patientHistory.familyHistory ?? ""}
            onChange={(e) =>
              updateRecordField(
                setPatientHistory,
                "familyHistory",
                e.target.value
              )
            }
          />
          <Textarea
            label="Social history"
            name="socialHistory"
            value={patientHistory.socialHistory ?? ""}
            onChange={(e) =>
              updateRecordField(
                setPatientHistory,
                "socialHistory",
                e.target.value
              )
            }
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        flush
        contentClassName="px-4 py-3"
        title="Examination"
        summary={sectionSummary(completion.examination)}
        filled={completion.examination.filled}
      >
        <div className="space-y-4">
          <Textarea
            label="General"
            name="general"
            value={examination.general ?? ""}
            onChange={(e) =>
              updateRecordField(setExamination, "general", e.target.value)
            }
          />
          <Textarea
            label="Cardiovascular"
            name="cardiovascular"
            value={examination.cardiovascular ?? ""}
            onChange={(e) =>
              updateRecordField(
                setExamination,
                "cardiovascular",
                e.target.value
              )
            }
          />
          <Textarea
            label="Respiratory"
            name="respiratory"
            value={examination.respiratory ?? ""}
            onChange={(e) =>
              updateRecordField(setExamination, "respiratory", e.target.value)
            }
          />
          <Textarea
            label="Abdomen"
            name="abdomen"
            value={examination.abdomen ?? ""}
            onChange={(e) =>
              updateRecordField(setExamination, "abdomen", e.target.value)
            }
          />
          <Textarea
            label="Neurological"
            name="neurological"
            value={examination.neurological ?? ""}
            onChange={(e) =>
              updateRecordField(setExamination, "neurological", e.target.value)
            }
          />
          <Textarea
            label="Other findings"
            name="other"
            value={examination.other ?? ""}
            onChange={(e) =>
              updateRecordField(setExamination, "other", e.target.value)
            }
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        flush
        contentClassName="px-4 py-3"
        title="Investigation results"
        summary={sectionSummary(completion.investigationResults)}
        filled={completion.investigationResults.filled}
      >
        <div className="space-y-4">
          <Textarea
            label="Lab results"
            name="labs"
            value={investigationResults.labs ?? ""}
            onChange={(e) =>
              updateRecordField(setInvestigationResults, "labs", e.target.value)
            }
          />
          <Textarea
            label="Imaging"
            name="imaging"
            value={investigationResults.imaging ?? ""}
            onChange={(e) =>
              updateRecordField(
                setInvestigationResults,
                "imaging",
                e.target.value
              )
            }
          />
          <Textarea
            label="Other investigations"
            name="otherInvestigations"
            value={investigationResults.other ?? ""}
            onChange={(e) =>
              updateRecordField(setInvestigationResults, "other", e.target.value)
            }
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        flush
        contentClassName="px-4 py-3"
        title="Diagnosis"
        summary={sectionSummary(completion.diagnosis)}
        filled={completion.diagnosis.filled}
      >
        <Textarea
          label="Diagnosis"
          name="diagnosis"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
        />
      </CollapsibleSection>

      <CollapsibleSection
        flush
        contentClassName="px-4 py-3"
        title="Annotations"
        summary={sectionSummary(completion.notes)}
        filled={completion.notes.filled}
      >
        <Textarea
          label="Notes"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional clinical notes or annotations"
        />
      </CollapsibleSection>

      <CollapsibleSection
        flush
        contentClassName="px-4 py-3"
        title="Medical certificate"
        summary={sectionSummary(completion.medicalCertificate)}
        filled={completion.medicalCertificate.filled}
      >
        <div className="space-y-4">
          <Textarea
            label="Diagnosis for certificate"
            name="diagnosisForCertificate"
            value={medicalCertificate.diagnosisForCertificate ?? ""}
            onChange={(e) =>
              updateRecordField(
                setMedicalCertificate,
                "diagnosisForCertificate",
                e.target.value
              )
            }
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Rest from"
              name="restFrom"
              type="date"
              value={medicalCertificate.restFrom ?? ""}
              onChange={(e) =>
                updateRecordField(
                  setMedicalCertificate,
                  "restFrom",
                  e.target.value
                )
              }
            />
            <Input
              label="Rest to"
              name="restTo"
              type="date"
              value={medicalCertificate.restTo ?? ""}
              onChange={(e) =>
                updateRecordField(
                  setMedicalCertificate,
                  "restTo",
                  e.target.value
                )
              }
            />
          </div>
          <Input
            label="Fitness status"
            name="fitnessStatus"
            value={medicalCertificate.fitnessStatus ?? ""}
            onChange={(e) =>
              updateRecordField(
                setMedicalCertificate,
                "fitnessStatus",
                e.target.value
              )
            }
            placeholder="e.g. Fit for duty, unfit for 5 days"
          />
          <Textarea
            label="Remarks"
            name="remarks"
            value={medicalCertificate.remarks ?? ""}
            onChange={(e) =>
              updateRecordField(setMedicalCertificate, "remarks", e.target.value)
            }
          />
        </div>
      </CollapsibleSection>

      {message && (
        <p
          className={`border-t border-border px-4 py-3 text-sm ${messageType === "error" ? "text-danger" : "text-muted-foreground"}`}
          role={messageType === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      )}

      <div className="flex flex-wrap gap-3 border-t border-border px-4 py-4">
        {cancelHref && (
          <Link
            href={cancelHref}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-white px-4 text-sm font-medium text-ink hover:bg-surface-muted"
          >
            Cancel
          </Link>
        )}
        {isAmendMode ? (
          <Button
            type="button"
            onClick={handleAmend}
            loading={isPending("amend")}
          >
            Save amendment
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSave}
              loading={isPending("save")}
            >
              Save
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              loading={isPending("submit")}
            >
              Submit consultation
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

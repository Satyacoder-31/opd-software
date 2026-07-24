"use client";

import type { Dispatch, SetStateAction } from "react";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  emptyClinicalPresentation,
  emptyExamination,
  emptyInvestigationResults,
  emptyMedicalCertificate,
  emptyPatientHistory,
  sectionCompletion,
  sectionSummary,
  vitalFieldLabel,
  VITAL_FIELDS,
} from "@/lib/consultation-clinical";
import type {
  ClinicalPresentation,
  ConsultationClinicalData,
  Examination,
  InvestigationResults,
  MedicalCertificate,
  PatientHistory,
  Vitals,
} from "@/lib/types";

function updateRecordField<T extends Record<string, string | undefined>>(
  setter: Dispatch<SetStateAction<T>>,
  key: keyof T,
  value: string,
) {
  setter((prev) => ({ ...prev, [key]: value }));
}

type ClinicalSectionsProps = {
  value: ConsultationClinicalData;
  onChange: (next: ConsultationClinicalData) => void;
};

function patchClinical(
  value: ConsultationClinicalData,
  onChange: (next: ConsultationClinicalData) => void,
  patch: Partial<ConsultationClinicalData>,
) {
  onChange({ ...value, ...patch });
}

export function ConsultationClinicalSections({
  value,
  onChange,
}: ClinicalSectionsProps) {
  const vitals = (value.vitals as Vitals) ?? {};
  const clinicalPresentation =
    (value.clinicalPresentation as ClinicalPresentation) ??
    emptyClinicalPresentation();
  const patientHistory =
    (value.patientHistory as PatientHistory) ?? emptyPatientHistory();
  const examination = (value.examination as Examination) ?? emptyExamination();
  const completion = sectionCompletion(value);

  function setVitals(next: SetStateAction<Vitals>) {
    const resolved = typeof next === "function" ? next(vitals) : next;
    patchClinical(value, onChange, { vitals: resolved });
  }

  function setClinicalPresentation(next: SetStateAction<ClinicalPresentation>) {
    const resolved =
      typeof next === "function" ? next(clinicalPresentation) : next;
    patchClinical(value, onChange, { clinicalPresentation: resolved });
  }

  function setPatientHistory(next: SetStateAction<PatientHistory>) {
    const resolved = typeof next === "function" ? next(patientHistory) : next;
    patchClinical(value, onChange, { patientHistory: resolved });
  }

  function setExamination(next: SetStateAction<Examination>) {
    const resolved = typeof next === "function" ? next(examination) : next;
    patchClinical(value, onChange, { examination: resolved });
  }

  return (
    <div>
      <div id="ws-vitals" className="scroll-mt-2" tabIndex={-1}>
        <CollapsibleSection
          flush
          density="compact"
          contentClassName="px-3 py-3 md:px-4"
          title="Vitals"
          summary={sectionSummary(completion.vitals)}
          filled={completion.vitals.filled}
          defaultOpen
        >
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {VITAL_FIELDS.map((field) => (
              <Input
                key={field.key}
                label={vitalFieldLabel(field.label, field.unit)}
                name={field.key}
                value={vitals[field.key] ?? ""}
                onChange={(e) =>
                  setVitals((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }))
                }
                placeholder={field.placeholder}
                inputMode={field.key === "bp" ? "text" : "decimal"}
                className="h-10"
              />
            ))}
          </div>
        </CollapsibleSection>
      </div>

      <div id="ws-essentials" className="scroll-mt-2" tabIndex={-1}>
        <CollapsibleSection
          flush
          density="compact"
          contentClassName="px-3 py-3 md:px-4"
          title="Chief complaint & diagnosis"
          summary={sectionSummary({
            filled:
              completion.clinicalPresentation.filled ||
              completion.diagnosis.filled,
            count:
              completion.clinicalPresentation.count +
              completion.diagnosis.count,
            total:
              completion.clinicalPresentation.total +
              completion.diagnosis.total,
          })}
          filled={
            completion.clinicalPresentation.filled ||
            completion.diagnosis.filled
          }
        >
          <div className="flex flex-col gap-2.5">
            <div className="grid gap-2.5 md:grid-cols-2">
              <Textarea
                label="Chief complaint"
                name="chiefComplaint"
                value={value.chiefComplaint ?? ""}
                onChange={(e) =>
                  patchClinical(value, onChange, {
                    chiefComplaint: e.target.value,
                  })
                }
                rows={2}
                className="min-h-14"
              />
              <Textarea
                label="Diagnosis"
                name="diagnosis"
                value={value.diagnosis ?? ""}
                onChange={(e) =>
                  patchClinical(value, onChange, {
                    diagnosis: e.target.value,
                  })
                }
                rows={2}
                className="min-h-14"
              />
            </div>
            <Textarea
              label="History of present illness"
              name="historyOfPresentIllness"
              value={clinicalPresentation.historyOfPresentIllness ?? ""}
              onChange={(e) =>
                updateRecordField(
                  setClinicalPresentation,
                  "historyOfPresentIllness",
                  e.target.value,
                )
              }
              rows={3}
              className="min-h-16"
            />
            <div className="grid gap-2.5 md:grid-cols-2">
              <Input
                label="Onset"
                name="onset"
                value={clinicalPresentation.onset ?? ""}
                onChange={(e) =>
                  updateRecordField(
                    setClinicalPresentation,
                    "onset",
                    e.target.value,
                  )
                }
                placeholder="e.g. 3 days ago"
                className="h-10"
              />
              <Input
                label="Duration"
                name="duration"
                value={clinicalPresentation.duration ?? ""}
                onChange={(e) =>
                  updateRecordField(
                    setClinicalPresentation,
                    "duration",
                    e.target.value,
                  )
                }
                placeholder="e.g. intermittent"
                className="h-10"
              />
            </div>
          </div>
        </CollapsibleSection>
      </div>

      <div id="ws-history" className="scroll-mt-2" tabIndex={-1}>
        <CollapsibleSection
          flush
          density="compact"
          contentClassName="px-3 py-3 md:px-4"
          title="Patient history"
          summary={sectionSummary(completion.patientHistory)}
          filled={completion.patientHistory.filled}
        >
          <div className="flex flex-col gap-2.5">
            <Textarea
              label="Past medical history"
              name="pastMedical"
              value={patientHistory.pastMedical ?? ""}
              onChange={(e) =>
                updateRecordField(
                  setPatientHistory,
                  "pastMedical",
                  e.target.value,
                )
              }
              rows={2}
              className="min-h-14"
            />
            <Textarea
              label="Past surgical history"
              name="pastSurgical"
              value={patientHistory.pastSurgical ?? ""}
              onChange={(e) =>
                updateRecordField(
                  setPatientHistory,
                  "pastSurgical",
                  e.target.value,
                )
              }
              rows={2}
              className="min-h-14"
            />
            <div className="grid gap-2.5 md:grid-cols-2">
              <Textarea
                label="Allergies"
                name="allergies"
                value={patientHistory.allergies ?? ""}
                onChange={(e) =>
                  updateRecordField(
                    setPatientHistory,
                    "allergies",
                    e.target.value,
                  )
                }
                rows={2}
                className="min-h-14"
              />
              <Textarea
                label="Current medications"
                name="medications"
                value={patientHistory.medications ?? ""}
                onChange={(e) =>
                  updateRecordField(
                    setPatientHistory,
                    "medications",
                    e.target.value,
                  )
                }
                rows={2}
                className="min-h-14"
              />
            </div>
            <div className="grid gap-2.5 md:grid-cols-2">
              <Textarea
                label="Family history"
                name="familyHistory"
                value={patientHistory.familyHistory ?? ""}
                onChange={(e) =>
                  updateRecordField(
                    setPatientHistory,
                    "familyHistory",
                    e.target.value,
                  )
                }
                rows={2}
                className="min-h-14"
              />
              <Textarea
                label="Social history"
                name="socialHistory"
                value={patientHistory.socialHistory ?? ""}
                onChange={(e) =>
                  updateRecordField(
                    setPatientHistory,
                    "socialHistory",
                    e.target.value,
                  )
                }
                rows={2}
                className="min-h-14"
              />
            </div>
          </div>
        </CollapsibleSection>
      </div>

      <div id="ws-examination" className="scroll-mt-2" tabIndex={-1}>
        <CollapsibleSection
          flush
          density="compact"
          contentClassName="px-3 py-3 md:px-4"
          title="Examination"
          summary={sectionSummary(completion.examination)}
          filled={completion.examination.filled}
        >
          <div className="flex flex-col gap-2.5">
            <Textarea
              label="General"
              name="general"
              value={examination.general ?? ""}
              onChange={(e) =>
                updateRecordField(setExamination, "general", e.target.value)
              }
              rows={2}
              className="min-h-14"
            />
            <div className="grid gap-2.5 md:grid-cols-2">
              <Textarea
                label="Cardiovascular"
                name="cardiovascular"
                value={examination.cardiovascular ?? ""}
                onChange={(e) =>
                  updateRecordField(
                    setExamination,
                    "cardiovascular",
                    e.target.value,
                  )
                }
                rows={2}
                className="min-h-14"
              />
              <Textarea
                label="Respiratory"
                name="respiratory"
                value={examination.respiratory ?? ""}
                onChange={(e) =>
                  updateRecordField(
                    setExamination,
                    "respiratory",
                    e.target.value,
                  )
                }
                rows={2}
                className="min-h-14"
              />
              <Textarea
                label="Abdomen"
                name="abdomen"
                value={examination.abdomen ?? ""}
                onChange={(e) =>
                  updateRecordField(setExamination, "abdomen", e.target.value)
                }
                rows={2}
                className="min-h-14"
              />
              <Textarea
                label="Neurological"
                name="neurological"
                value={examination.neurological ?? ""}
                onChange={(e) =>
                  updateRecordField(
                    setExamination,
                    "neurological",
                    e.target.value,
                  )
                }
                rows={2}
                className="min-h-14"
              />
            </div>
            <Textarea
              label="Other findings"
              name="other"
              value={examination.other ?? ""}
              onChange={(e) =>
                updateRecordField(setExamination, "other", e.target.value)
              }
              rows={2}
              className="min-h-14"
            />
          </div>
        </CollapsibleSection>
      </div>

      <div id="ws-notes" className="scroll-mt-2" tabIndex={-1}>
        <CollapsibleSection
          flush
          density="compact"
          contentClassName="px-3 py-3 md:px-4"
          title="Additional notes"
          summary={sectionSummary(completion.notes)}
          filled={completion.notes.filled}
        >
          <Textarea
            label="Notes"
            name="notes"
            value={value.notes ?? ""}
            onChange={(e) =>
              patchClinical(value, onChange, { notes: e.target.value })
            }
            placeholder="Additional clinical notes or annotations"
            rows={3}
            className="min-h-16"
          />
        </CollapsibleSection>
      </div>
    </div>
  );
}

export function InvestigationSections({
  value,
  onChange,
}: ClinicalSectionsProps) {
  const investigationResults =
    (value.investigationResults as InvestigationResults) ??
    emptyInvestigationResults();
  const completion = sectionCompletion(value);

  function setInvestigationResults(next: SetStateAction<InvestigationResults>) {
    const resolved =
      typeof next === "function" ? next(investigationResults) : next;
    patchClinical(value, onChange, { investigationResults: resolved });
  }

  return (
    <div id="ws-investigations" className="scroll-mt-2" tabIndex={-1}>
      <CollapsibleSection
        flush
        density="compact"
        contentClassName="px-3 py-3 md:px-4"
        title="Investigation results"
        summary={sectionSummary(completion.investigationResults)}
        filled={completion.investigationResults.filled}
        defaultOpen
      >
        <div className="flex flex-col gap-2.5">
          <Textarea
            label="Lab results"
            name="labs"
            value={investigationResults.labs ?? ""}
            onChange={(e) =>
              updateRecordField(setInvestigationResults, "labs", e.target.value)
            }
            rows={3}
            className="min-h-16"
          />
          <Textarea
            label="Imaging"
            name="imaging"
            value={investigationResults.imaging ?? ""}
            onChange={(e) =>
              updateRecordField(
                setInvestigationResults,
                "imaging",
                e.target.value,
              )
            }
            rows={3}
            className="min-h-16"
          />
          <Textarea
            label="Other investigations"
            name="otherInvestigations"
            value={investigationResults.other ?? ""}
            onChange={(e) =>
              updateRecordField(
                setInvestigationResults,
                "other",
                e.target.value,
              )
            }
            rows={2}
            className="min-h-14"
          />
        </div>
      </CollapsibleSection>
    </div>
  );
}

export function MedicalCertificateSections({
  value,
  onChange,
}: ClinicalSectionsProps) {
  const medicalCertificate =
    (value.medicalCertificate as MedicalCertificate) ??
    emptyMedicalCertificate();
  const completion = sectionCompletion(value);

  function setMedicalCertificate(next: SetStateAction<MedicalCertificate>) {
    const resolved =
      typeof next === "function" ? next(medicalCertificate) : next;
    patchClinical(value, onChange, { medicalCertificate: resolved });
  }

  return (
    <div id="ws-documents" className="scroll-mt-2" tabIndex={-1}>
      <CollapsibleSection
        flush
        density="compact"
        contentClassName="px-3 py-3 md:px-4"
        title="Medical certificate"
        summary={sectionSummary(completion.medicalCertificate)}
        filled={completion.medicalCertificate.filled}
        defaultOpen
      >
        <div className="flex flex-col gap-2.5">
          <Textarea
            label="Diagnosis for certificate"
            name="diagnosisForCertificate"
            value={medicalCertificate.diagnosisForCertificate ?? ""}
            onChange={(e) =>
              updateRecordField(
                setMedicalCertificate,
                "diagnosisForCertificate",
                e.target.value,
              )
            }
            rows={2}
            className="min-h-14"
          />
          <div className="grid gap-2.5 md:grid-cols-2">
            <Input
              label="Rest from"
              name="restFrom"
              type="date"
              value={medicalCertificate.restFrom ?? ""}
              onChange={(e) =>
                updateRecordField(
                  setMedicalCertificate,
                  "restFrom",
                  e.target.value,
                )
              }
              className="h-10"
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
                  e.target.value,
                )
              }
              className="h-10"
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
                e.target.value,
              )
            }
            placeholder="e.g. Fit for duty, unfit for 5 days"
            className="h-10"
          />
          <Textarea
            label="Remarks"
            name="remarks"
            value={medicalCertificate.remarks ?? ""}
            onChange={(e) =>
              updateRecordField(
                setMedicalCertificate,
                "remarks",
                e.target.value,
              )
            }
            rows={2}
            className="min-h-14"
          />
        </div>
      </CollapsibleSection>
    </div>
  );
}

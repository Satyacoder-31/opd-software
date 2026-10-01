"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  faBone,
  faBrain,
  faCertificate,
  faClipboard,
  faClipboardList,
  faClockRotateLeft,
  faFileMedical,
  faFileWaveform,
  faFlaskVial,
  faHeartPulse,
  faLungs,
  faNotesMedical,
  faPills,
  faShieldHalved,
  faStethoscope,
  faUser,
  faUserCheck,
  faUsers,
  faXRay,
} from "@fortawesome/free-solid-svg-icons";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { Input } from "@/components/ui/Input";
import { ClinicalDropdownInput } from "@/components/consultation/ClinicalDropdownInput";
import { ClinicalDropdownTextarea } from "@/components/consultation/ClinicalDropdownTextarea";
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
import {
  CHIEF_COMPLAINT_RECOMMENDATIONS,
  DIAGNOSIS_NOTES_RECOMMENDATIONS,
  HPI_RECOMMENDATIONS,
  ONSET_RECOMMENDATIONS,
  DURATION_RECOMMENDATIONS,
  PAST_MEDICAL_RECOMMENDATIONS,
  PAST_SURGICAL_RECOMMENDATIONS,
  ALLERGIES_RECOMMENDATIONS,
  CURRENT_MEDICATIONS_RECOMMENDATIONS,
  FAMILY_HISTORY_RECOMMENDATIONS,
  SOCIAL_HISTORY_RECOMMENDATIONS,
  GENERAL_EXAM_RECOMMENDATIONS,
  CVS_EXAM_RECOMMENDATIONS,
  RESP_EXAM_RECOMMENDATIONS,
  ABDOMEN_EXAM_RECOMMENDATIONS,
  NEURO_EXAM_RECOMMENDATIONS,
  OTHER_EXAM_RECOMMENDATIONS,
  ADDITIONAL_NOTES_RECOMMENDATIONS,
  LAB_RESULTS_RECOMMENDATIONS,
  IMAGING_RESULTS_RECOMMENDATIONS,
  OTHER_INVESTIGATION_RECOMMENDATIONS,
  MED_CERT_DIAGNOSIS_RECOMMENDATIONS,
  MED_CERT_FITNESS_RECOMMENDATIONS,
  MED_CERT_REMARKS_RECOMMENDATIONS,
} from "@/lib/clinical-recommendations";
import type {
  ClinicalPresentation,
  ConsultationClinicalData,
  Examination,
  InvestigationResults,
  MedicalCertificate,
  PatientHistory,
  Vitals,
} from "@/lib/types";
import { DiagnosisCodesField } from "@/components/consultation/DiagnosisCodesField";

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
              <ClinicalDropdownTextarea
                icon={faClipboardList}
                label="Chief complaint"
                name="chiefComplaint"
                value={value.chiefComplaint ?? ""}
                onChange={(text) =>
                  patchClinical(value, onChange, { chiefComplaint: text })
                }
                options={CHIEF_COMPLAINT_RECOMMENDATIONS}
                placeholder="e.g. Pain in right knee joint aggravated by walking"
                rows={2}
              />
              <ClinicalDropdownTextarea
                icon={faStethoscope}
                label="Diagnosis notes"
                name="diagnosis"
                value={value.diagnosis ?? ""}
                onChange={(text) =>
                  patchClinical(value, onChange, { diagnosis: text })
                }
                options={DIAGNOSIS_NOTES_RECOMMENDATIONS}
                placeholder="Free-text notes (or select common clinical diagnosis)"
                rows={2}
              />
            </div>
            <DiagnosisCodesField
              value={value.diagnosisCodes ?? []}
              onChange={(diagnosisCodes) =>
                patchClinical(value, onChange, { diagnosisCodes })
              }
            />
            <ClinicalDropdownTextarea
              icon={faClockRotateLeft}
              label="History of present illness"
              name="historyOfPresentIllness"
              value={clinicalPresentation.historyOfPresentIllness ?? ""}
              onChange={(text) =>
                updateRecordField(
                  setClinicalPresentation,
                  "historyOfPresentIllness",
                  text,
                )
              }
              options={HPI_RECOMMENDATIONS}
              placeholder="Onset, progression, aggravating/relieving factors, radiation…"
              rows={3}
            />
            <div className="grid gap-2.5 md:grid-cols-2">
              <ClinicalDropdownInput
                label="Onset"
                name="onset"
                value={clinicalPresentation.onset ?? ""}
                onChange={(text) =>
                  updateRecordField(setClinicalPresentation, "onset", text)
                }
                options={ONSET_RECOMMENDATIONS}
                placeholder="e.g. Acute onset (2-3 days ago)"
              />
              <ClinicalDropdownInput
                label="Duration"
                name="duration"
                value={clinicalPresentation.duration ?? ""}
                onChange={(text) =>
                  updateRecordField(setClinicalPresentation, "duration", text)
                }
                options={DURATION_RECOMMENDATIONS}
                placeholder="e.g. 5 days, 2 weeks, intermittent"
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
            <ClinicalDropdownTextarea
              icon={faFileMedical}
              label="Past medical history"
              name="pastMedical"
              value={patientHistory.pastMedical ?? ""}
              onChange={(text) =>
                updateRecordField(setPatientHistory, "pastMedical", text)
              }
              options={PAST_MEDICAL_RECOMMENDATIONS}
              placeholder="e.g. Hypertension, Type 2 Diabetes Mellitus"
              rows={2}
            />
            <ClinicalDropdownTextarea
              icon={faBone}
              label="Past surgical history"
              name="pastSurgical"
              value={patientHistory.pastSurgical ?? ""}
              onChange={(text) =>
                updateRecordField(setPatientHistory, "pastSurgical", text)
              }
              options={PAST_SURGICAL_RECOMMENDATIONS}
              placeholder="e.g. Total Knee Replacement, Appendectomy"
              rows={2}
            />
            <div className="grid gap-2.5 md:grid-cols-2">
              <ClinicalDropdownTextarea
                icon={faShieldHalved}
                label="Allergies"
                name="allergies"
                value={patientHistory.allergies ?? ""}
                onChange={(text) =>
                  updateRecordField(setPatientHistory, "allergies", text)
                }
                options={ALLERGIES_RECOMMENDATIONS}
                placeholder="e.g. NKDA, Penicillin, NSAIDs"
                rows={2}
              />
              <ClinicalDropdownTextarea
                icon={faPills}
                label="Current medications"
                name="medications"
                value={patientHistory.medications ?? ""}
                onChange={(text) =>
                  updateRecordField(setPatientHistory, "medications", text)
                }
                options={CURRENT_MEDICATIONS_RECOMMENDATIONS}
                placeholder="e.g. Tab Telmisartan 40 mg OD, Tab Metformin 500 mg BD"
                rows={2}
              />
            </div>
            <div className="grid gap-2.5 md:grid-cols-2">
              <ClinicalDropdownTextarea
                icon={faUsers}
                label="Family history"
                name="familyHistory"
                value={patientHistory.familyHistory ?? ""}
                onChange={(text) =>
                  updateRecordField(setPatientHistory, "familyHistory", text)
                }
                options={FAMILY_HISTORY_RECOMMENDATIONS}
                placeholder="e.g. Hypertension, CAD, Osteoarthritis"
                rows={2}
              />
              <ClinicalDropdownTextarea
                icon={faUser}
                label="Social history"
                name="socialHistory"
                value={patientHistory.socialHistory ?? ""}
                onChange={(text) =>
                  updateRecordField(setPatientHistory, "socialHistory", text)
                }
                options={SOCIAL_HISTORY_RECOMMENDATIONS}
                placeholder="e.g. Non-smoker, sedentary lifestyle, desk job"
                rows={2}
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
            <ClinicalDropdownTextarea
              icon={faUserCheck}
              label="General"
              name="general"
              value={examination.general ?? ""}
              onChange={(text) =>
                updateRecordField(setExamination, "general", text)
              }
              options={GENERAL_EXAM_RECOMMENDATIONS}
              placeholder="General appearance, consciousness, pallor, icterus, pedal edema…"
              rows={2}
            />
            <div className="grid gap-2.5 md:grid-cols-2">
              <ClinicalDropdownTextarea
                icon={faHeartPulse}
                label="Cardiovascular"
                name="cardiovascular"
                value={examination.cardiovascular ?? ""}
                onChange={(text) =>
                  updateRecordField(setExamination, "cardiovascular", text)
                }
                options={CVS_EXAM_RECOMMENDATIONS}
                placeholder="Heart sounds, rhythm, murmurs…"
                rows={2}
              />
              <ClinicalDropdownTextarea
                icon={faLungs}
                label="Respiratory"
                name="respiratory"
                value={examination.respiratory ?? ""}
                onChange={(text) =>
                  updateRecordField(setExamination, "respiratory", text)
                }
                options={RESP_EXAM_RECOMMENDATIONS}
                placeholder="Air entry, breath sounds, wheezing, crepitations…"
                rows={2}
              />
              <ClinicalDropdownTextarea
                icon={faStethoscope}
                label="Abdomen"
                name="abdomen"
                value={examination.abdomen ?? ""}
                onChange={(text) =>
                  updateRecordField(setExamination, "abdomen", text)
                }
                options={ABDOMEN_EXAM_RECOMMENDATIONS}
                placeholder="Tenderness, guarding, bowel sounds, organomegaly…"
                rows={2}
              />
              <ClinicalDropdownTextarea
                icon={faBrain}
                label="Neurological"
                name="neurological"
                value={examination.neurological ?? ""}
                onChange={(text) =>
                  updateRecordField(setExamination, "neurological", text)
                }
                options={NEURO_EXAM_RECOMMENDATIONS}
                placeholder="Motor power, DTR, sensations, SLR test…"
                rows={2}
              />
            </div>
            <ClinicalDropdownTextarea
              icon={faNotesMedical}
              label="Other findings"
              name="other"
              value={examination.other ?? ""}
              onChange={(text) =>
                updateRecordField(setExamination, "other", text)
              }
              options={OTHER_EXAM_RECOMMENDATIONS}
              placeholder="Local joint examination: tenderness, crepitus, range of motion, tests…"
              rows={2}
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
          <ClinicalDropdownTextarea
            icon={faClipboard}
            label="Notes"
            name="notes"
            value={value.notes ?? ""}
            onChange={(text) =>
              patchClinical(value, onChange, { notes: text })
            }
            options={ADDITIONAL_NOTES_RECOMMENDATIONS}
            placeholder="Additional clinical notes, patient counseling, red flag warnings…"
            rows={3}
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
      >
        <div className="flex flex-col gap-2.5">
          <ClinicalDropdownTextarea
            icon={faFlaskVial}
            label="Lab results"
            name="labs"
            value={investigationResults.labs ?? ""}
            onChange={(text) =>
              updateRecordField(setInvestigationResults, "labs", text)
            }
            options={LAB_RESULTS_RECOMMENDATIONS}
            placeholder="e.g. CBC, ESR/CRP, Blood sugar, Uric acid, LFT, KFT findings…"
            rows={3}
          />
          <ClinicalDropdownTextarea
            icon={faXRay}
            label="Imaging"
            name="imaging"
            value={investigationResults.imaging ?? ""}
            onChange={(text) =>
              updateRecordField(setInvestigationResults, "imaging", text)
            }
            options={IMAGING_RESULTS_RECOMMENDATIONS}
            placeholder="e.g. X-ray knee OA, Lumbar spine MRI, Chest X-ray, Ultrasound findings…"
            rows={3}
          />
          <ClinicalDropdownTextarea
            icon={faFileWaveform}
            label="Other investigations"
            name="otherInvestigations"
            value={investigationResults.other ?? ""}
            onChange={(text) =>
              updateRecordField(setInvestigationResults, "other", text)
            }
            options={OTHER_INVESTIGATION_RECOMMENDATIONS}
            placeholder="e.g. ECG normal sinus rhythm, DEXA bone scan T-score, EMG/NCV…"
            rows={2}
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
      >
        <div className="flex flex-col gap-2.5">
          <ClinicalDropdownTextarea
            icon={faCertificate}
            label="Diagnosis for certificate"
            name="diagnosisForCertificate"
            value={medicalCertificate.diagnosisForCertificate ?? ""}
            onChange={(text) =>
              updateRecordField(
                setMedicalCertificate,
                "diagnosisForCertificate",
                text,
              )
            }
            options={MED_CERT_DIAGNOSIS_RECOMMENDATIONS}
            placeholder="Diagnosis certified on official medical certificate"
            rows={2}
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
          <ClinicalDropdownInput
            label="Fitness status"
            name="fitnessStatus"
            value={medicalCertificate.fitnessStatus ?? ""}
            onChange={(text) =>
              updateRecordField(
                setMedicalCertificate,
                "fitnessStatus",
                text,
              )
            }
            options={MED_CERT_FITNESS_RECOMMENDATIONS}
            placeholder="e.g. Unfit for duty — Advised strict medical rest"
          />
          <ClinicalDropdownTextarea
            icon={faFileMedical}
            label="Remarks"
            name="remarks"
            value={medicalCertificate.remarks ?? ""}
            onChange={(text) =>
              updateRecordField(
                setMedicalCertificate,
                "remarks",
                text,
              )
            }
            options={MED_CERT_REMARKS_RECOMMENDATIONS}
            placeholder="e.g. Advised strict rest; avoid weight bearing; review on expiry"
            rows={2}
          />
        </div>
      </CollapsibleSection>
    </div>
  );
}

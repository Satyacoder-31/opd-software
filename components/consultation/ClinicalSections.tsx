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
  faTemperatureHalf,
  faTriangleExclamation,
  faUser,
  faUserCheck,
  faUsers,
  faXRay,
} from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { Input } from "@/components/ui/Input";
import { ClinicalDropdownInput } from "@/components/consultation/ClinicalDropdownInput";
import { ClinicalDropdownTextarea } from "@/components/consultation/ClinicalDropdownTextarea";
import {
  emptyAdviceData,
  emptyClinicalPresentation,
  emptyExamination,
  emptyInvestigationResults,
  emptyMedicalCertificate,
  emptyPatientHistory,
  emptyTreatmentPlan,
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
  JOINTS_AND_PARTS_EXAM_RECOMMENDATIONS,
  ADDITIONAL_NOTES_RECOMMENDATIONS,
  ADVICE_RECOMMENDATIONS,
  ADVICE_GENERAL_PRECAUTIONS,
  ADVICE_PHYSIOTHERAPY_RECOMMENDATIONS,
  ADVICE_ACTIVITY_RESTRICTIONS,
  ADVICE_DIET_LIFESTYLE_RECOMMENDATIONS,
  ADVICE_WARNING_SIGNS_RECOMMENDATIONS,
  TREATMENT_PLAN_TYPE_RECOMMENDATIONS,
  TREATMENT_PLAN_PROCEDURE_RECOMMENDATIONS,
  TREATMENT_PLAN_LATERALITY_RECOMMENDATIONS,
  TREATMENT_PLAN_ANESTHESIA_RECOMMENDATIONS,
  TREATMENT_PLAN_PREOP_RECOMMENDATIONS,
  TREATMENT_PLAN_IMPLANTS_RECOMMENDATIONS,
  TREATMENT_PLAN_TIMING_RECOMMENDATIONS,
  TREATMENT_PLAN_REHAB_RECOMMENDATIONS,
  TREATMENT_PLAN_COUNSELING_RECOMMENDATIONS,
  TREATMENT_PLAN_CONSERVATIVE_RECOMMENDATIONS,
  LAB_RESULTS_RECOMMENDATIONS,
  IMAGING_RESULTS_RECOMMENDATIONS,
  OTHER_INVESTIGATION_RECOMMENDATIONS,
  MED_CERT_DIAGNOSIS_RECOMMENDATIONS,
  MED_CERT_FITNESS_RECOMMENDATIONS,
  MED_CERT_REMARKS_RECOMMENDATIONS,
} from "@/lib/clinical-recommendations";
import type {
  AdviceData,
  ClinicalPresentation,
  ConsultationClinicalData,
  Examination,
  InvestigationResults,
  MedicalCertificate,
  PatientHistory,
  TreatmentPlan,
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
  const treatmentPlan =
    (value.treatmentPlan as TreatmentPlan) ?? emptyTreatmentPlan();
  const adviceDetails =
    (value.adviceDetails as AdviceData) ?? emptyAdviceData();
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

  function setTreatmentPlan(next: SetStateAction<TreatmentPlan>) {
    const resolved = typeof next === "function" ? next(treatmentPlan) : next;
    patchClinical(value, onChange, { treatmentPlan: resolved });
  }

  function setAdviceDetails(next: SetStateAction<AdviceData>) {
    const resolved = typeof next === "function" ? next(adviceDetails) : next;
    patchClinical(value, onChange, { adviceDetails: resolved });
  }

  return (
    <div>
      <div id="ws-vitals" className="scroll-mt-2" tabIndex={-1}>
        <CollapsibleSection
          flush
          density="compact"
          contentClassName="px-3 py-3 md:px-4"
          title="Vitals"
          icon={faTemperatureHalf}
          iconColor="bg-rose-500/15 text-rose-600"
          summary={sectionSummary(completion.vitals)}
          filled={completion.vitals.filled}
          badgeText={completion.vitals.filled ? "Recorded" : "Pending"}
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
          icon={faClipboardList}
          iconColor="bg-blue-500/15 text-blue-600"
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
          icon={faFileMedical}
          iconColor="bg-amber-500/15 text-amber-600"
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
          icon={faStethoscope}
          iconColor="bg-violet-500/15 text-violet-600"
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
            {/* Comprehensive Joints & Body Parts Examination (OPD / Orthopedic) */}
            <div className="rounded-lg border border-violet-200/80 bg-violet-50/40 p-3 dark:border-violet-900/50 dark:bg-violet-950/20">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5">
                <span className="text-xs font-semibold text-violet-950 dark:text-violet-200 flex items-center gap-1.5">
                  <Icon icon={faBone} className="size-3.5 text-violet-600" />
                  Joints &amp; Body Parts Examination (Local OPD Exam)
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Includes all joints, spine, deformities &amp; gait
                </span>
              </div>

              {/* Quick joint template buttons */}
              <div className="mb-2 flex flex-wrap items-center gap-1">
                <span className="text-[11px] font-medium text-muted-foreground mr-1">Quick insert:</span>
                {[
                  { label: "Normal Joint Screening", search: "Full Joint" },
                  { label: "Knee", search: "Right knee: Medial" },
                  { label: "Shoulder", search: "Right shoulder: Painful" },
                  { label: "Lumbar Spine", search: "Lumbar spine: Tenderness" },
                  { label: "Cervical Spine", search: "Cervical spine: Tenderness" },
                  { label: "Hip & Pelvis", search: "Right hip: Groin" },
                  { label: "Elbow", search: "Tennis elbow" },
                  { label: "Wrist & Hand", search: "Carpal tunnel" },
                  { label: "Ankle & Foot", search: "ATFL sprain" },
                  { label: "Gait & Alignment", search: "Gait & Posture" },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => {
                      const match = JOINTS_AND_PARTS_EXAM_RECOMMENDATIONS.find((rec) =>
                        rec.toLowerCase().includes(chip.search.toLowerCase())
                      );
                      if (match) {
                        const current = (examination.jointsAndParts ?? examination.other ?? "").trim();
                        const next = current ? `${current}\n${match}` : match;
                        setExamination((prev) => ({
                          ...prev,
                          jointsAndParts: next,
                          other: next,
                        }));
                      }
                    }}
                    className="inline-flex items-center rounded-md border border-violet-300/70 bg-white px-2 py-0.5 text-[11px] font-medium text-violet-800 shadow-2xs hover:bg-violet-100/80 transition-colors dark:border-violet-800 dark:bg-violet-900/40 dark:text-violet-200 dark:hover:bg-violet-800/60"
                  >
                    + {chip.label}
                  </button>
                ))}
              </div>

              <ClinicalDropdownTextarea
                icon={faBone}
                label="Joints & body parts examination"
                name="jointsAndParts"
                value={examination.jointsAndParts ?? examination.other ?? ""}
                onChange={(text) => {
                  setExamination((prev) => ({
                    ...prev,
                    jointsAndParts: text,
                    other: text,
                  }));
                }}
                options={JOINTS_AND_PARTS_EXAM_RECOMMENDATIONS}
                placeholder="Examine all joints and parts: Knee, Shoulder, Spine, Hip, Elbow, Wrist/Hand, Ankle/Foot, TMJ, Gait, Posture, ROM, Stability tests…"
                rows={4}
              />
            </div>
          </div>
        </CollapsibleSection>
      </div>

      {/* COLUMN 1: ADVICE */}
      <div id="ws-advice" className="scroll-mt-2" tabIndex={-1}>
        <CollapsibleSection
          flush
          density="compact"
          contentClassName="px-3 py-3 md:px-4"
          title="Advice"
          icon={faClipboardList}
          iconColor="bg-emerald-500/15 text-emerald-600"
          summary={sectionSummary(completion.advice)}
          filled={completion.advice.filled}
        >
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/40 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                  <Icon icon={faClipboardList} className="size-3.5 text-emerald-600" />
                  Prescription Advice &amp; Patient Instructions (Printed on Rx)
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Synchronized with prescription advice
                </span>
              </div>
              <ClinicalDropdownTextarea
                icon={faClipboardList}
                label="Complete advice summary"
                name="advice"
                value={value.advice ?? ""}
                onChange={(text) =>
                  patchClinical(value, onChange, { advice: text })
                }
                options={ADVICE_RECOMMENDATIONS}
                placeholder="Advice, home precautions, exercises, follow-up timeline…"
                rows={3}
              />
            </div>

            <div className="grid gap-2.5 md:grid-cols-2">
              <ClinicalDropdownTextarea
                icon={faShieldHalved}
                label="General advice & daily precautions"
                name="generalAdvice"
                value={adviceDetails.generalAdvice ?? ""}
                onChange={(text) =>
                  updateRecordField(setAdviceDetails, "generalAdvice", text)
                }
                options={ADVICE_GENERAL_PRECAUTIONS}
                placeholder="Avoid squatting/cross-legged, ergonomics, western commode, footwear, lumbar belt…"
                rows={2}
              />
              <ClinicalDropdownTextarea
                icon={faHeartPulse}
                label="Physiotherapy & home exercises"
                name="physiotherapyExercises"
                value={adviceDetails.physiotherapyExercises ?? ""}
                onChange={(text) =>
                  updateRecordField(setAdviceDetails, "physiotherapyExercises", text)
                }
                options={ADVICE_PHYSIOTHERAPY_RECOMMENDATIONS}
                placeholder="Quadriceps isometrics, core stability, cervical exercises, rotator cuff rehab…"
                rows={2}
              />
              <ClinicalDropdownTextarea
                icon={faClockRotateLeft}
                label="Activity restrictions (Do's & Don'ts)"
                name="dosAndDonts"
                value={adviceDetails.dosAndDonts ?? ""}
                onChange={(text) =>
                  updateRecordField(setAdviceDetails, "dosAndDonts", text)
                }
                options={ADVICE_ACTIVITY_RESTRICTIONS}
                placeholder="No heavy weights, no forward bending, limit bumpy travel, posture breaks…"
                rows={2}
              />
              <ClinicalDropdownTextarea
                icon={faFileMedical}
                label="Diet, nutrition & bone health"
                name="dietAndLifestyle"
                value={adviceDetails.dietAndLifestyle ?? ""}
                onChange={(text) =>
                  updateRecordField(setAdviceDetails, "dietAndLifestyle", text)
                }
                options={ADVICE_DIET_LIFESTYLE_RECOMMENDATIONS}
                placeholder="Calcium/Vit D3 rich diet, morning sunlight, weight reduction target, hydration…"
                rows={2}
              />
            </div>

            <ClinicalDropdownTextarea
              icon={faTriangleExclamation}
              label="Warning signs & emergency red flags"
              name="warningSignsEmergency"
              value={adviceDetails.warningSignsEmergency ?? ""}
              onChange={(text) =>
                updateRecordField(setAdviceDetails, "warningSignsEmergency", text)
              }
              options={ADVICE_WARNING_SIGNS_RECOMMENDATIONS}
              placeholder="Cauda equina alert (loss of bladder control / foot drop), hot swollen septic joint alert, DVT warning…"
              rows={2}
            />
          </div>
        </CollapsibleSection>
      </div>

      {/* COLUMN 2: PLAN OF TREATMENT - SURGERY */}
      <div id="ws-treatment-plan" className="scroll-mt-2" tabIndex={-1}>
        <CollapsibleSection
          flush
          density="compact"
          contentClassName="px-3 py-3 md:px-4"
          title="Plan of treatment - surgery"
          icon={faBone}
          iconColor="bg-indigo-500/15 text-indigo-600"
          summary={sectionSummary(completion.treatmentPlan)}
          filled={completion.treatmentPlan.filled}
        >
          <div className="flex flex-col gap-3">
            {/* Treatment approach selector */}
            <div className="rounded-lg border border-indigo-200/80 bg-indigo-50/40 p-3 dark:border-indigo-900/50 dark:bg-indigo-950/20">
              <div className="mb-2.5">
                <ClinicalDropdownInput
                  label="Treatment approach / clinical pathway"
                  name="treatmentType"
                  value={treatmentPlan.treatmentType ?? ""}
                  onChange={(text) =>
                    updateRecordField(setTreatmentPlan, "treatmentType", text)
                  }
                  options={TREATMENT_PLAN_TYPE_RECOMMENDATIONS}
                  placeholder="Select or enter pathway (e.g. Conservative, Elective Surgery, Urgent Surgery)…"
                />
              </div>
              <label className="block text-xs font-semibold text-indigo-950 dark:text-indigo-200 mb-2">
                Quick pathway selector
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {[
                  {
                    id: "conservative",
                    label: "Conservative Management",
                    desc: "Medications + Physiotherapy",
                  },
                  {
                    id: "interventional",
                    label: "Interventions / Injections",
                    desc: "PRP / Hyaluronic Acid / Block",
                  },
                  {
                    id: "elective-surgery",
                    label: "Elective Surgery",
                    desc: "Planned Surgical Procedure",
                  },
                  {
                    id: "urgent-surgery",
                    label: "Urgent / Emergency Surgery",
                    desc: "Within 24-48h or Immediate",
                  },
                ].map((item) => {
                  const isSelected =
                    treatmentPlan.treatmentType?.toLowerCase().includes(item.id.replace("-", " ")) ||
                    treatmentPlan.treatmentType === item.label;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        updateRecordField(
                          setTreatmentPlan,
                          "treatmentType",
                          item.label
                        )
                      }
                      className={`text-left rounded-lg border p-2.5 transition-all text-xs ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-600 text-white shadow-xs font-semibold"
                          : "border-border bg-white hover:border-indigo-300 dark:bg-card text-ink"
                      }`}
                    >
                      <div className="font-semibold">{item.label}</div>
                      <div
                        className={`text-[11px] ${
                          isSelected ? "text-indigo-100" : "text-muted-foreground"
                        }`}
                      >
                        {item.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-2.5 md:grid-cols-2">
              <ClinicalDropdownInput
                label="Proposed surgery / procedure"
                name="proposedProcedure"
                value={treatmentPlan.proposedProcedure ?? ""}
                onChange={(text) =>
                  updateRecordField(setTreatmentPlan, "proposedProcedure", text)
                }
                options={TREATMENT_PLAN_PROCEDURE_RECOMMENDATIONS}
                placeholder="e.g. Total Knee Arthroplasty (TKA), ACL Reconstruction, MED Discectomy…"
              />
              <div className="grid grid-cols-2 gap-2">
                <ClinicalDropdownInput
                  label="Laterality / Site"
                  name="laterality"
                  value={treatmentPlan.laterality ?? ""}
                  onChange={(text) =>
                    updateRecordField(setTreatmentPlan, "laterality", text)
                  }
                  options={TREATMENT_PLAN_LATERALITY_RECOMMENDATIONS}
                  placeholder="Right, Left, Bilateral, Spine…"
                />
                <ClinicalDropdownInput
                  label="Anesthesia planned"
                  name="anesthesiaPlanned"
                  value={treatmentPlan.anesthesiaPlanned ?? ""}
                  onChange={(text) =>
                    updateRecordField(setTreatmentPlan, "anesthesiaPlanned", text)
                  }
                  options={TREATMENT_PLAN_ANESTHESIA_RECOMMENDATIONS}
                  placeholder="Spinal, GA, Block, Local…"
                />
              </div>
            </div>

            <div className="grid gap-2.5 md:grid-cols-2">
              <ClinicalDropdownInput
                label="Surgery timing & scheduling"
                name="timingOrDate"
                value={treatmentPlan.timingOrDate ?? ""}
                onChange={(text) =>
                  updateRecordField(setTreatmentPlan, "timingOrDate", text)
                }
                options={TREATMENT_PLAN_TIMING_RECOMMENDATIONS}
                placeholder="e.g. Elective within 1-2 weeks, Urgent within 48h…"
              />
              <ClinicalDropdownTextarea
                icon={faShieldHalved}
                label="Pre-operative clearance & PAC workup"
                name="preOpClearance"
                value={treatmentPlan.preOpClearance ?? ""}
                onChange={(text) =>
                  updateRecordField(setTreatmentPlan, "preOpClearance", text)
                }
                options={TREATMENT_PLAN_PREOP_RECOMMENDATIONS}
                placeholder="PAC clearance, CBC, Sugar, PT/INR, Echo, Chest X-ray, PRBC cross-matching…"
                rows={2}
              />
            </div>

            <div className="grid gap-2.5 md:grid-cols-2">
              <ClinicalDropdownTextarea
                icon={faBone}
                label="Implants, prostheses & hardware required"
                name="implantsAndHardware"
                value={treatmentPlan.implantsAndHardware ?? ""}
                onChange={(text) =>
                  updateRecordField(setTreatmentPlan, "implantsAndHardware", text)
                }
                options={TREATMENT_PLAN_IMPLANTS_RECOMMENDATIONS}
                placeholder="High-flexion knee prosthesis, titanium locking plate, suture anchors, TLIF cage…"
                rows={2}
              />
              <ClinicalDropdownTextarea
                icon={faHeartPulse}
                label="Post-operative rehabilitation & recovery protocol"
                name="postOpRehabPlan"
                value={treatmentPlan.postOpRehabPlan ?? ""}
                onChange={(text) =>
                  updateRecordField(setTreatmentPlan, "postOpRehabPlan", text)
                }
                options={TREATMENT_PLAN_REHAB_RECOMMENDATIONS}
                placeholder="Weight-bearing protocol, walker/crutches ambulation, brace, DVT prophylaxis, suture removal…"
                rows={2}
              />
            </div>

            <div className="grid gap-2.5 md:grid-cols-2">
              <ClinicalDropdownTextarea
                icon={faClipboard}
                label="Surgical counseling & informed consent notes"
                name="counselingAndConsent"
                value={treatmentPlan.counselingAndConsent ?? ""}
                onChange={(text) =>
                  updateRecordField(setTreatmentPlan, "counselingAndConsent", text)
                }
                options={TREATMENT_PLAN_COUNSELING_RECOMMENDATIONS}
                placeholder="Risks, benefits, complications explained; informed consent obtained…"
                rows={2}
              />
              <ClinicalDropdownTextarea
                icon={faFileMedical}
                label="Conservative / Non-surgical treatment plan"
                name="conservativePlan"
                value={treatmentPlan.conservativePlan ?? ""}
                onChange={(text) =>
                  updateRecordField(setTreatmentPlan, "conservativePlan", text)
                }
                options={TREATMENT_PLAN_CONSERVATIVE_RECOMMENDATIONS}
                placeholder="Medical management, supervised physical therapy, bracing, follow-up schedule…"
                rows={2}
              />
            </div>
          </div>
        </CollapsibleSection>
      </div>

      <div id="ws-notes" className="scroll-mt-2" tabIndex={-1}>
        <CollapsibleSection
          flush
          density="compact"
          contentClassName="px-3 py-3 md:px-4"
          title="Additional notes"
          icon={faNotesMedical}
          iconColor="bg-teal-500/15 text-teal-600"
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

type InvestigationSectionsProps = ClinicalSectionsProps & {
  previousLabsNote?: string;
  previousImagingNote?: string;
  previousOtherNote?: string;
};

export function InvestigationSections({
  value,
  onChange,
  previousLabsNote,
  previousImagingNote,
  previousOtherNote,
}: InvestigationSectionsProps) {
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
        title="Investigation findings & reports"
        icon={faFlaskVial}
        iconColor="bg-sky-500/15 text-sky-600"
        summary={sectionSummary(completion.investigationResults)}
        filled={completion.investigationResults.filled}
      >
        <div className="flex flex-col gap-2.5">
          <div>
            {previousLabsNote && !investigationResults.labs && (
              <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Prior visit labs available</span>
                <button
                  type="button"
                  onClick={() =>
                    updateRecordField(setInvestigationResults, "labs", previousLabsNote)
                  }
                  className="font-medium text-sky-600 hover:underline"
                >
                  + Insert prior labs
                </button>
              </div>
            )}
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
          </div>

          <div>
            {previousImagingNote && !investigationResults.imaging && (
              <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Prior visit imaging available</span>
                <button
                  type="button"
                  onClick={() =>
                    updateRecordField(setInvestigationResults, "imaging", previousImagingNote)
                  }
                  className="font-medium text-violet-600 hover:underline"
                >
                  + Insert prior imaging
                </button>
              </div>
            )}
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
          </div>

          <div>
            {previousOtherNote && !investigationResults.other && (
              <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Prior other investigations available</span>
                <button
                  type="button"
                  onClick={() =>
                    updateRecordField(setInvestigationResults, "other", previousOtherNote)
                  }
                  className="font-medium text-teal-600 hover:underline"
                >
                  + Insert prior other
                </button>
              </div>
            )}
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
        icon={faCertificate}
        iconColor="bg-orange-500/15 text-orange-600"
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

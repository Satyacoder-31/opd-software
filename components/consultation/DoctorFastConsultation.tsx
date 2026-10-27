"use client";

import { useEffect, useState, useTransition } from "react";
import {
  faBolt,
  faBone,
  faCheck,
  faCheckCircle,
  faClock,
  faCopy,
  faFileLines,
  faFlaskVial,
  faHeartPulse,
  faNotesMedical,
  faPills,
  faPlus,
  faRotate,
  faStethoscope,
  faTemperatureHalf,
  faTrashCan,
  faTriangleExclamation,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/shadcn/textarea";
import { MedicineCombobox } from "@/components/consultation/MedicineCombobox";
import {
  emptyMedicine,
} from "@/components/consultation/PrescriptionBuilder";
import {
  COMMON_ILLNESS_TEMPLATES,
  getClinicalTemplatesBySpecialty,
  type ClinicalTemplate,
} from "@/lib/clinical-templates";
import {
  getChiefComplaintRecommendations,
  getDiagnosisRecommendations,
  type ClinicalTreatmentMode,
} from "@/lib/clinical-recommendations";
import { listDrugSuggestions } from "@/actions/drug-catalog";
import {
  loadFavoriteMedicines,
  rememberRecentMedicine,
} from "@/lib/prescription-favorites";
import {
  applyDrugDefaults,
  type DrugSuggestion,
  findDrugSuggestion,
} from "@/lib/drug-catalog";
import { expandFrequencyInput } from "@/lib/prescription-dosing";
import type {
  ConsultationClinicalData,
  Medicine,
  PreviousVisitData,
  Vitals,
} from "@/lib/types";

// Popular fast-click symptom chips
const FAST_ORTHO_SYMPTOMS = [
  "Pain in right knee joint aggravated by walking",
  "Pain in left knee joint with morning stiffness",
  "Bilateral knee pain, difficulty squatting",
  "Severe low backache radiating to right leg (sciatica)",
  "Lower backache with lumbar muscle stiffness",
  "Neck pain with stiffness radiating to shoulder",
  "Right shoulder pain with restricted overhead movement",
  "Acute right ankle sprain and swelling after twist",
  "Bilateral heel pain, severe in morning (plantar fasciitis)",
] as const;

const FAST_GENERAL_SYMPTOMS = [
  "High grade fever with chills and generalized body ache for 3 days",
  "Dry cough with sore throat and runny nose",
  "Burning epigastric pain, acid regurgitation and bloating",
  "Watery loose stools with cramping abdominal pain",
  "Burning micturition with urinary frequency",
  "Generalized fatigue and muscle weakness",
] as const;

// Popular fast-click diagnosis chips
const FAST_ORTHO_DIAGNOSES = [
  "Bilateral Osteoarthritis Knee (Grade 2/3) with Joint Flare",
  "Osteoarthritis Right Knee Joint",
  "Lumbar Spondylosis with L4-L5 Radiculopathy (Sciatica)",
  "Acute Mechanical Lower Back Strain with Muscle Spasm",
  "Cervical Spondylosis with Trapezius Muscle Spasm",
  "Adhesive Capsulitis of Right Shoulder (Frozen Shoulder)",
  "Acute Lateral Ankle Ligament Sprain (Grade 1/2)",
  "Plantar Fasciitis (Bilateral)",
  "Lateral Epicondylitis (Tennis Elbow)",
] as const;

const FAST_GENERAL_DIAGNOSES = [
  "Acute Viral Upper Respiratory Tract Infection (URTI)",
  "Acute Gastroenteritis with Mild Dehydration",
  "Acid Peptic Disease / GERD / Gastritis",
  "Uncomplicated Urinary Tract Infection (UTI)",
  "Allergic Rhinitis & Sinusitis",
  "Essential Hypertension under evaluation",
] as const;

// Quick 1-click exam findings
const FAST_EXAM_CHIPS = [
  "Tenderness along medial joint line, crepitus on flexion",
  "Paravertebral muscle spasm present, SLR positive at 60°",
  "Cervical paraspinal tenderness, restricted lateral rotation",
  "Marked restriction of shoulder abduction and external rotation",
  "Localized edema and tenderness over anterior talofibular ligament",
  "Tender plantar fascia insertion at calcaneal tubercle",
  "Normal range of motion, no neurological deficit",
] as const;

// Quick 1-click advice chips
const FAST_ADVICE_CHIPS = [
  "Avoid squatting, sitting cross-legged, and frequent stair climbing",
  "Apply cold / ice pack for 15 minutes twice daily during acute flare",
  "Hot water fomentation twice daily before gentle stretching",
  "Start isometric quadriceps strengthening exercises daily",
  "Sleep on a firm mattress with knee support pillow",
  "Strictly avoid forward bending and lifting heavy weights",
  "Use contoured cervical pillow and lumbar back support",
  "Drink at least 3 liters of clean water daily",
] as const;

// Quick 1-click follow-up timeframes
const FAST_FOLLOW_UPS = [
  "Review after 3 days",
  "Review after 5 days",
  "Review after 7 days (1 week)",
  "Review after 10 days",
  "Review after 15 days",
  "Review after 1 month",
  "SOS if severe pain persists",
] as const;

// Rapid 1-click Dosing Presets for medicines
const RAPID_DOSING_PRESETS = [
  {
    label: "1-0-1 After food · 5d",
    hindi: "सुबह-शाम",
    dosage: "1 tablet",
    frequency: "Twice daily (1-0-1)",
    duration: "5 days",
    instructions: "After meals (खाने के बाद)",
  },
  {
    label: "1-0-0 Before food · 5d",
    hindi: "सुबह खाली पेट",
    dosage: "1 tablet",
    frequency: "Once daily - Morning (1-0-0)",
    duration: "5 days",
    instructions: "30 mins before breakfast (खाली पेट)",
  },
  {
    label: "0-0-1 Night · 5d",
    hindi: "रात को",
    dosage: "1 tablet",
    frequency: "Once daily - Night (0-0-1)",
    duration: "5 days",
    instructions: "At bedtime (सोते समय)",
  },
  {
    label: "1-1-1 After food · 3d",
    hindi: "दिन में 3 बार",
    dosage: "1 tablet",
    frequency: "Three times daily (1-1-1)",
    duration: "3 days",
    instructions: "After meals (खाने के बाद)",
  },
  {
    label: "1 Tab SOS for pain",
    hindi: "दर्द होने पर",
    dosage: "1 tablet",
    frequency: "As needed (SOS)",
    duration: "5 days",
    instructions: "Only when having pain (दर्द होने पर)",
  },
] as const;

type DoctorFastConsultationProps = {
  consultationId: string;
  patientId: string;
  patientName: string;
  uhid: string;
  episodeNo: string;
  clinical: ConsultationClinicalData;
  medicines: Medicine[];
  advice: string;
  followUp: string;
  treatmentMode: ClinicalTreatmentMode;
  onClinicalChange: (clinical: ConsultationClinicalData) => void;
  onMedicinesChange: (medicines: Medicine[]) => void;
  onAdviceChange: (advice: string) => void;
  onFollowUpChange: (followUp: string) => void;
  onTreatmentModeChange: (mode: ClinicalTreatmentMode) => void;
  onCompleteVisit: () => void;
  onSaveDraft: () => void;
  isSaving: boolean;
  isCompleting: boolean;
  onViewInvestigations?: () => void;
  onViewDocuments?: () => void;
  previousVisit?: PreviousVisitData | null;
  investigationHistoryCount?: number;
};

export function DoctorFastConsultation({
  consultationId,
  patientId,
  patientName,
  uhid,
  episodeNo,
  clinical,
  medicines,
  advice,
  followUp,
  treatmentMode,
  onClinicalChange,
  onMedicinesChange,
  onAdviceChange,
  onFollowUpChange,
  onTreatmentModeChange,
  onCompleteVisit,
  onSaveDraft,
  isSaving,
  isCompleting,
  onViewInvestigations,
  onViewDocuments,
  previousVisit,
  investigationHistoryCount = 0,
}: DoctorFastConsultationProps) {
  const [drugSuggestions, setDrugSuggestions] = useState<DrugSuggestion[]>([]);
  const [drugSuggestionsLoading, setDrugSuggestionsLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [templateNotice, setTemplateNotice] = useState<string | null>(null);

  // Load drugs catalog
  useEffect(() => {
    let active = true;
    void listDrugSuggestions().then((items) => {
      if (active) {
        setDrugSuggestions(items);
        setDrugSuggestionsLoading(false);
      }
    });
    setFavorites(loadFavoriteMedicines());
    return () => {
      active = false;
    };
  }, []);

  const vitals = (clinical.vitals as Vitals) ?? {};

  // Handle vitals change
  function handleVitalChange(field: keyof Vitals, val: string) {
    onClinicalChange({
      ...clinical,
      vitals: {
        ...vitals,
        [field]: val,
      },
    });
  }

  // Handle appending symptoms
  function handleAddSymptom(text: string) {
    const existing = clinical.chiefComplaint?.trim() ?? "";
    const next = existing ? `${existing}; ${text}` : text;
    onClinicalChange({ ...clinical, chiefComplaint: next });
  }

  // Handle setting diagnosis
  function handleSetDiagnosis(text: string) {
    onClinicalChange({ ...clinical, diagnosis: text });
  }

  // Handle exam notes
  function handleAddExamNote(text: string) {
    const existingExam = clinical.examination?.jointsAndParts?.trim() ?? "";
    const nextExam = existingExam ? `${existingExam}\n• ${text}` : `• ${text}`;
    onClinicalChange({
      ...clinical,
      examination: {
        ...clinical.examination,
        jointsAndParts: nextExam,
      },
    });
  }

  // Handle medicine modification
  function handleUpdateMedicine(index: number, patch: Partial<Medicine>) {
    const next = medicines.map((med, i) => (i === index ? { ...med, ...patch } : med));
    onMedicinesChange(next);
  }

  function handleAddMedicineRow() {
    onMedicinesChange([...medicines, emptyMedicine()]);
  }

  function handleRemoveMedicineRow(index: number) {
    const next = medicines.filter((_, i) => i !== index);
    onMedicinesChange(next.length > 0 ? next : [emptyMedicine()]);
  }

  function handleSelectDrugSuggestion(index: number, suggestion: DrugSuggestion) {
    rememberRecentMedicine(suggestion.name);
    const current = medicines[index] ?? emptyMedicine();
    const updated = applyDrugDefaults(current, suggestion.name, suggestion.defaults);
    handleUpdateMedicine(index, updated);
  }

  // Apply 1-Click Super Template
  function handleApplySuperTemplate(template: ClinicalTemplate) {
    // Fill symptoms, diagnosis, exam, medicines, advice, follow-up
    const nextClinical: ConsultationClinicalData = {
      ...clinical,
      chiefComplaint: template.chiefComplaint || clinical.chiefComplaint || template.name,
      diagnosis: template.diagnosis || clinical.diagnosis || template.name,
      examination: {
        ...clinical.examination,
        jointsAndParts: template.examination || clinical.examination?.jointsAndParts,
      },
      advice: template.advice || advice,
    };
    onClinicalChange(nextClinical);

    if (template.medicines && template.medicines.length > 0) {
      onMedicinesChange(
        template.medicines.map((m) => ({
          ...emptyMedicine(),
          ...m,
        }))
      );
    }
    if (template.advice) onAdviceChange(template.advice);
    if (template.followUp) onFollowUpChange(template.followUp);

    setTemplateNotice(
      `✓ Loaded "${template.name}" template with clinical findings, ${template.medicines.length} medicines, advice, and follow-up!`
    );
    setTimeout(() => setTemplateNotice(null), 5000);
  }

  // Apply Rapid Dosing Preset to a medicine
  function handleApplyDosingPreset(
    index: number,
    preset: (typeof RAPID_DOSING_PRESETS)[number]
  ) {
    handleUpdateMedicine(index, {
      dosage: preset.dosage,
      frequency: preset.frequency,
      duration: preset.duration,
      instructions: preset.instructions,
    });
  }

  const superTemplates = getClinicalTemplatesBySpecialty(treatmentMode);

  return (
    <div className="flex flex-col gap-3 p-3 md:p-4 max-w-7xl mx-auto">
      {/* 1-CLICK SUPER TEMPLATES BANNER */}
      <div className="rounded-2xl border-2 border-indigo-200/90 bg-gradient-to-r from-indigo-50/90 via-sky-50/70 to-indigo-50/90 p-3 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Icon icon={faWandMagicSparkles} className="size-3.5" />
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                1-Click Clinical Super Templates (सुपर टेम्पलेट्स)
              </span>
              <p className="text-[11px] text-slate-600">
                Click any condition below to instantly fill Complaints, Diagnosis, Examination, Medicines & Advice in 1 second!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Specialty:</span>
            <div className="inline-flex rounded-lg bg-white/90 p-0.5 border border-indigo-200">
              <button
                type="button"
                onClick={() => onTreatmentModeChange("orthopedics")}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  treatmentMode === "orthopedics"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🦴 Ortho
              </button>
              <button
                type="button"
                onClick={() => onTreatmentModeChange("general")}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  treatmentMode === "general"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🩺 General
              </button>
            </div>
          </div>
        </div>

        {/* Quick Template Buttons Carousel / Grid */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {superTemplates.slice(0, 7).map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => handleApplySuperTemplate(tpl)}
              className="group inline-flex items-center gap-1.5 rounded-xl border border-indigo-200/90 bg-white px-2.5 py-1.5 text-xs font-bold text-indigo-950 shadow-2xs hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-900 transition-all cursor-pointer active:scale-98"
            >
              <Icon icon={faBolt} className="size-3 text-amber-500 group-hover:scale-110 transition-transform" />
              <span>{tpl.name}</span>
              <span className="rounded bg-indigo-100/80 px-1 py-0.2 text-[9px] font-semibold text-indigo-700">
                {tpl.medicines.length} meds
              </span>
            </button>
          ))}
        </div>

        {templateNotice && (
          <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 animate-in fade-in">
            <Icon icon={faCheckCircle} className="size-3.5 text-emerald-600 shrink-0" />
            <span>{templateNotice}</span>
          </div>
        )}
      </div>

      {/* REVISIT NOTIFICATION (IF RETURNING PATIENT) */}
      {previousVisit && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-200 bg-sky-50/70 p-2.5 text-xs text-sky-950">
          <div className="flex items-center gap-2">
            <Icon icon={faRotate} className="size-3.5 text-sky-600 shrink-0" />
            <span>
              <strong>Returning Patient:</strong> Last visit on{" "}
              {new Date(previousVisit.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              {previousVisit.diagnosis ? ` · Diagnosed: ${previousVisit.diagnosis}` : ""}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (previousVisit.medicines && previousVisit.medicines.length > 0) {
                onMedicinesChange(previousVisit.medicines);
              }
              if (previousVisit.chiefComplaint) {
                onClinicalChange({
                  ...clinical,
                  chiefComplaint: previousVisit.chiefComplaint,
                  diagnosis: previousVisit.diagnosis || clinical.diagnosis,
                });
              }
              if (previousVisit.advice) onAdviceChange(previousVisit.advice);
            }}
            className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-sky-700 cursor-pointer"
          >
            <Icon icon={faCopy} className="size-3" />
            Copy Last Prescription & Findings
          </button>
        </div>
      )}

      {/* TOP COMPACT VITALS BAR */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-2xs">
        <div className="flex items-center gap-2 mb-1.5">
          <Icon icon={faHeartPulse} className="size-3 text-rose-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Quick Vitals (विटल्स - Optional)
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <div>
            <label className="text-[10px] font-semibold text-slate-500">BP (mmHg)</label>
            <Input
              value={vitals.bp ?? ""}
              onChange={(e) => handleVitalChange("bp", e.target.value)}
              placeholder="e.g. 120/80"
              className="h-8 text-xs font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500">Pulse (bpm)</label>
            <Input
              value={vitals.pulse ?? ""}
              onChange={(e) => handleVitalChange("pulse", e.target.value)}
              placeholder="e.g. 74"
              className="h-8 text-xs font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500">Weight (kg)</label>
            <Input
              value={vitals.weight ?? ""}
              onChange={(e) => handleVitalChange("weight", e.target.value)}
              placeholder="e.g. 68"
              className="h-8 text-xs font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500">SpO2 (%)</label>
            <Input
              value={vitals.spo2 ?? ""}
              onChange={(e) => handleVitalChange("spo2", e.target.value)}
              placeholder="e.g. 98"
              className="h-8 text-xs font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500">Temp (°F)</label>
            <Input
              value={vitals.temp ?? ""}
              onChange={(e) => handleVitalChange("temp", e.target.value)}
              placeholder="e.g. 98.6"
              className="h-8 text-xs font-bold"
            />
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID: CHIEF COMPLAINTS & DIAGNOSIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* CARD 1: CHIEF COMPLAINT */}
        <div className="rounded-xl border border-blue-200/80 bg-white p-3 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded-md bg-blue-100 text-blue-700">
                  <Icon icon={faStethoscope} className="size-3" />
                </span>
                <span className="text-xs font-bold text-slate-900">
                  Chief Complaints & Symptoms (मुख्य शिकायत / लक्षण)
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Click chips to add</span>
            </div>
            <Textarea
              value={clinical.chiefComplaint ?? ""}
              onChange={(e) => onClinicalChange({ ...clinical, chiefComplaint: e.target.value })}
              placeholder="e.g. Pain in right knee joint aggravated by walking for 2 weeks..."
              rows={3}
              className="text-xs font-medium resize-none leading-relaxed"
            />
          </div>

          {/* Quick symptom pills */}
          <div className="mt-2 flex flex-wrap gap-1">
            {(treatmentMode === "general" ? FAST_GENERAL_SYMPTOMS : FAST_ORTHO_SYMPTOMS)
              .slice(0, 6)
              .map((symp, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAddSymptom(symp)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-900 cursor-pointer transition-colors"
                >
                  <Icon icon={faPlus} className="size-2 text-blue-600" />
                  <span className="truncate max-w-[200px]">{symp}</span>
                </button>
              ))}
          </div>
        </div>

        {/* CARD 2: CLINICAL DIAGNOSIS */}
        <div className="rounded-xl border border-emerald-200/80 bg-white p-3 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                  <Icon icon={faNotesMedical} className="size-3" />
                </span>
                <span className="text-xs font-bold text-slate-900">
                  Clinical Diagnosis (निदान)
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Click chips to set</span>
            </div>
            <Input
              value={clinical.diagnosis ?? ""}
              onChange={(e) => onClinicalChange({ ...clinical, diagnosis: e.target.value })}
              placeholder="e.g. Bilateral Osteoarthritis Knee (Grade 2/3)"
              className="h-10 text-xs font-bold text-emerald-950"
            />
          </div>

          {/* Quick diagnosis pills */}
          <div className="mt-2 flex flex-wrap gap-1">
            {(treatmentMode === "general" ? FAST_GENERAL_DIAGNOSES : FAST_ORTHO_DIAGNOSES)
              .slice(0, 6)
              .map((diag, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSetDiagnosis(diag)}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50/60 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100 cursor-pointer transition-colors"
                >
                  <Icon icon={faCheck} className="size-2 text-emerald-600" />
                  <span className="truncate max-w-[220px]">{diag}</span>
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* QUICK EXAMINATION & LOCAL FINDINGS (COMPACT) */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="flex size-5 items-center justify-center rounded-md bg-amber-100 text-amber-700">
              <Icon icon={faBone} className="size-3" />
            </span>
            <span className="text-xs font-bold text-slate-900">
              Examination & Joint Findings (शारीरिक एवं जोड़ जांच)
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Optional</span>
        </div>
        <Textarea
          value={clinical.examination?.jointsAndParts ?? ""}
          onChange={(e) =>
            onClinicalChange({
              ...clinical,
              examination: {
                ...clinical.examination,
                jointsAndParts: e.target.value,
              },
            })
          }
          placeholder="e.g. Medial joint line tenderness present, palpable crepitus on passive flexion, range of motion 0-110°..."
          rows={2}
          className="text-xs font-medium resize-none leading-relaxed"
        />
        <div className="mt-1.5 flex flex-wrap gap-1">
          {FAST_EXAM_CHIPS.slice(0, 5).map((chip, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleAddExamNote(chip)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-900 cursor-pointer"
            >
              <Icon icon={faPlus} className="size-2 text-amber-600" />
              <span className="truncate max-w-[240px]">{chip}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CARD 4: MEDICINES & PRESCRIPTION (Rx) - THE DOCTOR'S HEART */}
      <div className="rounded-2xl border-2 border-violet-200/90 bg-white p-3 md:p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80 mb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-xl bg-violet-600 text-white shadow-xs">
              <Icon icon={faPills} className="size-3.5" />
            </span>
            <div>
              <span className="text-sm font-extrabold text-slate-950">
                Prescription Medicines (दवाइयाँ - Rx)
              </span>
              <p className="text-[11px] text-slate-500">
                {medicines.filter((m) => m.name?.trim()).length} medicine(s) prescribed · Use 1-click dosing buttons below
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleAddMedicineRow}
            className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs"
          >
            <Icon icon={faPlus} className="size-3" />
            Add Medicine
          </Button>
        </div>

        {/* MEDICINE ROWS */}
        <div className="space-y-3">
          {medicines.map((med, index) => {
            const matchedDrug = med.name?.trim()
              ? findDrugSuggestion(drugSuggestions, med.name)
              : null;
            const stock = matchedDrug?.stockQuantity;
            const reorder = matchedDrug?.reorderLevel ?? 10;

            return (
              <div
                key={index}
                className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-2.5 transition-all hover:border-violet-300"
              >
                {/* Row Header: Number, Drug Name, Remove */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-800 text-xs font-bold">
                    #{index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <MedicineCombobox
                      name={`fast-med-${index}`}
                      value={med.name}
                      onChange={(value) => handleUpdateMedicine(index, { name: value })}
                      onSelectMedicine={(suggestion) => handleSelectDrugSuggestion(index, suggestion)}
                      suggestions={drugSuggestions}
                      loading={drugSuggestionsLoading}
                      favorites={favorites}
                      onFavoritesChange={setFavorites}
                    />
                  </div>
                  {medicines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMedicineRow(index)}
                      className="size-8 shrink-0 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                      title="Remove medicine"
                    >
                      <Icon icon={faTrashCan} className="size-3.5" />
                    </button>
                  )}
                </div>

                {/* Stock Indicator if matched */}
                {matchedDrug && stock !== undefined && (
                  <div className="mb-2 pl-8 flex items-center gap-2 text-[11px]">
                    <span className="font-semibold text-slate-500">Stock:</span>
                    {stock > reorder ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.2 font-bold text-emerald-800">
                        ✓ {stock} in pharmacy
                      </span>
                    ) : stock > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.2 font-bold text-amber-800">
                        ⚠ Low stock: {stock} left
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.2 font-bold text-rose-800">
                        ✕ Out of stock
                      </span>
                    )}
                    {matchedDrug.unitPrice && (
                      <span className="text-slate-400">· MRP: ₹{matchedDrug.unitPrice}</span>
                    )}
                  </div>
                )}

                {/* 1-CLICK RAPID DOSING PRESETS (1 TAP FILLS DOSE, FREQ, DUR, INSTRUCTIONS) */}
                <div className="mb-2 pl-8 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-violet-700 uppercase">⚡ 1-Tap Dose:</span>
                  {RAPID_DOSING_PRESETS.map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => handleApplyDosingPreset(index, preset)}
                      className="inline-flex items-center gap-1 rounded-md border border-violet-200/90 bg-white px-2 py-0.5 text-[10px] font-bold text-violet-900 hover:bg-violet-100 hover:border-violet-400 cursor-pointer transition-all active:scale-95"
                    >
                      <span>{preset.label}</span>
                      <span className="text-[9px] text-violet-500 font-medium">({preset.hindi})</span>
                    </button>
                  ))}
                </div>

                {/* Granular input fields */}
                <div className="pl-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500">Dose</label>
                    <Input
                      value={med.dosage}
                      onChange={(e) => handleUpdateMedicine(index, { dosage: e.target.value })}
                      placeholder="1 tablet"
                      className="h-8 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500">Frequency</label>
                    <Input
                      value={med.frequency}
                      onChange={(e) =>
                        handleUpdateMedicine(index, {
                          frequency: expandFrequencyInput(e.target.value),
                        })
                      }
                      placeholder="1-0-1 or Twice daily"
                      className="h-8 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500">Duration</label>
                    <Input
                      value={med.duration}
                      onChange={(e) => handleUpdateMedicine(index, { duration: e.target.value })}
                      placeholder="5 days"
                      className="h-8 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500">Instructions</label>
                    <Input
                      value={med.instructions ?? ""}
                      onChange={(e) => handleUpdateMedicine(index, { instructions: e.target.value })}
                      placeholder="After food (खाने के बाद)"
                      className="h-8 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Big Add Medicine CTA */}
        <div className="mt-3 text-center">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddMedicineRow}
            className="w-full border-dashed border-2 border-violet-300 py-3 text-xs font-bold text-violet-700 hover:bg-violet-50"
          >
            <Icon icon={faPlus} className="size-3 mr-1" />
            + Add Another Medicine Row
          </Button>
        </div>
      </div>

      {/* CARD 5: ADVICE & FOLLOW-UP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* ADVICE */}
        <div className="rounded-xl border border-amber-200/90 bg-white p-3 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="flex size-5 items-center justify-center rounded-md bg-amber-100 text-amber-800">
                <Icon icon={faNotesMedical} className="size-3" />
              </span>
              <span className="text-xs font-bold text-slate-900">
                Doctor's Advice & Precautions (परामर्श एवं सावधानियां)
              </span>
            </div>
            <Textarea
              value={advice}
              onChange={(e) => onAdviceChange(e.target.value)}
              placeholder="e.g. Avoid squatting and sitting on floor. Warm water fomentation twice daily..."
              rows={3}
              className="text-xs font-medium resize-none leading-relaxed"
            />
          </div>
          {/* Quick advice chips */}
          <div className="mt-2 flex flex-wrap gap-1">
            {FAST_ADVICE_CHIPS.slice(0, 5).map((adv, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  const existing = advice?.trim() ?? "";
                  onAdviceChange(existing ? `${existing}\n• ${adv}` : `• ${adv}`);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:border-amber-400 hover:bg-amber-50 cursor-pointer"
              >
                <Icon icon={faPlus} className="size-2 text-amber-600" />
                <span className="truncate max-w-[220px]">{adv}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FOLLOW-UP */}
        <div className="rounded-xl border border-sky-200/90 bg-white p-3 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="flex size-5 items-center justify-center rounded-md bg-sky-100 text-sky-800">
                <Icon icon={faClock} className="size-3" />
              </span>
              <span className="text-xs font-bold text-slate-900">
                Follow-Up Timeframe (अगला परामर्श)
              </span>
            </div>
            <Input
              value={followUp}
              onChange={(e) => onFollowUpChange(e.target.value)}
              placeholder="e.g. Review after 7 days"
              className="h-10 text-xs font-bold text-sky-950"
            />
          </div>
          {/* Quick follow up chips */}
          <div className="mt-2 flex flex-wrap gap-1">
            {FAST_FOLLOW_UPS.map((f, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onFollowUpChange(f)}
                className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-800 hover:bg-sky-100 cursor-pointer"
              >
                <Icon icon={faCheck} className="size-2 text-sky-600" />
                <span>{f}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* QUICK DRAWER LINKS FOR LABS & DOCUMENTS */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">Need Advanced Records?</span>
          <span className="text-slate-500">Quickly jump to investigations or certificates:</span>
        </div>
        <div className="flex items-center gap-2">
          {onViewInvestigations && (
            <button
              type="button"
              onClick={onViewInvestigations}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 hover:border-sky-500 hover:text-sky-700 shadow-2xs cursor-pointer"
            >
              <Icon icon={faFlaskVial} className="size-3 text-sky-600" />
              <span>Lab Orders & Past X-Rays {investigationHistoryCount > 0 ? `(${investigationHistoryCount})` : ""}</span>
            </button>
          )}
          {onViewDocuments && (
            <button
              type="button"
              onClick={onViewDocuments}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 hover:border-orange-500 hover:text-orange-700 shadow-2xs cursor-pointer"
            >
              <Icon icon={faFileLines} className="size-3 text-orange-600" />
              <span>Medical Certificate / Referral</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

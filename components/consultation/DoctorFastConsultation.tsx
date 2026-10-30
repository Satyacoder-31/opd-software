"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  faBolt,
  faBone,
  faCheck,
  faCheckCircle,
  faChevronDown,
  faChevronUp,
  faClock,
  faCopy,
  faEye,
  faFileContract,
  faFileLines,
  faFlaskVial,
  faHeartPulse,
  faMagnifyingGlass,
  faNotesMedical,
  faPills,
  faPlus,
  faPrint,
  faRotate,
  faStar,
  faStethoscope,
  faTemperatureHalf,
  faTrashCan,
  faTriangleExclamation,
  faWandMagicSparkles,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/shadcn/textarea";
import { MedicineCombobox } from "@/components/consultation/MedicineCombobox";
import {
  emptyMedicine,
} from "@/components/consultation/PrescriptionBuilder";
import { useClinicalRecommendations } from "@/lib/clinical-recommendations-storage";
import { PrescriptionViewModal } from "@/components/consultation/PrescriptionViewModal";
import { PatientSummaryModal } from "@/components/consultation/PatientSummaryModal";
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

export type QuickTag = {
  label: string;
  text: string;
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Crisp, readable symptom tags (short label + rich clinical text)
const FAST_ORTHO_SYMPTOMS: QuickTag[] = [
  { label: "Right Knee Pain", text: "Pain in right knee joint aggravated by walking" },
  { label: "Left Knee Pain", text: "Pain in left knee joint with morning stiffness" },
  { label: "Bilateral Knee", text: "Bilateral knee pain, difficulty squatting" },
  { label: "Low Backache", text: "Severe low backache radiating to right leg (sciatica)" },
  { label: "Lumbar Spasm", text: "Lower backache with lumbar muscle stiffness and spasm" },
  { label: "Neck & Shoulder", text: "Neck pain with stiffness radiating to shoulder" },
  { label: "Frozen Shoulder", text: "Right shoulder pain with restricted overhead movement" },
  { label: "Ankle Sprain", text: "Acute right ankle sprain and swelling after twist" },
  { label: "Heel Pain (Morning)", text: "Bilateral heel pain, severe in morning (plantar fasciitis)" },
];

const FAST_GENERAL_SYMPTOMS: QuickTag[] = [
  { label: "Fever & Chills", text: "High grade fever with chills and generalized body ache for 3 days" },
  { label: "Cough & Cold", text: "Dry cough with sore throat and runny nose" },
  { label: "Acidity / GERD", text: "Burning epigastric pain, acid regurgitation and bloating" },
  { label: "Loose Stools", text: "Watery loose stools with cramping abdominal pain" },
  { label: "Burning Urination", text: "Burning micturition with urinary frequency" },
  { label: "Fatigue / Weakness", text: "Generalized fatigue and muscle weakness" },
];

// Crisp, readable diagnosis tags (short label + rich clinical text)
const FAST_ORTHO_DIAGNOSES: QuickTag[] = [
  { label: "Bilateral Knee OA", text: "Bilateral Osteoarthritis Knee (Grade 2/3) with Joint Flare" },
  { label: "Right Knee OA", text: "Osteoarthritis Right Knee Joint" },
  { label: "Lumbar Spondylosis", text: "Lumbar Spondylosis with L4-L5 Radiculopathy (Sciatica)" },
  { label: "Acute Back Strain", text: "Acute Mechanical Lower Back Strain with Muscle Spasm" },
  { label: "Cervical Spondylosis", text: "Cervical Spondylosis with Trapezius Muscle Spasm" },
  { label: "Frozen Shoulder", text: "Adhesive Capsulitis of Right Shoulder (Frozen Shoulder)" },
  { label: "Ankle Sprain", text: "Acute Lateral Ankle Ligament Sprain (Grade 1/2)" },
  { label: "Plantar Fasciitis", text: "Plantar Fasciitis (Bilateral)" },
  { label: "Tennis Elbow", text: "Lateral Epicondylitis (Tennis Elbow)" },
];

const FAST_GENERAL_DIAGNOSES: QuickTag[] = [
  { label: "Viral URTI / Flu", text: "Acute Viral Upper Respiratory Tract Infection (URTI)" },
  { label: "Gastroenteritis", text: "Acute Gastroenteritis with Mild Dehydration" },
  { label: "Acid Peptic / GERD", text: "Acid Peptic Disease / GERD / Gastritis" },
  { label: "UTI Infection", text: "Uncomplicated Urinary Tract Infection (UTI)" },
  { label: "Allergic Rhinitis", text: "Allergic Rhinitis & Sinusitis" },
  { label: "Hypertension (Eval)", text: "Essential Hypertension under evaluation" },
];

// Crisp, readable exam finding tags
const FAST_EXAM_CHIPS: QuickTag[] = [
  { label: "Knee OA (Crepitus/Tender)", text: "Medial joint line tenderness (+), joint crepitus on passive flexion, ROM 0-110°, no joint effusion." },
  { label: "Lumbar Spasm (SLR+)", text: "Paravertebral muscle spasm present, tenderness at L4-L5, SLR positive at 60°." },
  { label: "Cervical Paraspinal Spasm", text: "Cervical paraspinal tenderness, restricted lateral rotation, Spurling test negative." },
  { label: "Shoulder Restricted ROM", text: "Marked restriction of shoulder abduction and external rotation, subacromial tenderness (+)." },
  { label: "Ankle ATFL Sprain", text: "Localized edema and tenderness over anterior talofibular ligament, anterior drawer negative." },
  { label: "Heel Tenderness (Plantar)", text: "Tender plantar fascia insertion at calcaneal tubercle, Windlass test positive." },
];

// Crisp, readable advice tags
const FAST_ADVICE_CHIPS: QuickTag[] = [
  { label: "Avoid Squatting/Stairs", text: "Avoid squatting, sitting cross-legged, and frequent stair climbing." },
  { label: "Ice Pack (15 min)", text: "Apply cold / ice pack for 15 minutes twice daily during acute flare." },
  { label: "Hot Water Fomentation", text: "Hot water fomentation twice daily before gentle stretching." },
  { label: "Quad Exercises", text: "Start isometric quadriceps strengthening exercises daily." },
  { label: "Firm Bed / Knee Pillow", text: "Sleep on a firm mattress with knee support pillow." },
  { label: "No Heavy Lifting", text: "Strictly avoid forward bending and lifting heavy weights." },
  { label: "Cervical Pillow", text: "Use contoured cervical pillow and lumbar back support." },
  { label: "Drink 3L Water", text: "Drink at least 3 liters of clean water daily." },
];

// Crisp follow-up timeframes
const FAST_FOLLOW_UPS: QuickTag[] = [
  { label: "3 Days", text: "Review after 3 days" },
  { label: "5 Days", text: "Review after 5 days" },
  { label: "7 Days (1 Wk)", text: "Review after 7 days (1 week)" },
  { label: "10 Days", text: "Review after 10 days" },
  { label: "15 Days", text: "Review after 15 days" },
  { label: "1 Month", text: "Review after 1 month" },
  { label: "SOS / If Needed", text: "SOS if severe pain persists or symptoms worsen" },
];

// Rapid 1-click Dosing Presets for medicines
const RAPID_DOSING_PRESETS = [
  {
    label: "1-0-1 After food · 5d",
    subtext: "Twice daily",
    dosage: "1 tablet",
    frequency: "Twice daily (1-0-1)",
    duration: "5 days",
    instructions: "After meals",
  },
  {
    label: "1-0-0 Before food · 5d",
    subtext: "Morning empty stomach",
    dosage: "1 tablet",
    frequency: "Once daily - Morning (1-0-0)",
    duration: "5 days",
    instructions: "30 mins before breakfast",
  },
  {
    label: "0-0-1 Night · 5d",
    subtext: "At bedtime",
    dosage: "1 tablet",
    frequency: "Once daily - Night (0-0-1)",
    duration: "5 days",
    instructions: "At bedtime",
  },
  {
    label: "1-1-1 After food · 3d",
    subtext: "Three times daily",
    dosage: "1 tablet",
    frequency: "Three times daily (1-1-1)",
    duration: "3 days",
    instructions: "After meals",
  },
  {
    label: "1 Tab SOS for pain",
    subtext: "When having pain",
    dosage: "1 tablet",
    frequency: "As needed (SOS)",
    duration: "5 days",
    instructions: "When having pain",
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

  // Modals for Prescription View & Apollo Outpatient Summary
  const [isRxViewOpen, setIsRxViewOpen] = useState(false);
  const [rxModalLang, setRxModalLang] = useState<"en" | "hi">("en");
  const [isSummaryViewOpen, setIsSummaryViewOpen] = useState(false);

  // Suggestion Dropdown States
  const [symptomsMenuOpen, setSymptomsMenuOpen] = useState(false);
  const [symptomSearch, setSymptomSearch] = useState("");
  const [newComplaintInput, setNewComplaintInput] = useState("");
  const [complaintNotice, setComplaintNotice] = useState<string | null>(null);
  const symptomsRef = useRef<HTMLDivElement>(null);

  const [diagnosisMenuOpen, setDiagnosisMenuOpen] = useState(false);
  const [newDiagnosisInput, setNewDiagnosisInput] = useState("");
  const [diagnosisNotice, setDiagnosisNotice] = useState<string | null>(null);
  const diagnosisRef = useRef<HTMLDivElement>(null);

  const [examMenuOpen, setExamMenuOpen] = useState(false);
  const [newExamInput, setNewExamInput] = useState("");
  const [examNotice, setExamNotice] = useState<string | null>(null);
  const examRef = useRef<HTMLDivElement>(null);

  const [adviceMenuOpen, setAdviceMenuOpen] = useState(false);
  const [adviceFilter, setAdviceFilter] = useState("");
  const [newAdviceInput, setNewAdviceInput] = useState("");
  const [adviceNotice, setAdviceNotice] = useState<string | null>(null);
  const adviceRef = useRef<HTMLDivElement>(null);

  const [showCustomHistory, setShowCustomHistory] = useState(false);
  const [customHistoryInput, setCustomHistoryInput] = useState("");

  // Default preset lists
  const defaultSymptomsList = useMemo(() => {
    const list =
      treatmentMode === "general"
        ? [...FAST_GENERAL_SYMPTOMS, ...FAST_ORTHO_SYMPTOMS]
        : [...FAST_ORTHO_SYMPTOMS, ...FAST_GENERAL_SYMPTOMS];
    return list.map((c) => c.text);
  }, [treatmentMode]);

  const defaultDiagnosisList = useMemo(() => {
    const list =
      treatmentMode === "general"
        ? [...FAST_GENERAL_DIAGNOSES, ...FAST_ORTHO_DIAGNOSES]
        : [...FAST_ORTHO_DIAGNOSES, ...FAST_GENERAL_DIAGNOSES];
    return list.map((c) => c.text);
  }, [treatmentMode]);

  const defaultExamList = useMemo(() => FAST_EXAM_CHIPS.map((c) => c.text), []);
  const defaultAdviceList = useMemo(() => FAST_ADVICE_CHIPS.map((c) => c.text), []);

  // Clinical Recommendations Hooks (Syncs across Fast OPD & Full Hospital Tabs)
  const {
    allOptions: complaintsOptions,
    isFavorite: isComplaintFavorite,
    isCustom: isComplaintCustom,
    addCustom: addCustomComplaint,
    removeCustom: removeCustomComplaint,
    toggleFavorite: toggleComplaintFavorite,
  } = useClinicalRecommendations("chief_complaint", defaultSymptomsList);

  const {
    allOptions: diagnosisOptions,
    isFavorite: isDiagnosisFavorite,
    isCustom: isDiagnosisCustom,
    addCustom: addCustomDiagnosis,
    removeCustom: removeCustomDiagnosis,
    toggleFavorite: toggleDiagnosisFavorite,
  } = useClinicalRecommendations("diagnosis", defaultDiagnosisList);

  const {
    allOptions: examOptions,
    isFavorite: isExamFavorite,
    isCustom: isExamCustom,
    addCustom: addCustomExam,
    removeCustom: removeCustomExam,
    toggleFavorite: toggleExamFavorite,
  } = useClinicalRecommendations("examination", defaultExamList);

  const {
    allOptions: adviceOptions,
    isFavorite: isAdviceFavorite,
    isCustom: isAdviceCustom,
    addCustom: addCustomAdvice,
    removeCustom: removeCustomAdvice,
    toggleFavorite: toggleAdviceFavorite,
  } = useClinicalRecommendations("advice", defaultAdviceList);

  // Click outside listener for suggestion menus
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (symptomsRef.current && !symptomsRef.current.contains(target)) {
        setSymptomsMenuOpen(false);
      }
      if (diagnosisRef.current && !diagnosisRef.current.contains(target)) {
        setDiagnosisMenuOpen(false);
      }
      if (examRef.current && !examRef.current.contains(target)) {
        setExamMenuOpen(false);
      }
      if (adviceRef.current && !adviceRef.current.contains(target)) {
        setAdviceMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered symptoms for the dropdown search
  const filteredSymptoms = useMemo(() => {
    const q = symptomSearch.trim().toLowerCase();
    if (!q) return complaintsOptions;
    return complaintsOptions.filter((s) => s.toLowerCase().includes(q));
  }, [symptomSearch, complaintsOptions]);

  // Filtered diagnoses for auto-suggest
  const filteredDiagnoses = useMemo(() => {
    const q = (clinical.diagnosis ?? "").trim().toLowerCase();
    if (!q) return diagnosisOptions;
    return diagnosisOptions.filter((d) => d.toLowerCase().includes(q));
  }, [clinical.diagnosis, diagnosisOptions]);

  // Filtered advice for dropdown
  const filteredAdvice = useMemo(() => {
    const q = adviceFilter.trim().toLowerCase();
    if (!q) return adviceOptions;
    return adviceOptions.filter((a) => a.toLowerCase().includes(q));
  }, [adviceFilter, adviceOptions]);

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

  // Handle toggling symptoms (append or remove cleanly)
  function handleToggleSymptom(tag: QuickTag) {
    const current = clinical.chiefComplaint?.trim() ?? "";
    if (current.includes(tag.text)) {
      const next = current
        .replace(new RegExp(`;?\\s*${escapeRegex(tag.text)}`, "g"), "")
        .replace(/^;\s*/, "")
        .trim();
      onClinicalChange({ ...clinical, chiefComplaint: next });
    } else {
      const next = current ? `${current}; ${tag.text}` : tag.text;
      onClinicalChange({ ...clinical, chiefComplaint: next });
    }
  }

  // Handle setting/clearing diagnosis
  function handleSelectDiagnosis(tag: QuickTag) {
    const current = clinical.diagnosis?.trim() ?? "";
    if (current.toLowerCase() === tag.text.toLowerCase()) {
      onClinicalChange({ ...clinical, diagnosis: "" });
    } else {
      onClinicalChange({ ...clinical, diagnosis: tag.text });
    }
  }

  // Handle toggling exam notes
  function handleToggleExamNote(tag: QuickTag) {
    const current = clinical.examination?.jointsAndParts?.trim() ?? "";
    if (current.includes(tag.text)) {
      const next = current
        .replace(new RegExp(`\\n?•?\\s*${escapeRegex(tag.text)}`, "g"), "")
        .trim();
      onClinicalChange({
        ...clinical,
        examination: {
          ...clinical.examination,
          jointsAndParts: next,
        },
      });
    } else {
      const next = current ? `${current}\n• ${tag.text}` : `• ${tag.text}`;
      onClinicalChange({
        ...clinical,
        examination: {
          ...clinical.examination,
          jointsAndParts: next,
        },
      });
    }
  }

  // 1-Click Normal Examination (NAD)
  function handleSetNormalExam() {
    onClinicalChange({
      ...clinical,
      examination: {
        ...clinical.examination,
        jointsAndParts:
          "No localized joint swelling, effusion or deformity. Full painless active & passive range of motion. No motor or sensory neurological deficit. Normal examination (NAD).",
      },
    });
  }

  // Handle toggling advice
  function handleToggleAdvice(tag: QuickTag) {
    const current = advice?.trim() ?? "";
    if (current.includes(tag.text)) {
      const next = current
        .replace(new RegExp(`\\n?•?\\s*${escapeRegex(tag.text)}`, "g"), "")
        .trim();
      onAdviceChange(next);
    } else {
      const next = current ? `${current}\n• ${tag.text}` : `• ${tag.text}`;
      onAdviceChange(next);
    }
  }

  // Handle follow up selection
  function handleSelectFollowUp(tag: QuickTag) {
    if (followUp?.trim().toLowerCase() === tag.text.toLowerCase()) {
      onFollowUpChange("");
    } else {
      onFollowUpChange(tag.text);
    }
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
    const updated = applyDrugDefaults(
      current,
      suggestion.name,
      suggestion.defaults,
      suggestion.genericName
    );
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
      {/* TOP ACTION BAR: VIEW PRESCRIPTION & OUTPATIENT SUMMARY */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-teal-500 text-white font-bold text-sm shadow-xs">
            ⚡
          </span>
          <div>
            <div className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Doctor Fast OPD Workspace</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Patient: <strong className="text-slate-700">{patientName}</strong> ({uhid}) · Episode: {episodeNo}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setRxModalLang("en");
              setIsRxViewOpen(true);
            }}
            className="h-8 gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50/80 border-indigo-200 hover:bg-indigo-100 shadow-2xs cursor-pointer"
            title="View full prescription in English"
          >
            <Icon icon={faEye} className="size-3 text-indigo-600" />
            <span>View Rx (EN)</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setRxModalLang("hi");
              setIsRxViewOpen(true);
            }}
            className="h-8 gap-1.5 text-xs font-bold text-teal-800 bg-teal-50/80 border-teal-200 hover:bg-teal-100 shadow-2xs cursor-pointer"
            title="चिकित्सीय पर्चा हिंदी में देखें (Hindi Prescription Preview)"
          >
            <Icon icon={faEye} className="size-3 text-teal-600" />
            <span>पर्चा देखें (Hindi)</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsSummaryViewOpen(true)}
            className="h-8 gap-1.5 text-xs font-bold text-teal-800 bg-teal-50/80 border-teal-200 hover:bg-teal-100 shadow-2xs cursor-pointer"
            title="View Apollo standard Outpatient Summary & Prescription"
          >
            <Icon icon={faFileContract} className="size-3 text-teal-600" />
            <span>Outpatient Summary</span>
          </Button>
        </div>
      </div>

      {/* 1-CLICK SUPER TEMPLATES BANNER */}
      <div className="rounded-2xl border-2 border-indigo-200/90 bg-gradient-to-r from-indigo-50/90 via-sky-50/70 to-indigo-50/90 p-3 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Icon icon={faWandMagicSparkles} className="size-3.5" />
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                Clinical Quick Templates
              </span>
              <p className="text-[11px] text-slate-600">
                Select a condition below to quickly prefill complaints, diagnosis, examination, medicines & advice.
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
            Quick Vitals
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

        {/* PAST MEDICAL & SURGICAL HISTORY */}
        {(() => {
          const rawPast = clinical.patientHistory?.pastMedical;
          const currentPastMedical =
            rawPast !== undefined ? rawPast.trim() : "No DM, No HTN, No surgery";
          const hasPastMedical = Boolean(currentPastMedical);

          const presetTags = [
            "No DM, No HTN, No surgery",
            "Known HTN",
            "Known DM",
            "No past surgery",
            "Prior surgery",
            "Asthma / Allergy",
          ];

          return (
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Past History:
                </span>
                {hasPastMedical ? (
                  <span className="text-xs font-semibold text-slate-800">
                    {currentPastMedical}
                  </span>
                ) : (
                  <span className="text-xs italic text-slate-400">
                    None (Removed)
                  </span>
                )}
                {hasPastMedical && (
                  <button
                    type="button"
                    onClick={() => {
                      onClinicalChange({
                        ...clinical,
                        patientHistory: {
                          ...(clinical.patientHistory ?? {}),
                          pastMedical: "",
                        },
                      });
                    }}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border border-rose-200/60"
                    title="Remove / Clear past history"
                  >
                    <Icon icon={faTrashCan} className="size-2.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {presetTags.map((tag) => {
                  const isActive =
                    tag === "No DM, No HTN, No surgery"
                      ? currentPastMedical === "No DM, No HTN, No surgery"
                      : currentPastMedical.includes(tag) &&
                        currentPastMedical !== "No DM, No HTN, No surgery";

                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        let next = "";
                        if (tag === "No DM, No HTN, No surgery") {
                          if (currentPastMedical === "No DM, No HTN, No surgery") {
                            next = "";
                          } else {
                            next = "No DM, No HTN, No surgery";
                          }
                        } else {
                          if (currentPastMedical === "No DM, No HTN, No surgery") {
                            next = tag;
                          } else if (currentPastMedical.includes(tag)) {
                            const remaining = currentPastMedical
                              .split(";")
                              .map((s) => s.trim())
                              .filter(
                                (s) =>
                                  s &&
                                  s !== tag &&
                                  s !== "No DM, No HTN, No surgery"
                              );
                            next = remaining.join("; ");
                          } else {
                            const existing = currentPastMedical
                              .split(";")
                              .map((s) => s.trim())
                              .filter((s) => s && s !== "No DM, No HTN, No surgery");
                            existing.push(tag);
                            next = existing.join("; ");
                          }
                        }
                        onClinicalChange({
                          ...clinical,
                          patientHistory: {
                            ...(clinical.patientHistory ?? {}),
                            pastMedical: next,
                          },
                        });
                      }}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                        isActive
                          ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {isActive && tag !== "No DM, No HTN, No surgery" ? `✓ ${tag}` : tag}
                    </button>
                  );
                })}

                {showCustomHistory ? (
                  <div className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      value={customHistoryInput}
                      onChange={(e) => setCustomHistoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = customHistoryInput.trim();
                          if (val) {
                            const existing =
                              currentPastMedical &&
                              currentPastMedical !== "No DM, No HTN, No surgery"
                                ? currentPastMedical
                                    .split(";")
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                                : [];
                            existing.push(val);
                            onClinicalChange({
                              ...clinical,
                              patientHistory: {
                                ...(clinical.patientHistory ?? {}),
                                pastMedical: existing.join("; "),
                              },
                            });
                            setCustomHistoryInput("");
                            setShowCustomHistory(false);
                          }
                        } else if (e.key === "Escape") {
                          setShowCustomHistory(false);
                        }
                      }}
                      placeholder="e.g. Hypothyroidism"
                      className="h-6 text-[10px] px-2 rounded-md border border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-32 bg-white"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = customHistoryInput.trim();
                        if (val) {
                          const existing =
                            currentPastMedical &&
                            currentPastMedical !== "No DM, No HTN, No surgery"
                              ? currentPastMedical
                                  .split(";")
                                  .map((s) => s.trim())
                                  .filter(Boolean)
                              : [];
                          existing.push(val);
                          onClinicalChange({
                            ...clinical,
                            patientHistory: {
                              ...(clinical.patientHistory ?? {}),
                              pastMedical: existing.join("; "),
                            },
                          });
                          setCustomHistoryInput("");
                          setShowCustomHistory(false);
                        }
                      }}
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustomHistory(false)}
                      className="text-[10px] text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCustomHistory(true)}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-dashed border-slate-300 text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                    title="Add custom past medical history"
                  >
                    + Custom
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* TWO COLUMN GRID: CHIEF COMPLAINTS & DIAGNOSIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* CARD 1: CHIEF COMPLAINTS & SYMPTOMS */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition-shadow hover:shadow-sm flex flex-col justify-between relative">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-500/20">
                  <Icon icon={faStethoscope} className="size-3.5" />
                </span>
                <span className="text-xs font-bold text-slate-900 tracking-tight">
                  Chief Complaints
                </span>
              </div>

              <div className="flex items-center gap-2">
                {clinical.chiefComplaint?.trim() && (
                  <button
                    type="button"
                    onClick={() => onClinicalChange({ ...clinical, chiefComplaint: "" })}
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer transition-colors"
                    title="Clear complaints"
                  >
                    <Icon icon={faTrashCan} className="size-2.5" />
                    <span>Clear</span>
                  </button>
                )}

                {/* Suggestions Dropdown Trigger */}
                <div className="relative" ref={symptomsRef}>
                  <button
                    type="button"
                    onClick={() => setSymptomsMenuOpen((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/80 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Icon icon={faWandMagicSparkles} className="size-2.5 text-blue-600" />
                    <span>Suggestions ({complaintsOptions.length})</span>
                    <Icon icon={symptomsMenuOpen ? faChevronUp : faChevronDown} className="size-2 text-blue-500" />
                  </button>

                  {/* Dropdown Menu */}
                  {symptomsMenuOpen && (
                    <div className="absolute right-0 top-full z-50 mt-1 w-80 sm:w-96 rounded-xl border border-blue-200 bg-white p-2.5 shadow-2xl ring-1 ring-black/5">
                      {/* Search Bar */}
                      <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-100">
                        <div className="relative flex-1">
                          <Icon icon={faMagnifyingGlass} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 size-3 text-slate-400" />
                          <input
                            type="text"
                            value={symptomSearch}
                            onChange={(e) => setSymptomSearch(e.target.value)}
                            placeholder="Search symptoms (knee, back, fever)..."
                            className="h-7 w-full rounded-md border border-slate-200 bg-slate-50 pl-7 pr-6 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none"
                            autoFocus
                          />
                          {symptomSearch && (
                            <button
                              type="button"
                              onClick={() => setSymptomSearch("")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              <Icon icon={faXmark} className="size-2.5" />
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSymptomsMenuOpen(false)}
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-800 px-1 cursor-pointer"
                        >
                          Done ✕
                        </button>
                      </div>

                      {/* Doctor Custom Symptom Add Box */}
                      <div className="p-2 bg-blue-50/80 border border-blue-200 rounded-lg mb-2">
                        <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1 flex items-center justify-between">
                          <span>+ Add Doctor Custom Symptom</span>
                          <span className="text-[9px] text-blue-600 font-normal">Saves for future visits</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={newComplaintInput}
                            onChange={(e) => setNewComplaintInput(e.target.value)}
                            placeholder="e.g. Pain in shoulder during gym..."
                            className="h-7 flex-1 rounded border border-blue-300 bg-white px-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && newComplaintInput.trim()) {
                                e.preventDefault();
                                const text = newComplaintInput.trim();
                                addCustomComplaint(text);
                                const current = clinical.chiefComplaint?.trim() ?? "";
                                const next = current ? `${current}; ${text}` : text;
                                onClinicalChange({ ...clinical, chiefComplaint: next });
                                setNewComplaintInput("");
                                setComplaintNotice("Added & saved for future ✓");
                                setTimeout(() => setComplaintNotice(null), 3000);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const text = newComplaintInput.trim();
                              if (text) {
                                addCustomComplaint(text);
                                const current = clinical.chiefComplaint?.trim() ?? "";
                                const next = current ? `${current}; ${text}` : text;
                                onClinicalChange({ ...clinical, chiefComplaint: next });
                                setNewComplaintInput("");
                                setComplaintNotice("Added & saved for future ✓");
                                setTimeout(() => setComplaintNotice(null), 3000);
                              }
                            }}
                            disabled={!newComplaintInput.trim()}
                            className="h-7 px-2.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-40 transition-colors shadow-2xs cursor-pointer"
                          >
                            + Add
                          </button>
                        </div>
                      </div>

                      {/* Options List */}
                      <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5">
                        {filteredSymptoms.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-500">
                            No matching symptoms found. Type above to add a custom one.
                          </div>
                        ) : (
                          filteredSymptoms.map((text, idx) => {
                            const isAdded = Boolean(clinical.chiefComplaint?.includes(text));
                            const isFav = isComplaintFavorite(text);
                            const isCust = isComplaintCustom(text);
                            return (
                              <div
                                key={idx}
                                className={`flex items-center justify-between gap-1.5 rounded-lg px-2 py-1.5 text-xs transition-colors ${
                                  isAdded
                                    ? "bg-blue-50 font-bold text-blue-950 border border-blue-200"
                                    : "text-slate-700 hover:bg-slate-100 font-medium"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleComplaintFavorite(text)}
                                  className="p-1 text-slate-300 hover:text-amber-500 transition-colors cursor-pointer"
                                  title={isFav ? "Unpin favorite" : "Pin favorite to top"}
                                >
                                  <Icon
                                    icon={faStar}
                                    className={`size-3 ${isFav ? "text-amber-500 fill-amber-500" : "text-slate-300"}`}
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = clinical.chiefComplaint?.trim() ?? "";
                                    if (current.includes(text)) {
                                      const next = current
                                        .replace(new RegExp(`;?\\s*${escapeRegex(text)}`, "g"), "")
                                        .replace(/^;\s*/, "")
                                        .trim();
                                      onClinicalChange({ ...clinical, chiefComplaint: next });
                                    } else {
                                      const next = current ? `${current}; ${text}` : text;
                                      onClinicalChange({ ...clinical, chiefComplaint: next });
                                    }
                                  }}
                                  className="flex-1 text-left min-w-0 pr-1 cursor-pointer"
                                >
                                  <span className="text-xs text-slate-800 break-words block">{text}</span>
                                  {isCust && (
                                    <span className="text-[9px] font-bold text-blue-700 bg-blue-100/80 px-1 py-0.2 rounded inline-block mt-0.5">
                                      Doctor Custom
                                    </span>
                                  )}
                                </button>
                                {isCust && (
                                  <button
                                    type="button"
                                    onClick={() => removeCustomComplaint(text)}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Delete custom symptom"
                                  >
                                    <Icon icon={faTrashCan} className="size-2.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = clinical.chiefComplaint?.trim() ?? "";
                                    if (current.includes(text)) {
                                      const next = current
                                        .replace(new RegExp(`;?\\s*${escapeRegex(text)}`, "g"), "")
                                        .replace(/^;\s*/, "")
                                        .trim();
                                      onClinicalChange({ ...clinical, chiefComplaint: next });
                                    } else {
                                      const next = current ? `${current}; ${text}` : text;
                                      onClinicalChange({ ...clinical, chiefComplaint: next });
                                    }
                                  }}
                                  className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold cursor-pointer ${
                                    isAdded ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                  }`}
                                >
                                  {isAdded ? "✓ Added" : "+ Add"}
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Textarea
              value={clinical.chiefComplaint ?? ""}
              onChange={(e) => onClinicalChange({ ...clinical, chiefComplaint: e.target.value })}
              placeholder="Enter chief complaints (e.g. Joint pain, swelling, difficulty walking)..."
              rows={4}
              className="w-full text-xs font-medium resize-none leading-relaxed border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50/40 focus:bg-white rounded-lg transition-colors"
            />
          </div>
        </div>

        {/* CARD 2: CLINICAL DIAGNOSIS */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition-shadow hover:shadow-sm flex flex-col justify-between relative" ref={diagnosisRef}>
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20">
                  <Icon icon={faNotesMedical} className="size-3.5" />
                </span>
                <span className="text-xs font-bold text-slate-900 tracking-tight">
                  Clinical Diagnosis
                </span>
              </div>
              <div className="flex items-center gap-2">
                {clinical.diagnosis?.trim() && (
                  <button
                    type="button"
                    onClick={() => onClinicalChange({ ...clinical, diagnosis: "" })}
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer transition-colors"
                    title="Clear diagnosis"
                  >
                    <Icon icon={faTrashCan} className="size-2.5" />
                    <span>Clear</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDiagnosisMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 transition-colors shadow-2xs cursor-pointer"
                >
                  <Icon icon={faWandMagicSparkles} className="size-2.5 text-emerald-600" />
                  <span>Suggestions ({diagnosisOptions.length})</span>
                  <Icon icon={diagnosisMenuOpen ? faChevronUp : faChevronDown} className="size-2 text-emerald-600" />
                </button>
              </div>
            </div>

            {/* Smart Diagnosis Input with Real-Time Auto-Suggest */}
            <div className="relative">
              <Input
                value={clinical.diagnosis ?? ""}
                onChange={(e) => {
                  onClinicalChange({ ...clinical, diagnosis: e.target.value });
                  setDiagnosisMenuOpen(true);
                }}
                onFocus={() => setDiagnosisMenuOpen(true)}
                placeholder="Search or enter clinical diagnosis..."
                className="h-10 text-xs font-bold text-slate-900 border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-slate-50/40 focus:bg-white rounded-lg transition-colors pr-8"
              />
              {clinical.diagnosis ? (
                <button
                  type="button"
                  onClick={() => onClinicalChange({ ...clinical, diagnosis: "" })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Clear"
                >
                  <Icon icon={faXmark} className="size-3" />
                </button>
              ) : null}

              {/* Autocomplete Dropdown List */}
              {diagnosisMenuOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-emerald-200 bg-white p-2 shadow-2xl ring-1 ring-black/5">
                  <div className="px-1 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center justify-between border-b border-slate-100 mb-1.5">
                    <span>Suggested Diagnoses ({filteredDiagnoses.length})</span>
                    <button
                      type="button"
                      onClick={() => setDiagnosisMenuOpen(false)}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Close ✕
                    </button>
                  </div>

                  {/* Doctor Custom Diagnosis Add Box */}
                  <div className="p-2 bg-emerald-50/80 border border-emerald-200 rounded-lg mb-2">
                    <div className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>+ Add Doctor Custom Diagnosis</span>
                      <span className="text-[9px] text-emerald-600 font-normal">Saves for future visits</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newDiagnosisInput}
                        onChange={(e) => setNewDiagnosisInput(e.target.value)}
                        placeholder="e.g. Lumbar Canal Stenosis..."
                        className="h-7 flex-1 rounded border border-emerald-300 bg-white px-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newDiagnosisInput.trim()) {
                            e.preventDefault();
                            const text = newDiagnosisInput.trim();
                            addCustomDiagnosis(text);
                            onClinicalChange({ ...clinical, diagnosis: text });
                            setNewDiagnosisInput("");
                            setDiagnosisMenuOpen(false);
                            setDiagnosisNotice("Saved & applied diagnosis ✓");
                            setTimeout(() => setDiagnosisNotice(null), 3000);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const text = newDiagnosisInput.trim();
                          if (text) {
                            addCustomDiagnosis(text);
                            onClinicalChange({ ...clinical, diagnosis: text });
                            setNewDiagnosisInput("");
                            setDiagnosisMenuOpen(false);
                            setDiagnosisNotice("Saved & applied diagnosis ✓");
                            setTimeout(() => setDiagnosisNotice(null), 3000);
                          }
                        }}
                        disabled={!newDiagnosisInput.trim()}
                        className="h-7 px-2.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs disabled:opacity-40 transition-colors shadow-2xs cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  {filteredDiagnoses.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">
                      No matching presets. You can continue typing custom diagnosis or add it above.
                    </div>
                  ) : (
                    filteredDiagnoses.map((text, idx) => {
                      const isSelected = clinical.diagnosis?.trim().toLowerCase() === text.toLowerCase();
                      const isFav = isDiagnosisFavorite(text);
                      const isCust = isDiagnosisCustom(text);
                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between gap-1.5 rounded-lg px-2 py-1.5 text-xs transition-colors ${
                            isSelected
                              ? "bg-emerald-50 font-bold text-emerald-950 border border-emerald-200"
                              : "text-slate-800 hover:bg-slate-50 hover:text-emerald-900 font-medium"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleDiagnosisFavorite(text)}
                            className="p-1 text-slate-300 hover:text-amber-500 transition-colors cursor-pointer"
                            title={isFav ? "Unpin favorite" : "Pin favorite to top"}
                          >
                            <Icon
                              icon={faStar}
                              className={`size-3 ${isFav ? "text-amber-500 fill-amber-500" : "text-slate-300"}`}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onClinicalChange({ ...clinical, diagnosis: text });
                              setDiagnosisMenuOpen(false);
                            }}
                            className="flex-1 text-left min-w-0 pr-1 cursor-pointer"
                          >
                            <span className="text-xs text-slate-900 font-semibold break-words block">{text}</span>
                            {isCust && (
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1 py-0.2 rounded inline-block mt-0.5">
                                Doctor Custom
                              </span>
                            )}
                          </button>
                          {isCust && (
                            <button
                              type="button"
                              onClick={() => removeCustomDiagnosis(text)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete custom diagnosis"
                            >
                              <Icon icon={faTrashCan} className="size-2.5" />
                            </button>
                          )}
                          {isSelected && (
                            <Icon icon={faCheck} className="size-3 text-emerald-600 shrink-0" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QUICK EXAMINATION & LOCAL FINDINGS */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition-shadow hover:shadow-sm relative">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-500/20">
              <Icon icon={faBone} className="size-3.5" />
            </span>
            <span className="text-xs font-bold text-slate-900 tracking-tight">
              Physical Examination
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSetNormalExam}
              className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 cursor-pointer transition-colors shadow-2xs"
              title="1-click mark examination as normal"
            >
              <Icon icon={faCheck} className="size-2.5 text-emerald-600" />
              <span>Normal / NAD</span>
            </button>

            {/* Findings Suggestions Dropdown Trigger */}
            <div className="relative" ref={examRef}>
              <button
                type="button"
                onClick={() => setExamMenuOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100 hover:border-amber-300 transition-colors shadow-2xs cursor-pointer"
              >
                <Icon icon={faBone} className="size-2.5 text-amber-700" />
                <span>Preset Findings ({examOptions.length})</span>
                <Icon icon={examMenuOpen ? faChevronUp : faChevronDown} className="size-2 text-amber-600" />
              </button>

              {examMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-80 sm:w-96 rounded-xl border border-amber-200 bg-white p-2.5 shadow-2xl ring-1 ring-black/5">
                  <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-100 px-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                      Preset Joint Findings
                    </span>
                    <button
                      type="button"
                      onClick={() => setExamMenuOpen(false)}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Done ✕
                    </button>
                  </div>

                  {/* Doctor Custom Exam Finding Add Box */}
                  <div className="p-2 bg-amber-50/80 border border-amber-200 rounded-lg mb-2">
                    <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>+ Add Doctor Custom Exam Finding</span>
                      <span className="text-[9px] text-amber-600 font-normal">Saves for future visits</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newExamInput}
                        onChange={(e) => setNewExamInput(e.target.value)}
                        placeholder="e.g. Mild effusion in right suprapatellar pouch..."
                        className="h-7 flex-1 rounded border border-amber-300 bg-white px-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newExamInput.trim()) {
                            e.preventDefault();
                            const text = newExamInput.trim();
                            addCustomExam(text);
                            const current = clinical.examination?.jointsAndParts?.trim() ?? "";
                            const next = current ? `${current}\n• ${text}` : `• ${text}`;
                            onClinicalChange({
                              ...clinical,
                              examination: {
                                ...clinical.examination,
                                jointsAndParts: next,
                              },
                            });
                            setNewExamInput("");
                            setExamNotice("Added to findings & saved for future ✓");
                            setTimeout(() => setExamNotice(null), 3000);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const text = newExamInput.trim();
                          if (text) {
                            addCustomExam(text);
                            const current = clinical.examination?.jointsAndParts?.trim() ?? "";
                            const next = current ? `${current}\n• ${text}` : `• ${text}`;
                            onClinicalChange({
                              ...clinical,
                              examination: {
                                ...clinical.examination,
                                jointsAndParts: next,
                              },
                            });
                            setNewExamInput("");
                            setExamNotice("Added to findings & saved for future ✓");
                            setTimeout(() => setExamNotice(null), 3000);
                          }
                        }}
                        disabled={!newExamInput.trim()}
                        className="h-7 px-2.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs disabled:opacity-40 transition-colors shadow-2xs cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5">
                    {examOptions.map((text, idx) => {
                      const isAdded = Boolean(clinical.examination?.jointsAndParts?.includes(text));
                      const isFav = isExamFavorite(text);
                      const isCust = isExamCustom(text);
                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between gap-1.5 rounded-lg px-2 py-1.5 text-xs transition-colors ${
                            isAdded
                              ? "bg-amber-50 font-bold text-amber-950 border border-amber-200"
                              : "text-slate-700 hover:bg-slate-100 font-medium"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleExamFavorite(text)}
                            className="p-1 text-slate-300 hover:text-amber-500 transition-colors cursor-pointer"
                            title={isFav ? "Unpin favorite" : "Pin favorite to top"}
                          >
                            <Icon
                              icon={faStar}
                              className={`size-3 ${isFav ? "text-amber-500 fill-amber-500" : "text-slate-300"}`}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const current = clinical.examination?.jointsAndParts?.trim() ?? "";
                              if (current.includes(text)) {
                                const next = current
                                  .replace(new RegExp(`\\n?•?\\s*${escapeRegex(text)}`, "g"), "")
                                  .trim();
                                onClinicalChange({
                                  ...clinical,
                                  examination: {
                                    ...clinical.examination,
                                    jointsAndParts: next,
                                  },
                                });
                              } else {
                                const next = current ? `${current}\n• ${text}` : `• ${text}`;
                                onClinicalChange({
                                  ...clinical,
                                  examination: {
                                    ...clinical.examination,
                                    jointsAndParts: next,
                                  },
                                });
                              }
                            }}
                            className="flex-1 text-left min-w-0 pr-1 cursor-pointer"
                          >
                            <span className="text-xs text-slate-800 break-words block">{text}</span>
                            {isCust && (
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-100/80 px-1 py-0.2 rounded inline-block mt-0.5">
                                Doctor Custom
                              </span>
                            )}
                          </button>
                          {isCust && (
                            <button
                              type="button"
                              onClick={() => removeCustomExam(text)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete custom exam finding"
                            >
                              <Icon icon={faTrashCan} className="size-2.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const current = clinical.examination?.jointsAndParts?.trim() ?? "";
                              if (current.includes(text)) {
                                const next = current
                                  .replace(new RegExp(`\\n?•?\\s*${escapeRegex(text)}`, "g"), "")
                                  .trim();
                                onClinicalChange({
                                  ...clinical,
                                  examination: {
                                    ...clinical.examination,
                                    jointsAndParts: next,
                                  },
                                });
                              } else {
                                const next = current ? `${current}\n• ${text}` : `• ${text}`;
                                onClinicalChange({
                                  ...clinical,
                                  examination: {
                                    ...clinical.examination,
                                    jointsAndParts: next,
                                  },
                                });
                              }
                            }}
                            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold cursor-pointer ${
                              isAdded ? "bg-amber-600 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                            }`}
                          >
                            {isAdded ? "✓ Added" : "+ Add"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {clinical.examination?.jointsAndParts?.trim() && (
              <button
                type="button"
                onClick={() =>
                  onClinicalChange({
                    ...clinical,
                    examination: {
                      ...clinical.examination,
                      jointsAndParts: "",
                    },
                  })
                }
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer transition-colors"
                title="Clear exam findings"
              >
                <Icon icon={faTrashCan} className="size-2.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
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
          placeholder="Enter physical examination findings or select presets above..."
          rows={3}
          className="w-full text-xs font-medium resize-none leading-relaxed border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-slate-50/40 focus:bg-white rounded-lg transition-colors"
        />
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
                Prescription Medicines
              </span>
              <p className="text-[11px] text-slate-500">
                {medicines.filter((m) => m.name?.trim()).length} medicine{medicines.filter((m) => m.name?.trim()).length === 1 ? "" : "s"} prescribed
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

                {/* Generic Salt Indicator */}
                {(med.genericName || matchedDrug?.genericName) && (
                  <div className="mb-1.5 pl-8 flex items-center gap-1.5 text-[11px] text-teal-800">
                    <span className="font-semibold text-teal-900">Generic:</span>
                    <span className="bg-teal-50 text-teal-900 border border-teal-200/80 rounded px-1.5 py-0.5 font-medium">
                      {med.genericName || matchedDrug?.genericName}
                    </span>
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
                      placeholder="e.g. After food, at bedtime..."
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
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition-shadow hover:shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-800 ring-1 ring-amber-500/20">
                  <Icon icon={faNotesMedical} className="size-3.5" />
                </span>
                <span className="text-xs font-bold text-slate-900 tracking-tight">
                  Advice & Recommendations
                </span>
              </div>
              <div className="flex items-center gap-2">
                {advice?.trim() && (
                  <button
                    type="button"
                    onClick={() => onAdviceChange("")}
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer transition-colors"
                    title="Clear advice"
                  >
                    <Icon icon={faTrashCan} className="size-2.5" />
                    <span>Clear</span>
                  </button>
                )}

                {/* Advice Suggestions Dropdown */}
                <div className="relative" ref={adviceRef}>
                  <button
                    type="button"
                    onClick={() => setAdviceMenuOpen((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100 hover:border-amber-300 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Icon icon={faWandMagicSparkles} className="size-2.5 text-amber-700" />
                    <span>Suggestions ({adviceOptions.length})</span>
                    <Icon icon={adviceMenuOpen ? faChevronUp : faChevronDown} className="size-2 text-amber-600" />
                  </button>

                  {adviceMenuOpen && (
                    <div className="absolute right-0 top-full z-50 mt-1 w-80 sm:w-96 rounded-xl border border-amber-200 bg-white p-2.5 shadow-2xl ring-1 ring-black/5">
                      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-100 px-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                          Precaution Presets & Recommendations
                        </span>
                        <button
                          type="button"
                          onClick={() => setAdviceMenuOpen(false)}
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          Done ✕
                        </button>
                      </div>

                      {/* Search / Filter Advice */}
                      <div className="relative mb-2">
                        <Icon icon={faMagnifyingGlass} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 size-3 text-slate-400" />
                        <input
                          type="text"
                          value={adviceFilter}
                          onChange={(e) => setAdviceFilter(e.target.value)}
                          placeholder="Filter precautions..."
                          className="h-7 w-full rounded-md border border-slate-200 bg-slate-50 pl-7 pr-6 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:outline-none"
                        />
                        {adviceFilter && (
                          <button
                            type="button"
                            onClick={() => setAdviceFilter("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <Icon icon={faXmark} className="size-2.5" />
                          </button>
                        )}
                      </div>

                      {/* Doctor Custom Precaution Add Box */}
                      <div className="p-2 bg-amber-50/80 border border-amber-200 rounded-lg mb-2">
                        <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center justify-between">
                          <span>+ Add Doctor Custom Precaution</span>
                          <span className="text-[9px] text-amber-600 font-normal">Saves for future visits</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={newAdviceInput}
                            onChange={(e) => setNewAdviceInput(e.target.value)}
                            placeholder="e.g. Avoid cold drinks, steam twice daily..."
                            className="h-7 flex-1 rounded border border-amber-300 bg-white px-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && newAdviceInput.trim()) {
                                e.preventDefault();
                                const text = newAdviceInput.trim();
                                addCustomAdvice(text);
                                const current = advice?.trim() ?? "";
                                const next = current ? `${current}\n• ${text}` : `• ${text}`;
                                onAdviceChange(next);
                                setNewAdviceInput("");
                                setAdviceNotice("Added to advice & saved for future ✓");
                                setTimeout(() => setAdviceNotice(null), 3000);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const text = newAdviceInput.trim();
                              if (text) {
                                addCustomAdvice(text);
                                const current = advice?.trim() ?? "";
                                const next = current ? `${current}\n• ${text}` : `• ${text}`;
                                onAdviceChange(next);
                                setNewAdviceInput("");
                                setAdviceNotice("Added to advice & saved for future ✓");
                                setTimeout(() => setAdviceNotice(null), 3000);
                              }
                            }}
                            disabled={!newAdviceInput.trim()}
                            className="h-7 px-2.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs disabled:opacity-40 transition-colors shadow-2xs cursor-pointer"
                          >
                            + Add
                          </button>
                        </div>
                      </div>

                      <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5">
                        {filteredAdvice.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-500">
                            No matching precautions found. Add custom above.
                          </div>
                        ) : (
                          filteredAdvice.map((text, idx) => {
                            const isAdded = Boolean(advice?.includes(text));
                            const isFav = isAdviceFavorite(text);
                            const isCust = isAdviceCustom(text);
                            return (
                              <div
                                key={idx}
                                className={`flex items-center justify-between gap-1.5 rounded-lg px-2 py-1.5 text-xs transition-colors ${
                                  isAdded
                                    ? "bg-amber-50 font-bold text-amber-950 border border-amber-200"
                                    : "text-slate-700 hover:bg-slate-100 font-medium"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleAdviceFavorite(text)}
                                  className="p-1 text-slate-300 hover:text-amber-500 transition-colors cursor-pointer"
                                  title={isFav ? "Unpin favorite" : "Pin favorite to top"}
                                >
                                  <Icon
                                    icon={faStar}
                                    className={`size-3 ${isFav ? "text-amber-500 fill-amber-500" : "text-slate-300"}`}
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = advice?.trim() ?? "";
                                    if (current.includes(text)) {
                                      const next = current
                                        .replace(new RegExp(`\\n?•?\\s*${escapeRegex(text)}`, "g"), "")
                                        .trim();
                                      onAdviceChange(next);
                                    } else {
                                      const next = current ? `${current}\n• ${text}` : `• ${text}`;
                                      onAdviceChange(next);
                                    }
                                  }}
                                  className="flex-1 text-left min-w-0 pr-1 cursor-pointer"
                                >
                                  <span className="text-xs text-slate-800 break-words block">{text}</span>
                                  {isCust && (
                                    <span className="text-[9px] font-bold text-amber-700 bg-amber-100/80 px-1 py-0.2 rounded inline-block mt-0.5">
                                      Doctor Custom
                                    </span>
                                  )}
                                </button>
                                {isCust && (
                                  <button
                                    type="button"
                                    onClick={() => removeCustomAdvice(text)}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Delete custom recommendation"
                                  >
                                    <Icon icon={faTrashCan} className="size-2.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = advice?.trim() ?? "";
                                    if (current.includes(text)) {
                                      const next = current
                                        .replace(new RegExp(`\\n?•?\\s*${escapeRegex(text)}`, "g"), "")
                                        .trim();
                                      onAdviceChange(next);
                                    } else {
                                      const next = current ? `${current}\n• ${text}` : `• ${text}`;
                                      onAdviceChange(next);
                                    }
                                  }}
                                  className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold cursor-pointer ${
                                    isAdded ? "bg-amber-600 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                  }`}
                                >
                                  {isAdded ? "✓ Added" : "+ Add"}
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Textarea
              value={advice}
              onChange={(e) => onAdviceChange(e.target.value)}
              placeholder="Enter advice, precautions, lifestyle recommendations..."
              rows={3}
              className="w-full text-xs font-medium resize-none leading-relaxed border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-slate-50/40 focus:bg-white rounded-lg transition-colors"
            />
          </div>
        </div>

        {/* FOLLOW-UP */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition-shadow hover:shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-sky-50 text-sky-800 ring-1 ring-sky-500/20">
                  <Icon icon={faClock} className="size-3.5" />
                </span>
                <span className="text-xs font-bold text-slate-900 tracking-tight">
                  Follow-Up Timeframe
                </span>
              </div>
              {followUp?.trim() && (
                <button
                  type="button"
                  onClick={() => onFollowUpChange("")}
                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer transition-colors"
                  title="Clear follow-up"
                >
                  <Icon icon={faTrashCan} className="size-2.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
            <Input
              value={followUp}
              onChange={(e) => onFollowUpChange(e.target.value)}
              placeholder="e.g. Review after 7 days..."
              className="h-10 text-xs font-bold text-slate-900 border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-slate-50/40 focus:bg-white rounded-lg transition-colors"
            />
          </div>

          {/* Quick follow up chips */}
          <div className="mt-2.5">
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Review In:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FAST_FOLLOW_UPS.map((f, i) => {
                const isSelected = followUp?.trim().toLowerCase() === f.text.toLowerCase();
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectFollowUp(f)}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold cursor-pointer transition-all active:scale-95 whitespace-nowrap ${
                      isSelected
                        ? "bg-sky-600 text-white shadow-xs ring-1 ring-sky-600"
                        : "border border-slate-200 bg-slate-50/80 text-slate-700 hover:border-sky-400 hover:bg-sky-50 hover:text-sky-900"
                    }`}
                  >
                    <Icon
                      icon={isSelected ? faCheck : faPlus}
                      className={`size-2.5 ${isSelected ? "text-white" : "text-sky-600"}`}
                    />
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>
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

      {/* Prescription Viewer Modal */}
      <PrescriptionViewModal
        consultationId={consultationId}
        isOpen={isRxViewOpen}
        onClose={() => setIsRxViewOpen(false)}
        initialLang={rxModalLang}
      />

      {/* Apollo-Standard Outpatient Summary Modal */}
      <PatientSummaryModal
        consultationId={consultationId}
        isOpen={isSummaryViewOpen}
        onClose={() => setIsSummaryViewOpen(false)}
      />
    </div>
  );
}

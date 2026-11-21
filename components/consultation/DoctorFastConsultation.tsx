"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  faBolt,
  faBone,
  faBookmark,
  faCheck,
  faCheckCircle,
  faChevronDown,
  faChevronUp,
  faClock,
  faCopy,
  faEye,
  faBandage,
  faFileContract,
  faFileLines,
  faFlaskVial,
  faHeartPulse,
  faMagnifyingGlass,
  faNotesMedical,
  faPen,
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
  faPaperclip,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/shadcn/textarea";
import { MedicineCombobox } from "@/components/consultation/MedicineCombobox";
import { emptyMedicine } from "@/components/consultation/PrescriptionBuilder";
import { useClinicalRecommendations } from "@/lib/clinical-recommendations-storage";
import {
  COMMON_ILLNESS_TEMPLATES,
  getClinicalTemplatesBySpecialty,
  type ClinicalTemplate,
} from "@/lib/clinical-templates";
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
  PlasterBandageItem,
  PreviousVisitData,
  Vitals,
} from "@/lib/types";
import { MacroTextModal } from "@/components/consultation/MacroTextModal";
import { CustomTemplatesModal } from "@/components/consultation/CustomTemplatesModal";

export type QuickTag = {
  label: string;
  text: string;
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Crisp, readable symptom tags
const FAST_ORTHO_SYMPTOMS: QuickTag[] = [
  { label: "Left Ankle Pain (4d)", text: "Left ankle pain for 4 days" },
  { label: "Swelling Post-Twist", text: "Swelling after twisting injury" },
  { label: "Difficulty Walking", text: "Difficulty walking" },
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

// Crisp, readable diagnosis tags
const FAST_ORTHO_DIAGNOSES: QuickTag[] = [
  { label: "Left Ankle Sprain", text: "Left Ankle Sprain" },
  { label: "Bilateral Knee OA", text: "Bilateral Osteoarthritis Knee (Grade 2/3) with Joint Flare" },
  { label: "Right Knee OA", text: "Osteoarthritis Right Knee Joint" },
  { label: "Lumbar Spondylosis", text: "Lumbar Spondylosis with L4-L5 Radiculopathy (Sciatica)" },
  { label: "Acute Back Strain", text: "Acute Mechanical Lower Back Strain with Muscle Spasm" },
  { label: "Cervical Spondylosis", text: "Cervical Spondylosis with Trapezius Muscle Spasm" },
  { label: "Frozen Shoulder", text: "Adhesive Capsulitis of Right Shoulder (Frozen Shoulder)" },
  { label: "Ankle Sprain (Lateral)", text: "Acute Lateral Ankle Ligament Sprain (Grade 1/2)" },
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
  { label: "Lateral Ankle Tender", text: "Lateral ankle tenderness" },
  { label: "Mild Swelling", text: "Mild swelling" },
  { label: "Pain with Movement", text: "Pain during movement" },
  { label: "Knee OA (Crepitus/Tender)", text: "Medial joint line tenderness (+), joint crepitus on passive flexion, ROM 0-110°, no joint effusion." },
  { label: "Lumbar Spasm (SLR+)", text: "Paravertebral muscle spasm present, tenderness at L4-L5, SLR positive at 60°." },
  { label: "Cervical Paraspinal Spasm", text: "Cervical paraspinal tenderness, restricted lateral rotation, Spurling test negative." },
  { label: "Shoulder Restricted ROM", text: "Marked restriction of shoulder abduction and external rotation, subacromial tenderness (+)." },
  { label: "Ankle ATFL Sprain", text: "Localized edema and tenderness over anterior talofibular ligament, anterior drawer negative." },
  { label: "Heel Tenderness (Plantar)", text: "Tender plantar fascia insertion at calcaneal tubercle, Windlass test positive." },
];

// Crisp, readable investigations tags
const FAST_INVESTIGATION_CHIPS: QuickTag[] = [
  { label: "X-ray Left Ankle (4d Twist)", text: "X-ray Left Ankle – if indicated by clinical examination" },
  { label: "Digital X-Ray Left Ankle", text: "Digital X-Ray Left Ankle (AP & Lat)" },
  { label: "Digital X-Ray Right Ankle", text: "Digital X-Ray Right Ankle (AP & Lat)" },
  { label: "Digital X-Ray Bilateral Knees", text: "Digital X-Ray Bilateral Knees (AP & Lat - Standing)" },
  { label: "Digital X-Ray Lumbar Spine", text: "Digital X-Ray Lumbar Spine (AP & Lat)" },
  { label: "Digital X-Ray Cervical Spine", text: "Digital X-Ray Cervical Spine (AP & Lat)" },
  { label: "MRI Lumbo-Sacral Spine", text: "MRI Lumbo-Sacral Spine with Screening of Whole Spine" },
  { label: "Serum Uric Acid", text: "Serum Uric Acid (Hyperuricemia / Gout Screen)" },
  { label: "CBC & ESR", text: "Complete Blood Count (CBC) with ESR" },
  { label: "CRP Quantitative", text: "C-Reactive Protein (CRP) Quantitative" },
  { label: "RA Factor & Anti-CCP", text: "Rheumatoid Factor (RA) & Anti-CCP Antibodies" },
  { label: "Calcium & Vitamin D3", text: "Serum Calcium & 25-Hydroxy Vitamin D3" },
  { label: "HbA1c & Blood Sugar", text: "HbA1c with Fasting Blood Sugar (FBS)" },
];

// Crisp, readable advice tags
const FAST_ADVICE_CHIPS: QuickTag[] = [
  { label: "Rest & Protection", text: "Rest and protection" },
  { label: "Ice Application", text: "Ice application" },
  { label: "Compression & Elevation", text: "Compression and elevation" },
  { label: "Supportive Ankle Brace", text: "Supportive ankle brace if indicated" },
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
  { label: "5-7 Days", text: "Review after 5–7 days" },
  { label: "3 Days", text: "Review after 3 days" },
  { label: "5 Days", text: "Review after 5 days" },
  { label: "7 Days (1 Wk)", text: "Review after 7 days (1 week)" },
  { label: "10 Days", text: "Review after 10 days" },
  { label: "15 Days", text: "Review after 15 days" },
  { label: "1 Month", text: "Review after 1 month" },
  { label: "SOS / If Needed", text: "SOS if severe pain persists or symptoms worsen" },
];

// Quick Presets for Bandages, Plasters & Orthopedic Supports
const PRESET_PLASTERS = [
  { name: "Supportive Ankle Brace", defaultSite: "Left Ankle", defaultDuration: "2 weeks", defaultInstructions: "Supportive ankle brace if indicated; wear while standing/walking" },
  { name: "POP Slab (Below Knee)", defaultSite: "Right Ankle", defaultDuration: "3 weeks", defaultInstructions: "Strict Non-Weight Bearing (NWB)" },
  { name: "POP Slab (Above Knee)", defaultSite: "Right Leg", defaultDuration: "4 weeks", defaultInstructions: "Strict Non-Weight Bearing (NWB)" },
  { name: "POP Slab (Below Elbow / Wrist)", defaultSite: "Left Wrist", defaultDuration: "3 weeks", defaultInstructions: "Keep elevated, do not wet" },
  { name: "POP Cast (Below Knee)", defaultSite: "Right Leg", defaultDuration: "4 weeks", defaultInstructions: "Strict Non-Weight Bearing" },
  { name: "Crepe Bandage (6 inch)", defaultSite: "Right Ankle", defaultDuration: "2 weeks", defaultInstructions: "Rewrap snug, remove at night" },
  { name: "Crepe Bandage (4 inch)", defaultSite: "Left Wrist", defaultDuration: "10 days", defaultInstructions: "Remove at night while sleeping" },
  { name: "Dynaplast Adhesive Bandage", defaultSite: "Affected Joint", defaultDuration: "5 days", defaultInstructions: "Keep strictly dry" },
  { name: "L.S. (Lumbar Sacral) Belt", defaultSite: "Lower Back / Spine", defaultDuration: "1 month", defaultInstructions: "Wear while walking/travelling; remove at rest" },
  { name: "Cervical Collar (Soft/Hard)", defaultSite: "Cervical Spine", defaultDuration: "2 weeks", defaultInstructions: "Wear while sitting/standing; remove while sleeping" },
  { name: "Knee Cap / Hinged Brace", defaultSite: "Right Knee", defaultDuration: "3 weeks", defaultInstructions: "Wear during daytime walking" },
  { name: "Arm Sling Pouch", defaultSite: "Right Arm", defaultDuration: "2 weeks", defaultInstructions: "Support arm while standing/walking" },
  { name: "Cock-up Wrist Splint", defaultSite: "Left Wrist", defaultDuration: "3 weeks", defaultInstructions: "Keep wrist in neutral position" },
  { name: "Ankle Binder / Support", defaultSite: "Right Ankle", defaultDuration: "2 weeks", defaultInstructions: "Wear during ambulation" },
  { name: "Finger / Mallet Splint", defaultSite: "Affected Finger", defaultDuration: "3 weeks", defaultInstructions: "Continuous immobilization" },
  { name: "Sterile Antiseptic Dressing", defaultSite: "Wound Site", defaultDuration: "3 days", defaultInstructions: "Keep clean and strictly dry" },
];

function getPlasterPresetDetails(name: string) {
  const match = PRESET_PLASTERS.find(
    (p) => p.name.toLowerCase() === name.trim().toLowerCase()
  );
  if (match) {
    return {
      site: match.defaultSite,
      duration: match.defaultDuration,
      instructions: match.defaultInstructions,
    };
  }
  return {
    site: "Affected Site",
    duration: "3 weeks",
    instructions: "As advised by doctor",
  };
}

const PRESET_PLASTER_SITES = [
  "Right Ankle",
  "Left Ankle",
  "Right Knee",
  "Left Knee",
  "Right Wrist",
  "Left Wrist",
  "Right Leg",
  "Left Leg",
  "Right Arm",
  "Left Arm",
  "Lower Back (L.S.)",
  "Cervical (Neck)",
  "Right Shoulder",
  "Left Shoulder",
];

const PRESET_PLASTER_DURATIONS = [
  "3 weeks",
  "4 weeks",
  "2 weeks",
  "10 days",
  "1 week",
  "1 month",
  "6 weeks",
];

const PRESET_PLASTER_INSTRUCTIONS = [
  "Strict Non-Weight Bearing (NWB)",
  "Partial Weight Bearing (PWB)",
  "Full weight bearing as tolerated",
  "Wear while walking/travelling; remove at rest",
  "Remove at night while sleeping",
  "Keep strictly dry; protect with plastic while bathing",
  "Keep limb elevated on pillows above chest level",
];

const PLASTER_ADVICE_PRESETS = [
  "Keep plaster / bandage strictly dry at all times; cover with plastic while bathing.",
  "Keep the limb elevated on 1-2 pillows above heart level to reduce pain and swelling.",
  "Strict Non-Weight Bearing: Do NOT put weight or walk on the plastered limb.",
  "Actively move / wiggle fingers and toes regularly throughout the day to maintain healthy blood circulation.",
  "Do not insert pencils, pins, or any objects inside the cast to scratch itchy skin.",
  "Contact clinic / doctor immediately if fingers/toes turn blue, cold, numb, or severely painful.",
  "Remove crepe bandage while sleeping at night unless instructed otherwise.",
  "Wear lumbar belt / brace only while sitting, walking, and travelling; remove at rest.",
  "Keep wound dressing dry and clean; report immediately if there is excessive soakage or foul smell.",
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
  treatmentMode: any;
  onClinicalChange: (clinical: ConsultationClinicalData) => void;
  onMedicinesChange: (medicines: Medicine[]) => void;
  onAdviceChange: (advice: string) => void;
  onFollowUpChange: (followUp: string) => void;
  onTreatmentModeChange: (mode: any) => void;
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

  // Macro Text Modal State
  const [isMacroModalOpen, setIsMacroModalOpen] = useState(false);
  const [macroCategory, setMacroCategory] = useState<"complaints" | "examination" | "advice" | "plan" | "all">("all");
  const [macroTargetField, setMacroTargetField] = useState<"complaints" | "history" | "examination" | "advice" | "plan">("complaints");

  // Custom Templates Modal State
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [templatesModalMode, setTemplatesModalMode] = useState<"apply" | "save">("apply");

  // Accordion Section Collapse States (default: all primary open)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Structured Diagnosis State (SNOMED, side, location, onset, duration)
  const [diagSearch, setDiagSearch] = useState("");
  const [diagSide, setDiagSide] = useState("Select");
  const [diagLocation, setDiagLocation] = useState("");
  const [diagOnsetNum, setDiagOnsetNum] = useState("");
  const [diagOnsetUnit, setDiagOnsetUnit] = useState("Days");
  const [diagType, setDiagType] = useState<"Provisional" | "Definitive" | "Secondary">("Provisional");

  // New Medicine Row Quick Entry
  const [medPrescriptionType, setMedPrescriptionType] = useState<"Regular" | "Stat" | "SOS">("Regular");
  const [medSearchType, setMedSearchType] = useState<"Brand" | "Generic">("Brand");
  const [newMedName, setNewMedName] = useState("");
  const [newMedDose, setNewMedDose] = useState("1");
  const [newMedUnit, setNewMedUnit] = useState("Tablet(s)");
  const [newMedFreq, setNewMedFreq] = useState("BD - Morning & Night");
  const [medDoseM, setMedDoseM] = useState(true);
  const [medDoseA, setMedDoseA] = useState(false);
  const [medDoseE, setMedDoseE] = useState(false);
  const [medDoseN, setMedDoseN] = useState(true);
  const [newMedMeal, setNewMedMeal] = useState("After meal");
  const [newMedDuration, setNewMedDuration] = useState("5");
  const [newMedDurationUnit, setNewMedDurationUnit] = useState("Day(s)");
  const [newMedRoute, setNewMedRoute] = useState("Oral");
  const [newMedComments, setNewMedComments] = useState("");

  // Plan Checkbox
  const [isPlanChecked, setIsPlanChecked] = useState(true);
  const treatmentPlan = clinical.treatmentPlan ?? {};
  const currentPlanDetails = (clinical as any).planDetails || "";

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

  const [investigationMenuOpen, setInvestigationMenuOpen] = useState(false);
  const [newInvestigationInput, setNewInvestigationInput] = useState("");
  const [investigationSearch, setInvestigationSearch] = useState("");
  const [investigationNotice, setInvestigationNotice] = useState<string | null>(null);
  const [invMenuOpen, setInvMenuOpen] = useState(false);
  const investigationRef = useRef<HTMLDivElement>(null);

  const [adviceMenuOpen, setAdviceMenuOpen] = useState(false);
  const [adviceFilter, setAdviceFilter] = useState("");
  const [newAdviceInput, setNewAdviceInput] = useState("");
  const [adviceNotice, setAdviceNotice] = useState<string | null>(null);
  const adviceRef = useRef<HTMLDivElement>(null);

  // Bandages, Plasters & Supports State
  const [newPlasterName, setNewPlasterName] = useState("");
  const [newPlasterSite, setNewPlasterSite] = useState("");
  const [newPlasterDuration, setNewPlasterDuration] = useState("");
  const [newPlasterInstructions, setNewPlasterInstructions] = useState("");
  const [plasterNotice, setPlasterNotice] = useState<string | null>(null);

  // Bandages, Plasters & Supports Inline Editing State
  const [editingPlasterId, setEditingPlasterId] = useState<string | null>(null);
  const [editPlasterName, setEditPlasterName] = useState("");
  const [editPlasterSite, setEditPlasterSite] = useState("");
  const [editPlasterDuration, setEditPlasterDuration] = useState("");
  const [editPlasterInstructions, setEditPlasterInstructions] = useState("");

  // Bandages, Plasters & Supports Dropdown States
  const [plasterMenuOpen, setPlasterMenuOpen] = useState(false);
  const [plasterSearch, setPlasterSearch] = useState("");
  const [newPlasterSuggestionInput, setNewPlasterSuggestionInput] = useState("");
  const plasterMenuRef = useRef<HTMLDivElement>(null);

  // Plaster Care Advice Dropdown States
  const [plasterAdviceMenuOpen, setPlasterAdviceMenuOpen] = useState(false);
  const [plasterAdviceSearch, setPlasterAdviceSearch] = useState("");
  const [newPlasterAdviceSuggestionInput, setNewPlasterAdviceSuggestionInput] = useState("");
  const [plasterAdviceNotice, setPlasterAdviceNotice] = useState<string | null>(null);
  const plasterAdviceMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (plasterMenuRef.current && !plasterMenuRef.current.contains(event.target as Node)) {
        setPlasterMenuOpen(false);
      }
      if (plasterAdviceMenuRef.current && !plasterAdviceMenuRef.current.contains(event.target as Node)) {
        setPlasterAdviceMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const plasterOrBandages = treatmentPlan.plasterOrBandages ?? [];
  const plasterAdvice = treatmentPlan.plasterAdvice ?? "";

  // History of present illness
  const historyOfPresentIllness = (clinical.patientHistory as any)?.presentIllness ?? "";

  function handleClearAllDetails() {
    if (window.confirm("Are you sure you want to clear all details entered in this consultation?")) {
      onClinicalChange({
        treatmentMode: clinical.treatmentMode ?? "orthopedics",
        chiefComplaint: "",
        diagnosis: "",
        diagnosisCodes: [],
        examination: { jointsAndParts: "" },
        patientHistory: {
          pastMedical: "",
          pastSurgical: "",
          allergies: "",
          medications: "",
          familyHistory: "",
          socialHistory: "",
          presentIllness: "",
        } as any,
        clinicalPresentation: { onset: "", duration: "" },
        investigationResults: { labs: "", imaging: "", other: "" },
        treatmentPlan: {
          treatmentType: "",
          proposedProcedure: "",
          timingOrDate: "",
          preOpClearance: "",
          implantsRequired: "",
          bloodProducts: "",
          postOpIcuDays: "",
          postOpWardDays: "",
          anesthesiaPlanned: "",
          laterality: "",
          plasterOrBandages: [],
          plasterAdvice: "",
        },
        vitals: {},
        notes: "",
        advice: "",
        currentMedications: "",
        planDetails: "",
        proceduresPerformed: "",
      } as any);
      onMedicinesChange([]);
      onAdviceChange("");
      onFollowUpChange("");
    }
  }

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

  // Macro Text opener
  const handleOpenMacro = (
    field: "complaints" | "history" | "examination" | "advice" | "plan",
    cat: "complaints" | "examination" | "advice" | "plan" | "all"
  ) => {
    setMacroTargetField(field);
    setMacroCategory(cat);
    setIsMacroModalOpen(true);
  };

  // Macro Text handler
  const handleInsertMacroText = (text: string) => {
    if (!text) return;
    if (macroTargetField === "complaints") {
      const current = clinical.chiefComplaint?.trim() ?? "";
      const next = current ? `${current}\n${text}` : text;
      onClinicalChange({ ...clinical, chiefComplaint: next });
    } else if (macroTargetField === "history") {
      onClinicalChange({
        ...clinical,
        patientHistory: {
          ...(clinical.patientHistory ?? {}),
          presentIllness: text,
        } as any,
      });
    } else if (macroTargetField === "examination") {
      const current = clinical.examination?.jointsAndParts?.trim() ?? "";
      const next = current ? `${current}\n${text}` : text;
      onClinicalChange({
        ...clinical,
        examination: {
          ...clinical.examination,
          jointsAndParts: next,
        },
      });
    } else if (macroTargetField === "advice") {
      const current = advice?.trim() ?? "";
      const next = current ? `${current}\n${text}` : text;
      onAdviceChange(next);
    } else if (macroTargetField === "plan") {
      const current = currentPlanDetails.trim();
      const next = current ? `${current}\n${text}` : text;
      onClinicalChange({
        ...clinical,
        planDetails: next,
      } as any);
    }
  };

  // Custom Templates Handler
  const handleApplyTemplate = (template: ClinicalTemplate) => {
    const nextClinical: ConsultationClinicalData = {
      ...clinical,
      chiefComplaint: template.chiefComplaint || clinical.chiefComplaint || template.name,
      diagnosis: template.diagnosis || clinical.diagnosis || template.name,
      examination: {
        ...clinical.examination,
        jointsAndParts: template.examination || clinical.examination?.jointsAndParts,
      },
      investigationResults: {
        ...(clinical.investigationResults ?? {}),
        imaging: template.investigations || clinical.investigationResults?.imaging || "",
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
      `✓ Successfully applied template "${template.name}" with ${template.medicines.length} medicines, findings, and advice!`
    );
    setTimeout(() => setTemplateNotice(null), 5000);
  };

  // Bandages & Plasters Handlers
  const handleAddPlasterItem = (item: {
    name: string;
    site?: string;
    duration?: string;
    instructions?: string;
  }) => {
    if (!item.name?.trim()) return;
    const newItem: PlasterBandageItem = {
      id: "pb-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      name: item.name.trim(),
      site: item.site?.trim() || undefined,
      duration: item.duration?.trim() || undefined,
      instructions: item.instructions?.trim() || undefined,
    };
    const nextList = [...plasterOrBandages, newItem];

    let nextAdvice = plasterAdvice;
    if (!nextAdvice?.trim()) {
      const l = item.name.toLowerCase();
      if (l.includes("plaster") || l.includes("slab") || l.includes("cast")) {
        nextAdvice = "• Keep plaster strictly dry at all times; cover with plastic while bathing.\n• Keep limb elevated on pillows above chest level to reduce pain and swelling.\n• Strict Non-Weight Bearing: Do NOT put weight or walk on the plastered limb.\n• Actively move and wiggle fingers/toes regularly to maintain healthy blood circulation.\n• Contact doctor immediately if toes/fingers turn blue, cold, numb, or severely painful.";
      } else if (l.includes("crepe")) {
        nextAdvice = "• Rewrap crepe bandage snugly if it feels too loose or tight.\n• Remove crepe bandage while sleeping at night.\n• Keep limb elevated on pillows while resting.";
      } else if (l.includes("belt") || l.includes("collar")) {
        nextAdvice = "• Wear support belt/collar only while sitting, standing, and travelling; remove while sleeping/resting.\n• Avoid bending forward or lifting heavy objects.";
      }
    }

    onClinicalChange({
      ...clinical,
      treatmentPlan: {
        ...treatmentPlan,
        plasterOrBandages: nextList,
        plasterAdvice: nextAdvice,
      },
    });

    setPlasterNotice(`Added "${item.name}" ✓`);
    setTimeout(() => setPlasterNotice(null), 2500);
  };

  const handleRemovePlasterItem = (id: string) => {
    const nextList = plasterOrBandages.filter((it) => it.id !== id);
    onClinicalChange({
      ...clinical,
      treatmentPlan: {
        ...treatmentPlan,
        plasterOrBandages: nextList,
      },
    });
  };

  const handleUpdatePlasterItem = (
    id: string,
    updates: Partial<PlasterBandageItem>
  ) => {
    const nextList = plasterOrBandages.map((it) =>
      it.id === id ? { ...it, ...updates } : it
    );
    onClinicalChange({
      ...clinical,
      treatmentPlan: {
        ...treatmentPlan,
        plasterOrBandages: nextList,
      },
    });
  };

  const handlePlasterAdviceChange = (text: string) => {
    onClinicalChange({
      ...clinical,
      treatmentPlan: {
        ...treatmentPlan,
        plasterAdvice: text,
      },
    });
  };

  const handleTogglePlasterAdviceTag = (tag: string) => {
    const current = plasterAdvice?.trim() ?? "";
    if (current.includes(tag)) {
      const next = current
        .replace(new RegExp(`\\n?•?\\s*${escapeRegex(tag)}`, "g"), "")
        .trim();
      handlePlasterAdviceChange(next);
    } else {
      const next = current ? `${current}\n• ${tag}` : `• ${tag}`;
      handlePlasterAdviceChange(next);
    }
  };

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
  const defaultInvestigationList = useMemo(() => FAST_INVESTIGATION_CHIPS.map((c) => c.text), []);

  // Clinical Recommendations Hooks
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
    allOptions: investigationOptions,
    isFavorite: isInvestigationFavorite,
    isCustom: isInvestigationCustom,
    addCustom: addCustomInvestigation,
    removeCustom: removeCustomInvestigation,
    toggleFavorite: toggleInvestigationFavorite,
  } = useClinicalRecommendations("investigations", defaultInvestigationList);

  const {
    allOptions: adviceOptions,
    isFavorite: isAdviceFavorite,
    isCustom: isAdviceCustom,
    addCustom: addCustomAdvice,
    removeCustom: removeCustomAdvice,
    toggleFavorite: toggleAdviceFavorite,
  } = useClinicalRecommendations("advice", defaultAdviceList);

  const defaultPlasterPresets = useMemo(() => PRESET_PLASTERS.map((p) => p.name), []);
  const {
    allOptions: plasterOptions,
    isFavorite: isPlasterFavorite,
    isCustom: isPlasterCustom,
    addCustom: addCustomPlaster,
    removeCustom: removeCustomPlaster,
    toggleFavorite: togglePlasterFavorite,
  } = useClinicalRecommendations("plaster_applications", defaultPlasterPresets);

  const defaultPlasterAdviceList = useMemo(() => PLASTER_ADVICE_PRESETS, []);
  const {
    allOptions: plasterAdviceOptions,
    isFavorite: isPlasterAdviceFavorite,
    isCustom: isPlasterAdviceCustom,
    addCustom: addCustomPlasterAdvice,
    removeCustom: removeCustomPlasterAdvice,
    toggleFavorite: togglePlasterAdviceFavorite,
  } = useClinicalRecommendations("plaster_advice_precautions", defaultPlasterAdviceList);

  // Filtered lists for dropdown menus
  const filteredSymptoms = useMemo(() => {
    const q = symptomSearch.trim().toLowerCase();
    if (!q) return complaintsOptions;
    return complaintsOptions.filter((s) => s.toLowerCase().includes(q));
  }, [symptomSearch, complaintsOptions]);

  const filteredDiagnoses = useMemo(() => {
    const q = newDiagnosisInput.trim().toLowerCase();
    if (!q) return diagnosisOptions;
    return diagnosisOptions.filter((d) => d.toLowerCase().includes(q));
  }, [newDiagnosisInput, diagnosisOptions]);

  const filteredAdvice = useMemo(() => {
    const q = adviceFilter.trim().toLowerCase();
    if (!q) return adviceOptions;
    return adviceOptions.filter((a) => a.toLowerCase().includes(q));
  }, [adviceFilter, adviceOptions]);

  const filteredPlasterOptions = useMemo(() => {
    const q = plasterSearch.trim().toLowerCase();
    if (!q) return plasterOptions;
    return plasterOptions.filter((s) => s.toLowerCase().includes(q));
  }, [plasterSearch, plasterOptions]);

  const filteredPlasterAdviceOptions = useMemo(() => {
    const q = plasterAdviceSearch.trim().toLowerCase();
    if (!q) return plasterAdviceOptions;
    return plasterAdviceOptions.filter((s) => s.toLowerCase().includes(q));
  }, [plasterAdviceSearch, plasterAdviceOptions]);

  // Parse individual chief complaints
  const selectedComplaintsList = useMemo(() => {
    const raw = clinical.chiefComplaint?.trim() ?? "";
    if (!raw) return [];
    return raw
      .split(/\n|;|,|•/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }, [clinical.chiefComplaint]);

  function handleToggleSymptom(tag: QuickTag | string) {
    const text = typeof tag === "string" ? tag.trim() : tag.text.trim();
    if (!text) return;
    const isPresent = selectedComplaintsList.some(
      (c) => c.toLowerCase() === text.toLowerCase()
    );
    if (isPresent) {
      const remaining = selectedComplaintsList.filter(
        (c) => c.toLowerCase() !== text.toLowerCase()
      );
      const next = remaining.length > 0 ? remaining.join("; ") : "";
      onClinicalChange({ ...clinical, chiefComplaint: next });
    } else {
      const nextList = [...selectedComplaintsList, text];
      const next = nextList.join("; ");
      onClinicalChange({ ...clinical, chiefComplaint: next });
    }
  }

  // Parse diagnoses list (do NOT split by comma so descriptions/locations with comma are preserved)
  const selectedDiagnosesList = useMemo(() => {
    const raw = clinical.diagnosis?.trim() ?? "";
    if (!raw) return [];
    return raw
      .split(/\n|;|\r|•/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }, [clinical.diagnosis]);

  function handleToggleDiagnosis(text: string) {
    const cleanText = text.trim();
    if (!cleanText) return;
    const isPresent = selectedDiagnosesList.some(
      (d) => d.toLowerCase() === cleanText.toLowerCase()
    );
    if (isPresent) {
      const remaining = selectedDiagnosesList.filter(
        (d) => d.toLowerCase() !== cleanText.toLowerCase()
      );
      const next =
        remaining.length > 0 ? remaining.map((d) => `• ${d}`).join("\n") : "";
      onClinicalChange({ ...clinical, diagnosis: next });
    } else {
      const nextList = [...selectedDiagnosesList, cleanText];
      const next = nextList.map((d) => `• ${d}`).join("\n");
      onClinicalChange({ ...clinical, diagnosis: next });
    }
  }

  // Parse examination findings
  const selectedFindingsList = useMemo(() => {
    const raw = clinical.examination?.jointsAndParts?.trim() ?? "";
    if (!raw) return [];
    return raw
      .split(/\n|;|,|•/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }, [clinical.examination?.jointsAndParts]);

  function handleToggleExamNote(tag: QuickTag | string) {
    const text = typeof tag === "string" ? tag.trim() : tag.text.trim();
    if (!text) return;
    const isPresent = selectedFindingsList.some(
      (f) => f.toLowerCase() === text.toLowerCase()
    );
    if (isPresent) {
      const remaining = selectedFindingsList.filter(
        (f) => f.toLowerCase() !== text.toLowerCase()
      );
      const next = remaining.length > 0 ? remaining.map((f) => `• ${f}`).join("\n") : "";
      onClinicalChange({
        ...clinical,
        examination: {
          ...clinical.examination,
          jointsAndParts: next,
        },
      });
    } else {
      const nextList = [...selectedFindingsList, text];
      const next = nextList.map((f) => `• ${f}`).join("\n");
      onClinicalChange({
        ...clinical,
        examination: {
          ...clinical.examination,
          jointsAndParts: next,
        },
      });
    }
  }

  // Normal Examination (NAD)
  function handleSetNormalExam() {
    onClinicalChange({
      ...clinical,
      examination: {
        ...clinical.examination,
        jointsAndParts:
          "LS SPINE: LUMBER LORDOSIS MAINTAINED, ACTIVE SLR POSSIBLE, NO STRETCH PAIN PRESENT, FIG OF 4 FREE & PAINLESS. NO TENDERNESS, NO DEFORMITY, ROM FREE & PAINLESS. NORMAL EXAMINATION (NAD).",
      },
    });
  }

  // Investigations state
  const investigationText = useMemo(() => {
    const imaging = clinical.investigationResults?.imaging?.trim() ?? "";
    const labs = clinical.investigationResults?.labs?.trim() ?? "";
    const other = clinical.investigationResults?.other?.trim() ?? "";
    const parts = [imaging, labs, other].filter(Boolean);
    return parts.join("\n");
  }, [clinical.investigationResults]);

  function handleInvestigationTextChange(val: string) {
    onClinicalChange({
      ...clinical,
      investigationResults: {
        ...(clinical.investigationResults ?? {}),
        imaging: val,
      },
    });
  }

  const selectedInvestigationsList = useMemo(() => {
    if (!investigationText) return [];
    return investigationText
      .split(/\n|;|,|•/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }, [investigationText]);

  function handleToggleInvestigation(text: string) {
    const clean = text.trim();
    if (!clean) return;
    const isPresent = selectedInvestigationsList.some(
      (inv) => inv.toLowerCase() === clean.toLowerCase()
    );
    if (isPresent) {
      const remaining = selectedInvestigationsList.filter(
        (inv) => inv.toLowerCase() !== clean.toLowerCase()
      );
      const next = remaining.length > 0 ? remaining.map((s) => `• ${s}`).join("\n") : "";
      handleInvestigationTextChange(next);
    } else {
      const nextList = [...selectedInvestigationsList, clean];
      const next = nextList.map((s) => `• ${s}`).join("\n");
      handleInvestigationTextChange(next);
    }
  }

  // Medicines handlers
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

  // Add medicine from the dedicated Apollo-style form
  function handleAddFromApolloForm() {
    if (!newMedName.trim()) return;

    // Build frequency string from M, A, E, N or dropdown
    let freqStr = newMedFreq;
    const times = [medDoseM ? "1" : "0", medDoseA ? "1" : "0", medDoseE ? "1" : "0", medDoseN ? "1" : "0"];
    if (medDoseM || medDoseA || medDoseE || medDoseN) {
      freqStr = `${times.join("-")} (${newMedFreq.split("-")[0].trim()})`;
    }

    const newMed: Medicine = {
      name: newMedName.trim(),
      dosage: `${newMedDose} ${newMedUnit}`,
      route: newMedRoute,
      frequency: freqStr,
      duration: `${newMedDuration} ${newMedDurationUnit}`,
      instructions: newMedComments.trim() ? `${newMedMeal}; ${newMedComments.trim()}` : newMedMeal,
    };

    rememberRecentMedicine(newMed.name);
    onMedicinesChange([...medicines, newMed]);
    setNewMedName("");
    setNewMedComments("");
  }

  // Apply Rapid Dosing Preset
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

  // Scroll to section helper
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const superTemplates = getClinicalTemplatesBySpecialty(treatmentMode);

  return (
    <div className="flex flex-col gap-3 p-3 md:p-5 max-w-7xl mx-auto font-sans bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* APOLLO SOM EMR SUB-HEADER: PARAMETERS & CUSTOM TEMPLATES */}
      <div className="sticky top-12 z-20 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-2 backdrop-blur shadow-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* All Parameters Button */}
          <button
            type="button"
            onClick={() => setCollapsedSections({})}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
            title="Expand / View all clinical parameters"
          >
            <Icon icon={faFileLines} className="size-3 text-slate-500" />
            <span>All Parameters</span>
          </button>

          {/* Custom Template Button (Exact Apollo SOM EMR Subheader Action) */}
          <button
            type="button"
            onClick={() => {
              setTemplatesModalMode("apply");
              setIsTemplatesModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-3 py-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors shadow-2xs cursor-pointer"
            title="Open Custom Templates & Clinical Protocols"
          >
            <Icon icon={faBookmark} className="size-3 text-purple-600 dark:text-purple-400" />
            <span>Custom Template</span>
          </button>

          {/* Clear All Consultation Details */}
          <button
            type="button"
            onClick={handleClearAllDetails}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-2.5 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors shadow-2xs cursor-pointer"
            title="Clear all consultation details entered"
          >
            <Icon icon={faTrashCan} className="size-2.5 text-rose-600" />
            <span>Clear All</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

          {/* Section Quick Jump Pills */}
          <div className="hidden lg:flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            <button
              type="button"
              onClick={() => scrollToSection("sec-complaints")}
              className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Complaints
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => scrollToSection("sec-history")}
              className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              History
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => scrollToSection("sec-exam")}
              className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Examination
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => scrollToSection("sec-diagnosis")}
              className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Diagnosis
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => scrollToSection("sec-investigations")}
              className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Investigations
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => scrollToSection("sec-medicines")}
              className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-bold text-purple-700 dark:text-purple-400"
            >
              Medicines ({medicines.filter((m) => m.name?.trim()).length})
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => scrollToSection("sec-advice")}
              className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Advice
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => scrollToSection("sec-plan")}
              className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-bold text-indigo-700 dark:text-indigo-400"
            >
              Plan
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => scrollToSection("sec-followup")}
              className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Follow Up
            </button>
          </div>
        </div>

        {/* Specialty Selector */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Specialty:</span>
          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => onTreatmentModeChange("orthopedics")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                treatmentMode === "orthopedics"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              🦴 Ortho
            </button>
            <button
              type="button"
              onClick={() => onTreatmentModeChange("general")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                treatmentMode === "general"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              🩺 General
            </button>
          </div>
        </div>
      </div>

      {/* REVISIT NOTIFICATION (IF RETURNING PATIENT) */}
      {previousVisit && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/40 p-2.5 text-xs text-sky-950 dark:text-sky-200">
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

      {/* COMPACT VITALS BANNER */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <Icon icon={faHeartPulse} className="size-3 text-rose-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Vital Signs
            </span>
          </div>
          {Object.values(vitals).some((v) => Boolean(v?.trim())) && (
            <button
              type="button"
              onClick={() => onClinicalChange({ ...clinical, vitals: {} })}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer px-1.5"
            >
              Clear
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <div>
            <label className="text-[10px] font-semibold text-slate-500">BP (mmHg)</label>
            <Input
              value={vitals.bp ?? ""}
              onChange={(e) =>
                onClinicalChange({
                  ...clinical,
                  vitals: { ...vitals, bp: e.target.value },
                })
              }
              placeholder="120/80"
              className="h-8 text-xs font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500">Pulse (bpm)</label>
            <Input
              value={vitals.pulse ?? ""}
              onChange={(e) =>
                onClinicalChange({
                  ...clinical,
                  vitals: { ...vitals, pulse: e.target.value },
                })
              }
              placeholder="74"
              className="h-8 text-xs font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500">Weight (kg)</label>
            <Input
              value={vitals.weight ?? ""}
              onChange={(e) =>
                onClinicalChange({
                  ...clinical,
                  vitals: { ...vitals, weight: e.target.value },
                })
              }
              placeholder="68"
              className="h-8 text-xs font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500">SpO2 (%)</label>
            <Input
              value={vitals.spo2 ?? ""}
              onChange={(e) =>
                onClinicalChange({
                  ...clinical,
                  vitals: { ...vitals, spo2: e.target.value },
                })
              }
              placeholder="98"
              className="h-8 text-xs font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500">Temp (°F)</label>
            <Input
              value={vitals.temp ?? ""}
              onChange={(e) =>
                onClinicalChange({
                  ...clinical,
                  vitals: { ...vitals, temp: e.target.value },
                })
              }
              placeholder="98.6"
              className="h-8 text-xs font-bold"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* APOLLO SOM EMR COLLAPSIBLE CLINICAL ACCORDIONS                            */}
      {/* ========================================================================= */}

      
      {/* TWO-COLUMN LAYOUT: LEFT SECTION ICON RAIL + MAIN CLINICAL CARDS */}
      <div className="flex items-start gap-3 w-full">
        {/* APOLLO SOM EMR LEFT VERTICAL ICON RAIL */}
        <div className="w-10 sm:w-11 shrink-0 hidden md:flex flex-col items-center gap-1.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl sticky top-28 shadow-2xs">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Scroll to top"
          >
            <Icon icon={faChevronUp} className="size-3.5" />
          </button>
          <div className="w-6 h-px bg-slate-200 dark:bg-slate-700 my-0.5" />
          <button
            type="button"
            onClick={() => scrollToSection("sec-complaints")}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Complaints"
          >
            <Icon icon={faFileLines} className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("sec-history")}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="History of Present Illness"
          >
            <Icon icon={faClock} className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("sec-current-meds")}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Current Medication"
          >
            <Icon icon={faPills} className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("sec-exam")}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Physical Examination"
          >
            <Icon icon={faBone} className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("sec-exam-attachments")}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Attachments"
          >
            <Icon icon={faPaperclip} className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("sec-diagnosis")}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Diagnosis"
          >
            <Icon icon={faStethoscope} className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("sec-investigations")}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Investigation Results"
          >
            <Icon icon={faFlaskVial} className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("sec-advised-investigations")}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Advised Investigations"
          >
            <Icon icon={faFileContract} className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("sec-plasters")}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Bandages, Plasters & Supports"
          >
            <Icon icon={faBandage} className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("sec-procedures")}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Procedures Performed"
          >
            <Icon icon={faStethoscope} className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("sec-medicines")}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Medicines"
          >
            <Icon icon={faPills} className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("sec-advice")}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Advice"
          >
            <Icon icon={faHeartPulse} className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("sec-plan")}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Treatment Plan"
          >
            <Icon icon={faNotesMedical} className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("sec-followup")}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Follow Up"
          >
            <Icon icon={faClock} className="size-3.5" />
          </button>
        </div>

        {/* MAIN COLUMN OF CLINICAL ACCORDIONS */}
        <div className="flex-1 min-w-0 space-y-3">

      {/* SECTION 1: COMPLAINTS */}
      <div id="sec-complaints" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {/* Accordion Header (Grey Bar Matching Apollo SOM EMR) */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <Icon icon={faStethoscope} className="size-3.5 text-slate-600 dark:text-slate-300" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Complaints
            </span>
            {selectedComplaintsList.length > 0 && (
              <span className="rounded bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.2 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                {selectedComplaintsList.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Macro Text Button */}
            <button
              type="button"
              onClick={() => handleOpenMacro("complaints", "complaints")}
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs"
              title="Open Macro Text selector"
            >
              <Icon icon={faFileLines} className="size-2.5 text-indigo-600" />
              <span>Macro Text</span>
            </button>

            {/* Suggestions Trigger */}
            <button
              type="button"
              onClick={() => setSymptomsMenuOpen((v) => !v)}
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs"
            >
              <Icon icon={faWandMagicSparkles} className="size-2.5 text-amber-600" />
              <span>Suggestions ({complaintsOptions.length})</span>
            </button>

            {clinical.chiefComplaint?.trim() && (
              <button
                type="button"
                onClick={() => onClinicalChange({ ...clinical, chiefComplaint: "" })}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer px-1.5"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={() => toggleSection("complaints")}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <Icon icon={collapsedSections.complaints ? faChevronDown : faChevronUp} className="size-3" />
            </button>
          </div>
        </div>

        {/* Section Body */}
        {!collapsedSections.complaints && (
          <div className="p-4 space-y-2.5">
            <Textarea
              value={clinical.chiefComplaint ?? ""}
              onChange={(e) => onClinicalChange({ ...clinical, chiefComplaint: e.target.value })}
              placeholder="Chief complaints, onset, and duration..."
              rows={3}
              className="w-full text-xs font-mono font-medium resize-none leading-relaxed border-slate-200 dark:border-slate-700 focus:border-indigo-500 bg-white dark:bg-slate-900 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* SECTION 2: HISTORY OF PRESENT ILLNESS */}
      <div id="sec-history" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <Icon icon={faClock} className="size-3.5 text-slate-600 dark:text-slate-300" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              History of Present Illness
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenMacro("history", "complaints")}
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs"
            >
              <Icon icon={faFileLines} className="size-2.5 text-indigo-600" />
              <span>Macro Text</span>
            </button>

            {historyOfPresentIllness && (
              <button
                type="button"
                onClick={() =>
                  onClinicalChange({
                    ...clinical,
                    patientHistory: {
                      ...(clinical.patientHistory ?? {}),
                      presentIllness: "",
                    } as any,
                  })
                }
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer px-1.5"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={() => toggleSection("history")}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <Icon icon={collapsedSections.history ? faChevronDown : faChevronUp} className="size-3" />
            </button>
          </div>
        </div>

        {!collapsedSections.history && (
          <div className="p-4">
            <Textarea
              value={historyOfPresentIllness}
              onChange={(e) =>
                onClinicalChange({
                  ...clinical,
                  patientHistory: {
                    ...(clinical.patientHistory ?? {}),
                    presentIllness: e.target.value,
                  } as any,
                })
              }
              placeholder="History of present illness, previous treatments, and relevant medical history..."
              rows={2}
              className="w-full text-xs font-mono font-medium resize-none leading-relaxed border-slate-200 dark:border-slate-700 focus:border-indigo-500 bg-white dark:bg-slate-900 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* SECTION 3: CURRENT MEDICATION */}
      <div id="sec-current-meds" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <Icon icon={faPills} className="size-3.5 text-slate-600 dark:text-slate-300" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Current Medication
            </span>
          </div>

          <div className="flex items-center gap-2">
            {((clinical as any).currentMedications?.trim()) && (
              <button
                type="button"
                onClick={() => onClinicalChange({ ...clinical, currentMedications: "" } as any)}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer px-1.5"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={() => toggleSection("currentMeds")}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <Icon icon={collapsedSections.currentMeds ? faChevronDown : faChevronUp} className="size-3" />
            </button>
          </div>
        </div>

        {!collapsedSections.currentMeds && (
          <div className="p-4">
            <Textarea
              value={(clinical as any).currentMedications || ""}
              onChange={(e) => onClinicalChange({ ...clinical, currentMedications: e.target.value } as any)}
              placeholder="Existing medicines patient is currently taking..."
              rows={2}
              className="w-full text-xs font-medium resize-none leading-relaxed border-slate-200 dark:border-slate-700 focus:border-indigo-500 bg-white dark:bg-slate-900 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* SECTION 4: PHYSICAL EXAMINATION */}
      <div id="sec-exam" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <Icon icon={faBone} className="size-3.5 text-slate-600 dark:text-slate-300" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Physical Examination
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSetNormalExam}
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 cursor-pointer shadow-2xs"
            >
              <Icon icon={faCheck} className="size-2.5 text-emerald-600" />
              <span>Normal / NAD</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenMacro("examination", "examination")}
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs"
            >
              <Icon icon={faFileLines} className="size-2.5 text-indigo-600" />
              <span>Macro Text</span>
            </button>

            {clinical.examination?.jointsAndParts?.trim() && (
              <button
                type="button"
                onClick={() =>
                  onClinicalChange({
                    ...clinical,
                    examination: { ...clinical.examination, jointsAndParts: "" },
                  })
                }
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer px-1.5"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={() => toggleSection("exam")}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <Icon icon={collapsedSections.exam ? faChevronDown : faChevronUp} className="size-3" />
            </button>
          </div>
        </div>

        {!collapsedSections.exam && (
          <div className="p-4 space-y-3">
            <Textarea
              value={clinical.examination?.jointsAndParts ?? ""}
              onChange={(e) =>
                onClinicalChange({
                  ...clinical,
                  examination: { ...clinical.examination, jointsAndParts: e.target.value },
                })
              }
              placeholder="Physical examination findings, range of motion, and special tests..."
              rows={3}
              className="w-full text-xs font-mono font-medium resize-none leading-relaxed border-slate-200 dark:border-slate-700 focus:border-indigo-500 bg-white dark:bg-slate-900 rounded-lg"
            />

            {/* Attachments Section (Exact Apollo SOM EMR Subsection) */}
            <div id="sec-exam-attachments" className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Icon icon={faPaperclip} className="size-3 text-slate-500" />
                  Attachments
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="text-[11px] font-bold text-indigo-700 hover:underline cursor-pointer"
                  >
                    Add New
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    className="text-[11px] font-bold text-indigo-700 hover:underline cursor-pointer"
                  >
                    Add From Favourites
                  </button>
                </div>
              </div>
              <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-3 text-center text-xs text-slate-500">
                <Icon icon={faUpload} className="size-4 mb-1 text-slate-400 block mx-auto" />
                Upload clinical attachments, X-rays, or photograph
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 5: DIAGNOSIS */}
      <div id="sec-diagnosis" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <Icon icon={faStethoscope} className="size-3.5 text-slate-600 dark:text-slate-300" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Diagnosis
            </span>
            {selectedDiagnosesList.length > 0 && (
              <span className="rounded bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                {selectedDiagnosesList.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {clinical.diagnosis?.trim() && (
              <button
                type="button"
                onClick={() => onClinicalChange({ ...clinical, diagnosis: "" })}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer px-1.5"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={() => toggleSection("diagnosis")}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <Icon icon={collapsedSections.diagnosis ? faChevronDown : faChevronUp} className="size-3" />
            </button>
          </div>
        </div>

        {!collapsedSections.diagnosis && (
          <div className="p-4 space-y-3">
            {/* Apollo SOM EMR Structured Diagnosis Entry Grid */}
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Current Diagnosis
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                {/* Search SNOMED / Diagnosis */}
                <div className="sm:col-span-2 relative">
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">SNOMED / Diagnosis *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={diagSearch}
                      onChange={(e) => setDiagSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && diagSearch.trim()) {
                          e.preventDefault();
                          const full = [diagSearch.trim(), diagSide !== "Select" ? `(${diagSide})` : "", diagLocation ? `Location: ${diagLocation}` : ""].filter(Boolean).join(" ");
                          handleToggleDiagnosis(full);
                          setDiagSearch("");
                          setDiagLocation("");
                        }
                      }}
                      placeholder="Search SNOMED or enter diagnosis..."
                      className="w-full h-8 pl-2.5 pr-7 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <Icon icon={faMagnifyingGlass} className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Select Side */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Select Side</label>
                  <select
                    value={diagSide}
                    onChange={(e) => setDiagSide(e.target.value)}
                    className="w-full h-8 px-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Select">Select</option>
                    <option value="Left">Left</option>
                    <option value="Right">Right</option>
                    <option value="Bilateral">Bilateral</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Location</label>
                  <input
                    type="text"
                    value={diagLocation}
                    onChange={(e) => setDiagLocation(e.target.value)}
                    placeholder="Anatomical location or joint..."
                    className="w-full h-8 px-2.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Row 2: Onset / Duration & Add Button */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-500">Onset / Duration:</span>
                  <input
                    type="number"
                    value={diagOnsetNum}
                    onChange={(e) => setDiagOnsetNum(e.target.value)}
                    placeholder="4"
                    className="h-7 w-16 px-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-bold"
                  />
                  <select
                    value={diagOnsetUnit}
                    onChange={(e) => setDiagOnsetUnit(e.target.value)}
                    className="h-7 px-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                  >
                    <option value="Days">Days</option>
                    <option value="Weeks">Weeks</option>
                    <option value="Months">Months</option>
                  </select>
                  <select
                    value={diagType}
                    onChange={(e) => setDiagType(e.target.value as any)}
                    className="h-7 px-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-emerald-800"
                  >
                    <option value="Provisional">Provisional</option>
                    <option value="Definitive">Definitive</option>
                    <option value="Secondary">Secondary</option>
                  </select>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (diagSearch.trim()) {
                      const full = [
                        diagSearch.trim(),
                        diagSide !== "Select" ? `(${diagSide})` : "",
                        diagLocation ? `Location: ${diagLocation}` : "",
                        diagOnsetNum ? `Onset: ${diagOnsetNum} ${diagOnsetUnit}` : "",
                      ]
                        .filter(Boolean)
                        .join(" ");
                      handleToggleDiagnosis(full);
                      setDiagSearch("");
                      setDiagLocation("");
                      setDiagOnsetNum("");
                    }
                  }}
                  disabled={!diagSearch.trim()}
                  className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  + Add Diagnosis
                </Button>
              </div>
            </div>

            {/* APOLLO SOM EMR DIAGNOSIS TABLE */}
            {selectedDiagnosesList.length > 0 && (
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    <tr>
                      <th className="py-2 px-3">Diagnosis</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3 text-center">Print</th>
                      <th className="py-2 px-3 text-center">Fav</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {selectedDiagnosesList.map((diag, i) => (
                      <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 dark:text-white mr-2">::</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{diag}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 text-[11px] font-bold border border-emerald-200">
                            Provisional
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input type="checkbox" defaultChecked className="size-3.5 text-emerald-600 rounded" />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleDiagnosisFavorite(diag)}
                            className="text-slate-300 hover:text-amber-500"
                          >
                            <Icon icon={faStar} className={`size-3 ${isDiagnosisFavorite(diag) ? "text-amber-500 fill-amber-500" : ""}`} />
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleDiagnosis(diag)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete diagnosis"
                          >
                            <Icon icon={faTrashCan} className="size-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 6: INVESTIGATION RESULTS */}
      <div id="sec-investigations" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <Icon icon={faFlaskVial} className="size-3.5 text-slate-600 dark:text-slate-300" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Investigation Results
            </span>
          </div>

          <div className="flex items-center gap-2">
            {investigationText.trim() && (
              <button
                type="button"
                onClick={() =>
                  onClinicalChange({
                    ...clinical,
                    investigationResults: {
                      ...(clinical.investigationResults ?? {}),
                      labs: "",
                      imaging: "",
                      other: "",
                    },
                  })
                }
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer px-1.5"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={() => toggleSection("investigations")}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <Icon icon={collapsedSections.investigations ? faChevronDown : faChevronUp} className="size-3" />
            </button>
          </div>
        </div>

        {!collapsedSections.investigations && (
          <div className="p-4 space-y-2.5">
            <Textarea
              value={investigationText}
              onChange={(e) => handleInvestigationTextChange(e.target.value)}
              placeholder="Past investigation findings, previous X-rays, MRI, and laboratory reports..."
              rows={2}
              className="w-full text-xs font-mono font-medium resize-none leading-relaxed border-slate-200 dark:border-slate-700 focus:border-indigo-500 bg-white dark:bg-slate-900 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* SECTION 7: OTHER TESTS */}
      <div id="sec-other-tests" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <Icon icon={faFlaskVial} className="size-3.5 text-slate-600 dark:text-slate-300" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Other Tests
            </span>
          </div>

          <div className="flex items-center gap-2">
            {Boolean((clinical.investigationResults as any)?.other?.trim()) && (
              <button
                type="button"
                onClick={() =>
                  onClinicalChange({
                    ...clinical,
                    investigationResults: {
                      ...(clinical.investigationResults ?? {}),
                      other: "",
                    },
                  })
                }
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer px-1.5"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={() => toggleSection("otherTests")}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <Icon icon={collapsedSections.otherTests ? faChevronDown : faChevronUp} className="size-3" />
            </button>
          </div>
        </div>

        {!collapsedSections.otherTests && (
          <div className="p-4">
            <Textarea
              value={(clinical.investigationResults as any)?.other ?? ""}
              onChange={(e) =>
                onClinicalChange({
                  ...clinical,
                  investigationResults: {
                    ...(clinical.investigationResults ?? {}),
                    other: e.target.value,
                  },
                })
              }
              placeholder="Other clinical tests, ECG, bone densitometry, or nerve conduction..."
              rows={2}
              className="w-full text-xs font-mono font-medium resize-none leading-relaxed border-slate-200 dark:border-slate-700 focus:border-indigo-500 bg-white dark:bg-slate-900 rounded-lg"
            />
          </div>
        )}
      </div>

      
      {/* SECTION 8: ADVISED INVESTIGATIONS */}
      <div id="sec-advised-investigations" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <Icon icon={faFlaskVial} className="size-3.5 text-slate-600 dark:text-slate-300" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Advised Investigations
            </span>
            {clinical.investigationResults?.imaging?.trim() && (
              <span className="rounded bg-teal-100 dark:bg-teal-900/60 px-1.5 py-0.2 text-[10px] font-bold text-teal-800 dark:text-teal-300">
                Advised
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setInvMenuOpen((v) => !v)}
                className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs"
                title="View standard laboratory & imaging orders"
              >
                <Icon icon={faWandMagicSparkles} className="size-2.5 text-teal-600" />
                <span>Suggestions ({FAST_INVESTIGATION_CHIPS.length})</span>
                <Icon icon={faChevronDown} className="size-2 text-slate-400" />
              </button>

              {invMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-30 p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Standard Laboratory & Imaging Tests
                    </span>
                    <button
                      type="button"
                      onClick={() => setInvMenuOpen(false)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <Icon icon={faXmark} className="size-3" />
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {FAST_INVESTIGATION_CHIPS.map((chip) => {
                      const current = clinical.investigationResults?.imaging || "";
                      const isSelected = current.includes(chip.text);
                      return (
                        <div
                          key={chip.label}
                          onClick={() => {
                            const next = isSelected
                              ? current.replace(new RegExp(`\\n?•?\\s*${escapeRegex(chip.text)}`, "g"), "").trim()
                              : current ? `${current}\n• ${chip.text}` : `• ${chip.text}`;
                            onClinicalChange({
                              ...clinical,
                              investigationResults: {
                                ...(clinical.investigationResults ?? {}),
                                imaging: next,
                              },
                            });
                          }}
                          className={`p-1.5 rounded-lg text-xs cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 font-bold border border-teal-200"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span>{chip.text}</span>
                          {isSelected && <Icon icon={faCheck} className="size-2.5 text-teal-600" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {clinical.investigationResults?.imaging?.trim() && (
              <button
                type="button"
                onClick={() =>
                  onClinicalChange({
                    ...clinical,
                    investigationResults: {
                      ...(clinical.investigationResults ?? {}),
                      imaging: "",
                    },
                  })
                }
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer px-1.5"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={() => toggleSection("advisedInvestigations")}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <Icon icon={collapsedSections.advisedInvestigations ? faChevronDown : faChevronUp} className="size-3" />
            </button>
          </div>
        </div>

        {!collapsedSections.advisedInvestigations && (
          <div className="p-4 space-y-2.5">
            <Textarea
              value={clinical.investigationResults?.imaging ?? ""}
              onChange={(e) =>
                onClinicalChange({
                  ...clinical,
                  investigationResults: {
                    ...(clinical.investigationResults ?? {}),
                    imaging: e.target.value,
                  },
                })
              }
              placeholder="Advised laboratory investigations, imaging orders, and diagnostic directives..."
              rows={2}
              className="w-full text-xs font-mono font-medium resize-none leading-relaxed border-slate-200 dark:border-slate-700 focus:border-teal-500 bg-white dark:bg-slate-900 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* SECTION 8: BANDAGES, PLASTERS & SUPPORTS */}
      <div id="sec-plasters" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-visible">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <Icon icon={faBandage} className="size-3.5 text-slate-600 dark:text-slate-300" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Bandages, Plasters & Supports
            </span>
            {plasterOrBandages.length > 0 && (
              <span className="rounded bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.2 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                {plasterOrBandages.length} applied
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Suggestions Trigger & Dropdown */}
            <div className="relative" ref={plasterMenuRef}>
              <button
                type="button"
                onClick={() => setPlasterMenuOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-600 cursor-pointer shadow-2xs"
                title="View popular orthopedic appliances & bandages or add custom suggestions"
              >
                <Icon icon={faWandMagicSparkles} className="size-2.5 text-indigo-600" />
                <span>Suggestions ({plasterOptions.length})</span>
                <Icon icon={faChevronDown} className="size-2 text-slate-400" />
              </button>

              {plasterMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-30 p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Popular Appliances & Bandages
                    </span>
                    <button
                      type="button"
                      onClick={() => setPlasterMenuOpen(false)}
                      className="text-slate-400 hover:text-slate-700 p-0.5"
                    >
                      <Icon icon={faXmark} className="size-3" />
                    </button>
                  </div>

                  {/* Search box */}
                  <div className="relative">
                    <input
                      type="text"
                      value={plasterSearch}
                      onChange={(e) => setPlasterSearch(e.target.value)}
                      placeholder="Search appliance or bandage..."
                      className="w-full h-7 pl-2.5 pr-7 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <Icon icon={faMagnifyingGlass} className="absolute right-2 top-1/2 -translate-y-1/2 size-2.5 text-slate-400 pointer-events-none" />
                  </div>

                  {/* Scrollable list */}
                  <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                    {filteredPlasterOptions.map((opt) => {
                      const details = getPlasterPresetDetails(opt);
                      const isApplied = plasterOrBandages.some(
                        (it) => it.name.toLowerCase() === opt.toLowerCase()
                      );
                      const isFav = isPlasterFavorite(opt);
                      const isCust = isPlasterCustom(opt);

                      return (
                        <div
                          key={opt}
                          className={`flex items-center justify-between gap-1.5 p-2 rounded-lg text-xs transition-colors ${
                            isApplied
                              ? "bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 font-bold text-indigo-900 dark:text-indigo-200"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => {
                              if (isApplied) {
                                const target = plasterOrBandages.find(
                                  (it) => it.name.toLowerCase() === opt.toLowerCase()
                                );
                                if (target) handleRemovePlasterItem(target.id);
                              } else {
                                handleAddPlasterItem({
                                  name: opt,
                                  site: details.site,
                                  duration: details.duration,
                                  instructions: details.instructions,
                                });
                              }
                            }}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold">{opt}</span>
                              {isApplied && (
                                <span className="text-[10px] rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1 font-bold">
                                  Applied
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              {details.site} · {details.duration} · {details.instructions}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => togglePlasterFavorite(opt)}
                              className={`p-1 cursor-pointer ${isFav ? "text-amber-500" : "text-slate-300 hover:text-amber-400"}`}
                              title={isFav ? "Favorited" : "Mark as favorite"}
                            >
                              <Icon icon={faStar} className="size-2.5" />
                            </button>
                            {isCust && (
                              <button
                                type="button"
                                onClick={() => removeCustomPlaster(opt)}
                                className="p-1 text-slate-300 hover:text-rose-500 cursor-pointer"
                                title="Delete custom suggestion"
                              >
                                <Icon icon={faTrashCan} className="size-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add New Custom Suggestion */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      + Add New Application Suggestion
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newPlasterSuggestionInput}
                        onChange={(e) => setNewPlasterSuggestionInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newPlasterSuggestionInput.trim()) {
                            e.preventDefault();
                            addCustomPlaster(newPlasterSuggestionInput.trim());
                            handleAddPlasterItem({
                              name: newPlasterSuggestionInput.trim(),
                              site: "Affected Joint",
                              duration: "2 weeks",
                              instructions: "As advised by doctor",
                            });
                            setNewPlasterSuggestionInput("");
                          }
                        }}
                        placeholder="Appliance or bandage name..."
                        className="flex-1 h-7 px-2 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (newPlasterSuggestionInput.trim()) {
                            addCustomPlaster(newPlasterSuggestionInput.trim());
                            handleAddPlasterItem({
                              name: newPlasterSuggestionInput.trim(),
                              site: "Affected Joint",
                              duration: "2 weeks",
                              instructions: "As advised by doctor",
                            });
                            setNewPlasterSuggestionInput("");
                          }
                        }}
                        disabled={!newPlasterSuggestionInput.trim()}
                        className="h-7 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {(plasterOrBandages.length > 0 || plasterAdvice?.trim()) && (
              <button
                type="button"
                onClick={() => {
                  onClinicalChange({
                    ...clinical,
                    treatmentPlan: {
                      ...treatmentPlan,
                      plasterOrBandages: [],
                      plasterAdvice: "",
                    },
                  });
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer px-1.5"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={() => toggleSection("plasters")}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <Icon icon={collapsedSections.plasters ? faChevronDown : faChevronUp} className="size-3" />
            </button>
          </div>
        </div>

        {!collapsedSections.plasters && (
          <div className="p-4 space-y-3">
            {/* Active Prescribed Bandages with Inline Editing */}
            {plasterOrBandages.length > 0 && (
              <div className="grid gap-2 pt-1">
                {plasterOrBandages.map((item, idx) => {
                  const isEditing = editingPlasterId === item.id;

                  if (isEditing) {
                    return (
                      <div
                        key={item.id || idx}
                        className="p-3 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 shadow-xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-indigo-700">
                          <span>Edit Application #{idx + 1}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            Edit details and click Save Changes
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                              Item Name
                            </label>
                            <Input
                              value={editPlasterName}
                              onChange={(e) => setEditPlasterName(e.target.value)}
                              className="h-8 text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                              Body Site / Side
                            </label>
                            <Input
                              value={editPlasterSite}
                              onChange={(e) => setEditPlasterSite(e.target.value)}
                              placeholder="Body site or side"
                              className="h-8 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                              Duration
                            </label>
                            <Input
                              value={editPlasterDuration}
                              onChange={(e) => setEditPlasterDuration(e.target.value)}
                              placeholder="Duration"
                              className="h-8 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                              Wear Instructions
                            </label>
                            <Input
                              value={editPlasterInstructions}
                              onChange={(e) => setEditPlasterInstructions(e.target.value)}
                              placeholder="Wear instructions"
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setEditingPlasterId(null)}
                            className="h-7 px-3 text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              if (editPlasterName.trim()) {
                                handleUpdatePlasterItem(item.id, {
                                  name: editPlasterName.trim(),
                                  site: editPlasterSite.trim() || undefined,
                                  duration: editPlasterDuration.trim() || undefined,
                                  instructions: editPlasterInstructions.trim() || undefined,
                                });
                                setEditingPlasterId(null);
                              }
                            }}
                            className="h-7 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
                          >
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id || idx}
                      className="p-2.5 rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <div
                        className="flex items-center gap-2 flex-wrap flex-1 cursor-pointer"
                        onClick={() => {
                          setEditingPlasterId(item.id);
                          setEditPlasterName(item.name);
                          setEditPlasterSite(item.site || "");
                          setEditPlasterDuration(item.duration || "");
                          setEditPlasterInstructions(item.instructions || "");
                        }}
                        title="Click to edit this suggestion"
                      >
                        <span className="font-bold text-indigo-700 dark:text-indigo-300">
                          #{idx + 1} {item.name}
                        </span>
                        {item.site && (
                          <span className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-[11px] font-medium">
                            📍 {item.site}
                          </span>
                        )}
                        {item.duration && (
                          <span className="bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 text-[11px] font-bold">
                            ⏱️ {item.duration}
                          </span>
                        )}
                        {item.instructions && (
                          <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                            📋 {item.instructions}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPlasterId(item.id);
                            setEditPlasterName(item.name);
                            setEditPlasterSite(item.site || "");
                            setEditPlasterDuration(item.duration || "");
                            setEditPlasterInstructions(item.instructions || "");
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                          title="Edit this application / suggestion"
                        >
                          <Icon icon={faPen} className="size-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePlasterItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Remove application"
                        >
                          <Icon icon={faTrashCan} className="size-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Custom Plaster Add Box */}
            <div className="p-2.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                + Add Custom Appliance / Bandage / Plaster
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <Input
                  value={newPlasterName}
                  onChange={(e) => setNewPlasterName(e.target.value)}
                  placeholder="Appliance or bandage name..."
                  className="h-8 text-xs font-semibold"
                />
                <Input
                  value={newPlasterSite}
                  onChange={(e) => setNewPlasterSite(e.target.value)}
                  placeholder="Body site or side..."
                  className="h-8 text-xs"
                />
                <Input
                  value={newPlasterDuration}
                  onChange={(e) => setNewPlasterDuration(e.target.value)}
                  placeholder="Duration..."
                  className="h-8 text-xs"
                />
                <div className="flex items-center gap-1.5">
                  <Input
                    value={newPlasterInstructions}
                    onChange={(e) => setNewPlasterInstructions(e.target.value)}
                    placeholder="Wear instructions..."
                    className="h-8 text-xs flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (newPlasterName.trim()) {
                        handleAddPlasterItem({
                          name: newPlasterName.trim(),
                          site: newPlasterSite,
                          duration: newPlasterDuration,
                          instructions: newPlasterInstructions,
                        });
                        setNewPlasterName("");
                        setNewPlasterSite("");
                        setNewPlasterDuration("");
                        setNewPlasterInstructions("");
                      }
                    }}
                    disabled={!newPlasterName.trim()}
                    className="h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                  >
                    + Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Plaster Care Advice / Precautions with Dropdown & Custom Suggestion Addition */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Plaster & Bandage Care Advice / Precautions
                </div>

                <div className="flex items-center gap-2">
                  {/* Precautions Dropdown */}
                  <div className="relative" ref={plasterAdviceMenuRef}>
                    <button
                      type="button"
                      onClick={() => setPlasterAdviceMenuOpen((v) => !v)}
                      className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-600 cursor-pointer shadow-2xs"
                      title="View standard plaster care instructions or add custom precautions"
                    >
                      <Icon icon={faWandMagicSparkles} className="size-2.5 text-indigo-600" />
                      <span>Precautions ({plasterAdviceOptions.length})</span>
                      <Icon icon={faChevronDown} className="size-2 text-slate-400" />
                    </button>

                    {plasterAdviceMenuOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-30 p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            Care Advice & Precautions
                          </span>
                          <button
                            type="button"
                            onClick={() => setPlasterAdviceMenuOpen(false)}
                            className="text-slate-400 hover:text-slate-700 p-0.5"
                          >
                            <Icon icon={faXmark} className="size-3" />
                          </button>
                        </div>

                        {/* Search */}
                        <div className="relative">
                          <input
                            type="text"
                            value={plasterAdviceSearch}
                            onChange={(e) => setPlasterAdviceSearch(e.target.value)}
                            placeholder="Filter care precautions..."
                            className="w-full h-7 pl-2.5 pr-7 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <Icon icon={faMagnifyingGlass} className="absolute right-2 top-1/2 -translate-y-1/2 size-2.5 text-slate-400 pointer-events-none" />
                        </div>

                        {/* List */}
                        <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                          {filteredPlasterAdviceOptions.map((adviceItem) => {
                            const isPresent = plasterAdvice.includes(adviceItem);
                            const isFav = isPlasterAdviceFavorite(adviceItem);
                            const isCust = isPlasterAdviceCustom(adviceItem);

                            return (
                              <div
                                key={adviceItem}
                                className={`flex items-start justify-between gap-1.5 p-2 rounded-lg text-xs transition-colors ${
                                  isPresent
                                    ? "bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 font-bold text-indigo-900 dark:text-indigo-200"
                                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                <div
                                  className="flex-1 cursor-pointer leading-snug"
                                  onClick={() => handleTogglePlasterAdviceTag(adviceItem)}
                                >
                                  {adviceItem}
                                </div>
                                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => togglePlasterAdviceFavorite(adviceItem)}
                                    className={`p-0.5 cursor-pointer ${isFav ? "text-amber-500" : "text-slate-300 hover:text-amber-400"}`}
                                  >
                                    <Icon icon={faStar} className="size-2.5" />
                                  </button>
                                  {isCust && (
                                    <button
                                      type="button"
                                      onClick={() => removeCustomPlasterAdvice(adviceItem)}
                                      className="p-0.5 text-slate-300 hover:text-rose-500 cursor-pointer"
                                    >
                                      <Icon icon={faTrashCan} className="size-2.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Add Custom Precaution */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            + Add Precaution Suggestion
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={newPlasterAdviceSuggestionInput}
                              onChange={(e) => setNewPlasterAdviceSuggestionInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && newPlasterAdviceSuggestionInput.trim()) {
                                  e.preventDefault();
                                  addCustomPlasterAdvice(newPlasterAdviceSuggestionInput.trim());
                                  handleTogglePlasterAdviceTag(newPlasterAdviceSuggestionInput.trim());
                                  setNewPlasterAdviceSuggestionInput("");
                                }
                              }}
                              placeholder="Precaution instructions..."
                              className="flex-1 h-7 px-2 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                if (newPlasterAdviceSuggestionInput.trim()) {
                                  addCustomPlasterAdvice(newPlasterAdviceSuggestionInput.trim());
                                  handleTogglePlasterAdviceTag(newPlasterAdviceSuggestionInput.trim());
                                  setNewPlasterAdviceSuggestionInput("");
                                }
                              }}
                              disabled={!newPlasterAdviceSuggestionInput.trim()}
                              className="h-7 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {plasterAdvice?.trim() && (
                    <button
                      type="button"
                      onClick={() => handlePlasterAdviceChange("")}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <Textarea
                value={plasterAdvice}
                onChange={(e) => handlePlasterAdviceChange(e.target.value)}
                placeholder="Doctor's plaster and bandage instructions for patient (Keep strictly dry, elevate on pillows, non-weight bearing...)"
                rows={3}
                className="w-full text-xs font-medium resize-none leading-relaxed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 9: MEDICINES (PRESCRIPTION BUILDER) */}
      <div id="sec-medicines" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <Icon icon={faPills} className="size-3.5 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Medicines (Prescriptions)
            </span>
            <span className="rounded bg-purple-100 dark:bg-purple-900/60 px-2 py-0.2 text-[10px] font-bold text-purple-700 dark:text-purple-300">
              {medicines.filter((m) => m.name?.trim()).length} prescribed
            </span>
          </div>

          <div className="flex items-center gap-2">
            {medicines.filter((m) => m.name?.trim()).length > 0 && (
              <button
                type="button"
                onClick={() => onMedicinesChange([])}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer px-1.5"
                title="Clear all prescribed medicines"
              >
                Clear All
              </button>
            )}

            <button
              type="button"
              onClick={handleAddMedicineRow}
              className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-2xs cursor-pointer"
            >
              <Icon icon={faPlus} className="size-2.5" />
              <span>Add Medicine</span>
            </button>

            <button
              type="button"
              onClick={() => toggleSection("medicines")}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <Icon icon={collapsedSections.medicines ? faChevronDown : faChevronUp} className="size-3" />
            </button>
          </div>
        </div>

        {!collapsedSections.medicines && (
          <div className="p-4 space-y-4">
            {/* EXACT APOLLO SOM EMR ADD MEDICINE FORM */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
              {/* Row 1: Prescription Type, Search Type, Medication Name Input */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Prescription Type</label>
                  <div className="flex items-center bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700 p-0.5 text-xs font-bold">
                    {(["Regular", "Stat", "SOS"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setMedPrescriptionType(t)}
                        className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer ${
                          medPrescriptionType === t
                            ? "bg-purple-600 text-white shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Search Type</label>
                  <div className="flex items-center bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700 p-0.5 text-xs font-bold">
                    {(["Brand", "Generic"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setMedSearchType(s)}
                        className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer ${
                          medSearchType === s
                            ? "bg-purple-600 text-white shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Medication Name *</label>
                  <MedicineCombobox
                    name="new-med-input"
                    value={newMedName}
                    onChange={(val) => setNewMedName(val)}
                    onSelectMedicine={(sugg) => {
                      setNewMedName(sugg.name);
                      if (sugg.defaults?.dosage) setNewMedDose(sugg.defaults.dosage.split(" ")[0] || "1");
                      if (sugg.defaults?.frequency) setNewMedFreq(sugg.defaults.frequency);
                      if (sugg.defaults?.duration) setNewMedDuration(sugg.defaults.duration.split(" ")[0] || "5");
                    }}
                    suggestions={drugSuggestions}
                    loading={drugSuggestionsLoading}
                    favorites={favorites}
                    onFavoritesChange={setFavorites}
                  />
                </div>
              </div>

              {/* Row 2: Quantity per Dose, Quantity Unit, Frequency, M-A-E-N toggles, Meal Relation */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1 border-t border-slate-200/80 dark:border-slate-700/80">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Qty / Dose</label>
                  <input
                    type="text"
                    value={newMedDose}
                    onChange={(e) => setNewMedDose(e.target.value)}
                    className="w-full h-8 px-2 text-xs font-bold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Quantity Unit</label>
                  <select
                    value={newMedUnit}
                    onChange={(e) => setNewMedUnit(e.target.value)}
                    className="w-full h-8 px-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                  >
                    <option value="Tablet(s)">Tablet(s)</option>
                    <option value="Capsule(s)">Capsule(s)</option>
                    <option value="Sachet(s)">Sachet(s)</option>
                    <option value="Spray">Spray</option>
                    <option value="Puff">Puff</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Syrup">Syrup</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Frequency</label>
                  <select
                    value={newMedFreq}
                    onChange={(e) => setNewMedFreq(e.target.value)}
                    className="w-full h-8 px-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                  >
                    <option value="BD - Morning & Night">BD (Morning & Night)</option>
                    <option value="OD - Once a day">OD (Once daily)</option>
                    <option value="TDS - Thrice daily">TDS (Three times daily)</option>
                    <option value="QID - Four times a day">QID (Four times daily)</option>
                    <option value="HS - At bedtime">HS (At bedtime)</option>
                    <option value="SOS - Whenever needed">SOS (As needed)</option>
                    <option value="Once a week">Once a week</option>
                  </select>
                </div>

                {/* Dose time toggles (M, A, E, N) */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Time of Day</label>
                  <div className="flex items-center gap-1 h-8">
                    <button
                      type="button"
                      onClick={() => setMedDoseM((v) => !v)}
                      className={`size-7 rounded font-bold text-xs transition-colors cursor-pointer ${
                        medDoseM ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-400"
                      }`}
                      title="Morning"
                    >
                      M
                    </button>
                    <button
                      type="button"
                      onClick={() => setMedDoseA((v) => !v)}
                      className={`size-7 rounded font-bold text-xs transition-colors cursor-pointer ${
                        medDoseA ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-400"
                      }`}
                      title="Afternoon"
                    >
                      A
                    </button>
                    <button
                      type="button"
                      onClick={() => setMedDoseE((v) => !v)}
                      className={`size-7 rounded font-bold text-xs transition-colors cursor-pointer ${
                        medDoseE ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-400"
                      }`}
                      title="Evening"
                    >
                      E
                    </button>
                    <button
                      type="button"
                      onClick={() => setMedDoseN((v) => !v)}
                      className={`size-7 rounded font-bold text-xs transition-colors cursor-pointer ${
                        medDoseN ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-400"
                      }`}
                      title="Night"
                    >
                      N
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Meal Relation</label>
                  <select
                    value={newMedMeal}
                    onChange={(e) => setNewMedMeal(e.target.value)}
                    className="w-full h-8 px-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                  >
                    <option value="After meal">After meal</option>
                    <option value="Before meal">Before meal</option>
                    <option value="With food">With food</option>
                    <option value="Empty stomach">Empty stomach</option>
                    <option value="At bedtime">At bedtime</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Duration</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={newMedDuration}
                      onChange={(e) => setNewMedDuration(e.target.value)}
                      className="w-12 h-8 px-1 text-xs font-bold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center"
                    />
                    <select
                      value={newMedDurationUnit}
                      onChange={(e) => setNewMedDurationUnit(e.target.value)}
                      className="flex-1 h-8 px-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      <option value="Day(s)">Day(s)</option>
                      <option value="Week(s)">Week(s)</option>
                      <option value="Month(s)">Month(s)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 3: Comments, Route & Add Button */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-200/80 dark:border-slate-700/80">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    value={newMedComments}
                    onChange={(e) => setNewMedComments(e.target.value)}
                    placeholder="Instructions and clinical remarks..."
                    className="w-full h-8 px-2.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newMedName.trim()) {
                        e.preventDefault();
                        handleAddFromApolloForm();
                      }
                    }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={newMedRoute}
                    onChange={(e) => setNewMedRoute(e.target.value)}
                    className="h-8 px-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                  >
                    <option value="Oral">Oral</option>
                    <option value="Topical">Topical</option>
                    <option value="Nasal">Nasal</option>
                    <option value="Ophthalmic">Ophthalmic</option>
                    <option value="Subcutaneous">Subcutaneous</option>
                    <option value="Intramuscular">Intramuscular</option>
                  </select>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddFromApolloForm}
                    disabled={!newMedName.trim()}
                    className="h-8 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs"
                  >
                    + Add Medicine
                  </Button>
                </div>
              </div>
            </div>

            {/* RAPID 1-CLICK DOSING PRESETS */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase">⚡ 1-Tap Dose:</span>
              {RAPID_DOSING_PRESETS.map((preset, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => {
                    if (medicines.length > 0) {
                      handleApplyDosingPreset(medicines.length - 1, preset);
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-purple-900 dark:text-purple-300 hover:bg-purple-100 cursor-pointer transition-all shadow-2xs"
                >
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>

            {/* EXACT APOLLO SOM EMR PRESCRIBED MEDICINES TABLE */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Medicines, Strength</th>
                    <th className="py-2.5 px-3">Quantity per Dose, Unit, Frequency, Route, Date</th>
                    <th className="py-2.5 px-3">Supply Duration, Duration Type, Meal Relation</th>
                    <th className="py-2.5 px-3">Comments</th>
                    <th className="py-2.5 px-2 text-center w-12">Fav</th>
                    <th className="py-2.5 px-3 text-right w-16">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {medicines.filter((m) => m.name?.trim()).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No medicines prescribed yet. Fill the form above or click &quot;+ Add Medicine&quot; to begin.
                      </td>
                    </tr>
                  ) : (
                    medicines
                      .filter((m) => m.name?.trim())
                      .map((med, idx) => {
                        return (
                          <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-3 align-top">
                              <div className="flex items-start gap-1.5">
                                <span className="font-bold text-slate-400 mr-0.5">::</span>
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white text-xs">
                                    {med.name}
                                  </div>
                                  <span className="inline-block mt-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 text-[9px] font-bold">
                                    Regular
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 align-top text-slate-700 dark:text-slate-200 text-xs">
                              {med.dosage || "1, Tablet(s)"}, {med.frequency || "BD - Morning & Night"}, {med.route || "Oral"}
                            </td>
                            <td className="py-3 px-3 align-top text-slate-700 dark:text-slate-200 text-xs">
                              {med.duration || "5, Day(s)"}, After meal
                            </td>
                            <td className="py-3 px-3 align-top text-slate-600 dark:text-slate-400 text-xs font-mono">
                              {med.instructions || "—"}
                            </td>
                            <td className="py-3 px-2 text-center align-top">
                              <button
                                type="button"
                                onClick={() => {
                                  if (favorites.includes(med.name)) {
                                    setFavorites((f) => f.filter((x) => x !== med.name));
                                  } else {
                                    setFavorites((f) => [...f, med.name]);
                                  }
                                }}
                                className="p-1 text-slate-300 hover:text-amber-500 cursor-pointer"
                              >
                                <Icon
                                  icon={faStar}
                                  className={`size-3 ${favorites.includes(med.name) ? "text-amber-500 fill-amber-500" : ""}`}
                                />
                              </button>
                            </td>
                            <td className="py-3 px-3 text-right align-top">
                              <button
                                type="button"
                                onClick={() => handleRemoveMedicineRow(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Remove medicine"
                              >
                                <Icon icon={faTrashCan} className="size-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 10: PROCEDURES PERFORMED */}
      <div id="sec-procedures" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <Icon icon={faStethoscope} className="size-3.5 text-slate-600 dark:text-slate-300" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Procedures Performed
            </span>
          </div>

          <button
            type="button"
            onClick={() => toggleSection("procedures")}
            className="text-slate-400 hover:text-slate-700 p-1"
          >
            <Icon icon={collapsedSections.procedures ? faChevronDown : faChevronUp} className="size-3" />
          </button>
        </div>

        {!collapsedSections.procedures && (
          <div className="p-4">
            <Textarea
              value={(clinical as any).proceduresPerformed || ""}
              onChange={(e) => onClinicalChange({ ...clinical, proceduresPerformed: e.target.value } as any)}
              placeholder="Details of in-clinic procedures performed..."
              rows={2}
              className="w-full text-xs font-medium resize-none leading-relaxed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* SECTION 11: ADVICE */}
      <div id="sec-advice" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <Icon icon={faNotesMedical} className="size-3.5 text-slate-600 dark:text-slate-300" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Advice
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenMacro("advice", "advice")}
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs"
            >
              <Icon icon={faFileLines} className="size-2.5 text-indigo-600" />
              <span>Macro Text</span>
            </button>

            {advice?.trim() && (
              <button
                type="button"
                onClick={() => onAdviceChange("")}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer px-1.5"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={() => toggleSection("advice")}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <Icon icon={collapsedSections.advice ? faChevronDown : faChevronUp} className="size-3" />
            </button>
          </div>
        </div>

        {!collapsedSections.advice && (
          <div className="p-4 space-y-3">
            <Textarea
              value={advice}
              onChange={(e) => onAdviceChange(e.target.value)}
              placeholder="General advice, lifestyle modifications, and dietary instructions..."
              rows={4}
              className="w-full text-xs font-mono font-medium resize-none leading-relaxed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg"
            />

            {/* Apollo SOM EMR Drug Interactions Card */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-2.5 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <div>
                <strong className="text-slate-900 dark:text-white">HiPaR Drug Database</strong>
                <span className="ml-2 text-[11px]">Get Critical drug interaction alert based on prescribed medications</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                No Critical Interactions
              </span>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 12: PLAN */}
      <div id="sec-plan" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={isPlanChecked}
              onChange={(e) => setIsPlanChecked(e.target.checked)}
              className="size-4 text-indigo-600 rounded cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Plan
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenMacro("plan", "plan")}
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs"
            >
              <Icon icon={faFileLines} className="size-2.5 text-indigo-600" />
              <span>Macro Text</span>
            </button>

            {currentPlanDetails && (
              <button
                type="button"
                onClick={() => onClinicalChange({ ...clinical, planDetails: "" } as any)}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer px-1.5"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={() => toggleSection("plan")}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <Icon icon={collapsedSections.plan ? faChevronDown : faChevronUp} className="size-3" />
            </button>
          </div>
        </div>

        {!collapsedSections.plan && (
          <div className="p-4 space-y-2.5">
            {/* Quick Ortho Treatment Plan Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                "Rest and protection",
                "Ice application (15 mins)",
                "Compression and elevation",
                "Supportive ankle brace",
                "Isometric quadriceps daily",
                "Lumbar belt while travelling",
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    const current = currentPlanDetails.trim();
                    const next = current ? `${current}\n• ${chip}` : `• ${chip}`;
                    onClinicalChange({ ...clinical, planDetails: next } as any);
                  }}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  <Icon icon={faPlus} className="size-2.5 text-indigo-600" />
                  <span>{chip}</span>
                </button>
              ))}
            </div>

            <Textarea
              value={currentPlanDetails}
              onChange={(e) => onClinicalChange({ ...clinical, planDetails: e.target.value } as any)}
              placeholder="Treatment plan, protection, and therapeutic steps..."
              rows={3}
              className="w-full text-xs font-mono font-medium resize-none leading-relaxed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* SECTION 13: FOLLOW UP APPOINTMENT */}
      <div id="sec-followup" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <Icon icon={faClock} className="size-3.5 text-slate-600 dark:text-slate-300" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Follow Up Appointment
            </span>
          </div>

          <div className="flex items-center gap-2">
            {followUp?.trim() && (
              <button
                type="button"
                onClick={() => onFollowUpChange("")}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer px-1.5"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={() => toggleSection("followup")}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <Icon icon={collapsedSections.followup ? faChevronDown : faChevronUp} className="size-3" />
            </button>
          </div>
        </div>

        {!collapsedSections.followup && (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Weeks</label>
                <select
                  onChange={(e) => onFollowUpChange(`Review after ${e.target.value} weeks`)}
                  className="w-full h-8 px-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="">Select Weeks</option>
                  <option value="1">1 Week</option>
                  <option value="2">2 Weeks</option>
                  <option value="3">3 Weeks</option>
                  <option value="4">4 Weeks</option>
                  <option value="6">6 Weeks</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Search timeframe (2d, 2w, 2m)</label>
                <Input
                  value={followUp}
                  onChange={(e) => onFollowUpChange(e.target.value)}
                  placeholder="Review timeframe or follow-up instructions..."
                  className="h-8 text-xs font-bold"
                />
              </div>
            </div>

            {/* Quick Follow-up Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Review In:</span>
              {FAST_FOLLOW_UPS.map((f, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onFollowUpChange(f.text)}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-sky-50 border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  <Icon icon={faPlus} className="size-2 text-sky-600" />
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* QUICK DRAWER LINKS FOR LABS & DOCUMENTS */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 dark:text-slate-300">Need Advanced Records?</span>
          <span className="text-slate-500">Quickly jump to investigations or certificates:</span>
        </div>
        <div className="flex items-center gap-2">
          {onViewInvestigations && (
            <button
              type="button"
              onClick={onViewInvestigations}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-sky-500 shadow-2xs cursor-pointer"
            >
              <Icon icon={faFlaskVial} className="size-3 text-sky-600" />
              <span>Lab Orders & Past X-Rays {investigationHistoryCount > 0 ? `(${investigationHistoryCount})` : ""}</span>
            </button>
          )}
          {onViewDocuments && (
            <button
              type="button"
              onClick={onViewDocuments}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-orange-500 shadow-2xs cursor-pointer"
            >
              <Icon icon={faFileLines} className="size-3 text-orange-600" />
              <span>Medical Certificate / Referral</span>
            </button>
          )}
        </div>
      </div>

              </div>
      </div>

      {/* Macro Text Modal */}
      <MacroTextModal
        isOpen={isMacroModalOpen}
        category={macroCategory}
        onClose={() => setIsMacroModalOpen(false)}
        onSelectMacro={handleInsertMacroText}
      />

      {/* Custom Templates Modal */}
      <CustomTemplatesModal
        isOpen={isTemplatesModalOpen}
        initialMode={templatesModalMode}
        currentClinical={clinical}
        currentMedicines={medicines}
        currentAdvice={advice}
        currentFollowUp={followUp}
        onClose={() => setIsTemplatesModalOpen(false)}
        onApplyTemplate={handleApplyTemplate}
      />
    </div>
  );
}

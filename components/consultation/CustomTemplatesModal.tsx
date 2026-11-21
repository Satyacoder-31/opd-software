"use client";

import { useState, useMemo, useEffect } from "react";
import { FontAwesomeIcon as Icon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faPlus,
  faTrashCan,
  faMagnifyingGlass,
  faCheck,
  faWandMagicSparkles,
  faPills,
  faStethoscope,
  faBookmark,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import {
  COMMON_ILLNESS_TEMPLATES,
  type ClinicalTemplate,
} from "@/lib/clinical-templates";
import type { ConsultationClinicalData, Medicine } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export type { ClinicalTemplate };

const CUSTOM_TEMPLATES_STORAGE_KEY = "dr_orthos_custom_consultation_templates_v1";

export type CustomTemplatesModalProps = {
  isOpen: boolean;
  initialMode?: "apply" | "save";
  currentClinical?: ConsultationClinicalData;
  currentMedicines?: Medicine[];
  currentAdvice?: string;
  currentFollowUp?: string;
  onClose: () => void;
  onApplyTemplate: (template: ClinicalTemplate) => void;
};

export function loadDoctorCustomTemplates(): ClinicalTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_TEMPLATES_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveDoctorCustomTemplate(template: Omit<ClinicalTemplate, "id" | "isBuiltIn">): ClinicalTemplate {
  const newTmpl: ClinicalTemplate = {
    ...template,
    id: "custom-tmpl-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
    isBuiltIn: true as any, // treat as template
  };

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(CUSTOM_TEMPLATES_STORAGE_KEY);
      const existing: ClinicalTemplate[] = raw ? JSON.parse(raw) : [];
      const updated = [newTmpl, ...existing];
      localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save custom template:", e);
    }
  }

  return newTmpl;
}

export function deleteDoctorCustomTemplate(templateId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(CUSTOM_TEMPLATES_STORAGE_KEY);
    if (!raw) return;
    const existing: ClinicalTemplate[] = JSON.parse(raw);
    const updated = existing.filter((t) => t.id !== templateId);
    localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to delete custom template:", e);
  }
}

export function CustomTemplatesModal({
  isOpen,
  initialMode = "apply",
  currentClinical,
  currentMedicines = [],
  currentAdvice = "",
  currentFollowUp = "",
  onClose,
  onApplyTemplate,
}: CustomTemplatesModalProps) {
  const [mode, setMode] = useState<"apply" | "save">(initialMode);
  const [customTemplates, setCustomTemplates] = useState<ClinicalTemplate[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [previewTemplate, setPreviewTemplate] = useState<ClinicalTemplate | null>(null);

  // Save form fields
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState<any>("Orthopedics & Pain");
  const [templateDescription, setTemplateDescription] = useState("");
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setCustomTemplates(loadDoctorCustomTemplates());
      setSearch("");
      setPreviewTemplate(null);
      setSaveSuccessNotice(null);
      if (initialMode === "save") {
        const diag = currentClinical?.diagnosis?.trim() || "";
        setTemplateName(diag ? `${diag} Regimen` : "My OPD Protocol");
        setTemplateDescription(
          currentClinical?.chiefComplaint ? `Protocol for ${currentClinical.chiefComplaint}` : "Standard consultation template"
        );
      }
    }
  }, [isOpen, initialMode, currentClinical]);

  const allTemplates = useMemo(() => {
    return [...customTemplates, ...COMMON_ILLNESS_TEMPLATES];
  }, [customTemplates]);

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((t) => {
      if (selectedCategory === "custom") {
        if (!customTemplates.some((c) => c.id === t.id)) return false;
      } else if (selectedCategory !== "all") {
        if (t.category !== selectedCategory) return false;
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        (t.diagnosis && t.diagnosis.toLowerCase().includes(q)) ||
        (t.chiefComplaint && t.chiefComplaint.toLowerCase().includes(q)) ||
        t.medicines.some((m) => m.name.toLowerCase().includes(q))
      );
    });
  }, [allTemplates, customTemplates, selectedCategory, search]);

  if (!isOpen) return null;

  const handleSaveCurrentAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;

    const newTmpl = saveDoctorCustomTemplate({
      name: templateName.trim(),
      category: templateCategory,
      illness: templateDescription.trim() || templateName.trim(),
      description: templateDescription.trim(),
      chiefComplaint: currentClinical?.chiefComplaint || undefined,
      diagnosis: currentClinical?.diagnosis || undefined,
      examination:
        currentClinical?.examination?.jointsAndParts ||
        (currentClinical as any)?.examinationFindings ||
        undefined,
      investigations:
        currentClinical?.investigationResults?.imaging ||
        currentClinical?.investigationResults?.labs ||
        (currentClinical as any)?.investigations ||
        undefined,
      medicines: currentMedicines,
      advice: currentAdvice || undefined,
      followUp: currentFollowUp || undefined,
    });

    setCustomTemplates((prev) => [newTmpl, ...prev]);
    setSaveSuccessNotice(`Successfully saved "${newTmpl.name}"!`);
    setTimeout(() => {
      setMode("apply");
      setSaveSuccessNotice(null);
    }, 1200);
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteDoctorCustomTemplate(id);
    setCustomTemplates((prev) => prev.filter((t) => t.id !== id));
    if (previewTemplate?.id === id) setPreviewTemplate(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="templates-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative flex flex-col w-full max-w-5xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
              <Icon icon={faBookmark} className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="templates-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                  Clinical Custom Templates
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  Apollo Standard
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                1-click instant prefill of complaints, examination, diagnosis, medicines, and advice
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher */}
            <div className="flex items-center bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode("apply")}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  mode === "apply"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                }`}
              >
                Browse & Apply
              </button>
              <button
                type="button"
                onClick={() => setMode("save")}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  mode === "save"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                }`}
              >
                + Save Current as Template
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer ml-1"
              aria-label="Close"
            >
              <Icon icon={faXmark} className="text-lg" />
            </button>
          </div>
        </div>

        {/* SUBHEADER: CATEGORY FILTER & SEARCH */}
        {mode === "apply" && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              {[
                { id: "all", label: "All Templates" },
                { id: "Orthopedics & Pain", label: "Orthopedics" },
                { id: "General Medicine", label: "General Med" },
                { id: "Respiratory & ENT", label: "Respiratory/ENT" },
                { id: "Gastrointestinal", label: "GI" },
                { id: "custom", label: `Doctor Custom (${customTemplates.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    selectedCategory === tab.id
                      ? "bg-purple-600 text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <Icon
                icon={faMagnifyingGlass}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates or medicines..."
                className="w-full h-8 pl-7 pr-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
        )}

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/40">
          {mode === "save" ? (
            /* SAVE CURRENT CONSULTATION AS TEMPLATE */
            <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Save Current Consultation as a Reusable Template
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Save all filled symptoms, clinical findings, diagnosis, medicines ({currentMedicines.length}), and advice to easily apply for future patients.
                </p>
              </div>

              {saveSuccessNotice && (
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2">
                  <Icon icon={faCheck} className="size-4 text-emerald-600" />
                  <span>{saveSuccessNotice}</span>
                </div>
              )}

              <form onSubmit={handleSaveCurrentAsTemplate} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g. Left Ankle Sprain Fast Track, Sciatica Acute Care"
                    className="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                      Clinical Category
                    </label>
                    <select
                      value={templateCategory}
                      onChange={(e) => setTemplateCategory(e.target.value)}
                      className="w-full h-9 px-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="Orthopedics & Pain">Orthopedics & Pain</option>
                      <option value="General Medicine">General Medicine</option>
                      <option value="Respiratory & ENT">Respiratory & ENT</option>
                      <option value="Gastrointestinal">Gastrointestinal</option>
                      <option value="Chronic Care">Chronic Care</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                      Description / Subtitle
                    </label>
                    <input
                      type="text"
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      placeholder="e.g. R.I.C.E. protocol + supportive care"
                      className="w-full h-9 px-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* SUMMARY OF WHAT WILL BE INCLUDED */}
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3.5 space-y-2 text-xs">
                  <div className="font-bold uppercase tracking-wider text-[10px] text-slate-500">
                    Template Contents Snapshot:
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Diagnosis: </span>
                    <span className="text-slate-900 dark:text-white font-bold">{currentClinical?.diagnosis || "None recorded"}</span>
                  </div>
                  {currentClinical?.chiefComplaint && (
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Complaints: </span>
                      <span className="text-slate-600 dark:text-slate-400">{currentClinical.chiefComplaint}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Medicines ({currentMedicines.length}): </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {currentMedicines.map((m) => m.name).join(", ") || "No medicines"}
                    </span>
                  </div>
                  {currentAdvice && (
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Advice: </span>
                      <span className="text-slate-600 dark:text-slate-400 line-clamp-2">{currentAdvice}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setMode("apply")}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-1.5 shadow-xs"
                  >
                    <Icon icon={faCheck} className="size-3" />
                    <span>Save Custom Template</span>
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            /* BROWSE AND APPLY TEMPLATES GRID */
            <div className="space-y-4">
              {previewTemplate && (
                <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/70 dark:bg-purple-950/30 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-purple-900 dark:text-purple-300">
                        Template Preview: {previewTemplate.name}
                      </span>
                      <span className="text-[10px] ml-2 font-mono px-1.5 py-0.2 rounded bg-purple-200 text-purple-800">
                        {previewTemplate.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          onApplyTemplate(previewTemplate);
                          onClose();
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-7 px-3 shadow-2xs"
                      >
                        <Icon icon={faCheck} className="size-2.5 mr-1" />
                        Apply Now
                      </Button>
                      <button
                        type="button"
                        onClick={() => setPreviewTemplate(null)}
                        className="text-xs text-slate-500 hover:text-slate-800"
                      >
                        Close Preview
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white dark:bg-slate-900 p-3 rounded-lg border border-purple-100 dark:border-purple-900">
                    <div>
                      <strong className="text-slate-700 dark:text-slate-300 block mb-0.5">Diagnosis:</strong>
                      <span className="text-slate-900 dark:text-white font-bold">{previewTemplate.diagnosis || "—"}</span>
                      {previewTemplate.chiefComplaint && (
                        <div className="mt-1.5">
                          <strong className="text-slate-700 dark:text-slate-300 block mb-0.5">Complaints:</strong>
                          <span className="text-slate-600 dark:text-slate-400">{previewTemplate.chiefComplaint}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <strong className="text-slate-700 dark:text-slate-300 block mb-0.5">
                        Medicines ({previewTemplate.medicines.length}):
                      </strong>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400">
                        {previewTemplate.medicines.map((m, i) => (
                          <li key={i}>
                            <strong>{m.name}</strong> ({m.frequency || "Daily"}) - {m.duration || "5d"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredTemplates.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-500">
                    No matching templates found.
                  </div>
                ) : (
                  filteredTemplates.map((template) => {
                    const isCustom = customTemplates.some((c) => c.id === template.id);
                    return (
                      <div
                        key={template.id}
                        className="group relative flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs hover:shadow-md hover:border-purple-400 dark:hover:border-purple-600 transition-all text-left"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                              {template.category}
                            </span>
                            {isCustom && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteTemplate(template.id, e)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete custom template"
                              >
                                <Icon icon={faTrashCan} className="size-3" />
                              </button>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                            {template.name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {template.description || template.illness}
                          </p>

                          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                            <span className="font-semibold flex items-center gap-1 text-purple-700 dark:text-purple-400">
                              <Icon icon={faPills} className="size-3" />
                              {template.medicines.length} medicines
                            </span>
                            {template.diagnosis && (
                              <span className="truncate max-w-[140px] text-slate-500">
                                {template.diagnosis}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewTemplate(template)}
                            className="h-8 flex-1 text-xs font-semibold border-slate-200 hover:bg-slate-50"
                          >
                            <Icon icon={faEye} className="size-3 mr-1 text-slate-500" />
                            Preview
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              onApplyTemplate(template);
                              onClose();
                            }}
                            className="h-8 flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-1 shadow-xs cursor-pointer"
                          >
                            <Icon icon={faCheck} className="size-3" />
                            Apply
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs">
          <span className="text-slate-500">
            Total {allTemplates.length} templates available ({customTemplates.length} doctor custom)
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  savePrescription,
  generatePrescriptionPdf,
} from "@/actions/prescriptions";
import { listDrugSuggestions } from "@/actions/drug-catalog";
import {
  deletePrescriptionTemplate,
  listPrescriptionTemplates,
  savePrescriptionTemplate,
} from "@/actions/templates";
import { MedicineCombobox } from "@/components/consultation/MedicineCombobox";
import { PrescriptionOptionCombobox } from "@/components/consultation/PrescriptionOptionCombobox";
import { DurationField } from "@/components/consultation/DurationField";
import { PrescriptionTemplatesBar } from "@/components/consultation/PrescriptionTemplatesBar";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  applyDrugDefaults,
  type DrugSuggestion,
} from "@/lib/drug-catalog";
import {
  loadFavoriteMedicines,
  rememberRecentMedicine,
  rememberRecentMedicines,
} from "@/lib/prescription-favorites";
import { expandFrequencyInput, estimateQuantity, parseDosesPerIntake } from "@/lib/prescription-dosing";
import { collectPrescriptionSafetyCues } from "@/lib/prescription-safety";
import {
  FREQUENCY_OPTIONS,
  INSTRUCTION_OPTIONS,
  MEDICINE_ROUTES,
  medicineFilled,
  medicineTitle,
} from "@/lib/prescription-utils";
import {
  filledMedicineCount,
  isBlankMedicineRow,
  validatePrescriptionDraft,
} from "@/lib/prescription-validation";
import type { Medicine } from "@/lib/types";
import { cn, downloadBase64Pdf } from "@/lib/utils";
import { usePendingAction } from "@/hooks/usePendingAction";

function medicineFromSuggestion(
  current: Medicine,
  suggestion: DrugSuggestion
): Medicine {
  const next = applyDrugDefaults(current, suggestion.name, suggestion.defaults);
  const qty = estimateQuantity(
    next.frequency,
    next.duration,
    parseDosesPerIntake(next.dosage)
  );
  if (qty && !next.quantity?.trim()) {
    next.quantity = qty;
  }
  return next;
}

type TemplateRow = Awaited<
  ReturnType<typeof listPrescriptionTemplates>
>[number];

export const emptyMedicine = (): Medicine => ({
  name: "",
  dosage: "",
  route: "",
  frequency: "",
  duration: "",
  quantity: "",
  instructions: "",
});

type PrescriptionBuilderProps = {
  consultationId: string;
  initialMedicines?: Medicine[];
  initialAdvice?: string | null;
  initialFollowUp?: string | null;
  medicines?: Medicine[];
  advice?: string;
  followUp?: string;
  onMedicinesChange?: (medicines: Medicine[]) => void;
  onAdviceChange?: (advice: string) => void;
  onFollowUpChange?: (followUp: string) => void;
  /** When true, hide local save controls — parent owns persistence. */
  hideSaveActions?: boolean;
  mode?: "active" | "amend";
  amendmentReason?: string;
  patientAllergies?: string | null;
};

function templateMedicineCount(medicines: unknown): number {
  if (!Array.isArray(medicines)) return 0;
  return medicines.filter(
    (item) =>
      item &&
      typeof item === "object" &&
      "name" in item &&
      typeof (item as { name?: unknown }).name === "string" &&
      (item as { name: string }).name.trim()
  ).length;
}

export function PrescriptionBuilder({
  consultationId,
  initialMedicines = [],
  initialAdvice,
  initialFollowUp,
  medicines: controlledMedicines,
  advice: controlledAdvice,
  followUp: controlledFollowUp,
  onMedicinesChange,
  onAdviceChange,
  onFollowUpChange,
  hideSaveActions = false,
  mode = "active",
  amendmentReason = "",
  patientAllergies,
}: PrescriptionBuilderProps) {
  const isAmendMode = mode === "amend";
  const isControlled = typeof onMedicinesChange === "function";

  const [internalMedicines, setInternalMedicines] = useState<Medicine[]>(
    initialMedicines.length > 0 ? initialMedicines : [emptyMedicine()]
  );
  const [internalAdvice, setInternalAdvice] = useState(initialAdvice ?? "");
  const [internalFollowUp, setInternalFollowUp] = useState(
    initialFollowUp ?? ""
  );
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [drugSuggestions, setDrugSuggestions] = useState<DrugSuggestion[]>([]);
  const [drugSuggestionsLoading, setDrugSuggestionsLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { isPending, run } = usePendingAction<
    "save" | "download" | "template" | "delete-template"
  >();

  const medicines = isControlled
    ? (controlledMedicines ?? [emptyMedicine()])
    : internalMedicines;
  const advice = isControlled ? (controlledAdvice ?? "") : internalAdvice;
  const followUp = isControlled ? (controlledFollowUp ?? "") : internalFollowUp;

  function setMedicines(next: Medicine[]) {
    if (isControlled) {
      onMedicinesChange?.(next);
      return;
    }
    setInternalMedicines(next);
  }

  function setAdvice(next: string) {
    if (isControlled) {
      onAdviceChange?.(next);
      return;
    }
    setInternalAdvice(next);
  }

  function setFollowUp(next: string) {
    if (isControlled) {
      onFollowUpChange?.(next);
      return;
    }
    setInternalFollowUp(next);
  }

  useEffect(() => {
    if (isAmendMode) return;
    void listPrescriptionTemplates().then(setTemplates);
  }, [isAmendMode]);

  useEffect(() => {
    let active = true;
    void listDrugSuggestions()
      .then((items) => {
        if (active) setDrugSuggestions(items);
      })
      .finally(() => {
        if (active) setDrugSuggestionsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setFavorites(loadFavoriteMedicines());
  }, []);

  const safetyCues = useMemo(
    () => collectPrescriptionSafetyCues(medicines, patientAllergies),
    [medicines, patientAllergies]
  );

  const completeCount = filledMedicineCount(medicines);

  function updateMedicine(index: number, field: keyof Medicine, value: string) {
    const dosingFields: Array<keyof Medicine> = [
      "dosage",
      "frequency",
      "duration",
    ];
    if (!dosingFields.includes(field)) {
      setMedicines(
        medicines.map((m, i) => (i === index ? { ...m, [field]: value } : m))
      );
      return;
    }

    const current = medicines[index] ?? emptyMedicine();
    const patch: Partial<Medicine> = { [field]: value };
    const next = { ...current, ...patch };
    const qty = estimateQuantity(
      next.frequency,
      next.duration,
      parseDosesPerIntake(next.dosage)
    );
    if (qty) {
      const previousEstimate = estimateQuantity(
        current.frequency,
        current.duration,
        parseDosesPerIntake(current.dosage)
      );
      const qtyBlank = !current.quantity?.trim();
      const qtyWasAuto =
        previousEstimate != null && current.quantity === previousEstimate;
      if (qtyBlank || qtyWasAuto) {
        patch.quantity = qty;
      }
    }

    setMedicines(
      medicines.map((m, i) => (i === index ? { ...m, ...patch } : m))
    );
  }

  function patchMedicine(index: number, patch: Partial<Medicine>) {
    setMedicines(
      medicines.map((m, i) => (i === index ? { ...m, ...patch } : m))
    );
  }

  function addRow(seed?: Partial<Medicine>) {
    const next = { ...emptyMedicine(), ...seed };
    if (!next.route && next.name) next.route = "Oral";
    const blankIndex = medicines.findIndex(isBlankMedicineRow);
    if (blankIndex >= 0 && seed?.name) {
      setMedicines(
        medicines.map((row, index) => (index === blankIndex ? next : row))
      );
      return;
    }
    setMedicines([...medicines, next]);
  }

  function removeRow(index: number) {
    const next = medicines.filter((_, i) => i !== index);
    setMedicines(next.length > 0 ? next : [emptyMedicine()]);
  }

  function handleSelectMedicine(index: number, suggestion: DrugSuggestion) {
    rememberRecentMedicine(suggestion.name);
    const current = medicines[index] ?? emptyMedicine();
    patchMedicine(index, medicineFromSuggestion(current, suggestion));
  }

  function applyTemplate(templateId: string, mode: "replace" | "append") {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    const meds = (template.medicines as Medicine[]).map((med) => ({
      ...emptyMedicine(),
      ...med,
    }));

    if (mode === "append") {
      const base = medicines.filter((med) => !isBlankMedicineRow(med));
      setMedicines(meds.length > 0 ? [...base, ...meds] : base);
      if (template.advice?.trim() && !advice.trim()) {
        setAdvice(template.advice);
      }
      if (template.followUp?.trim() && !followUp.trim()) {
        setFollowUp(template.followUp);
      }
      return;
    }

    const hasContent =
      medicines.some(medicineFilled) ||
      advice.trim().length > 0 ||
      followUp.trim().length > 0;
    if (
      hasContent &&
      !window.confirm(
        `Replace the current prescription with “${template.name}”?`
      )
    ) {
      return;
    }

    setMedicines(meds.length > 0 ? meds : [emptyMedicine()]);
    setAdvice(template.advice ?? "");
    setFollowUp(template.followUp ?? "");
  }

  async function persistPrescription() {
    const validated = validatePrescriptionDraft(medicines, { advice, followUp });
    if (!validated.ok) {
      return { success: false as const, error: validated.error };
    }
    if (validated.medicines.length > 0) {
      rememberRecentMedicines(validated.medicines.map((med) => med.name));
    }
    return savePrescription(consultationId, medicines, {
      advice,
      followUp,
      ...(isAmendMode ? { amendmentReason } : {}),
    });
  }

  function handleSave() {
    setError(null);
    if (isAmendMode && amendmentReason.trim().length < 3) {
      setError(
        "Enter an amendment reason above before saving the prescription."
      );
      return;
    }
    void run(async () => {
      const result = await persistPrescription();
      if (!result.success) setError(result.error);
    }, "save");
  }

  function handleDownload() {
    setError(null);
    const validated = validatePrescriptionDraft(medicines, { advice, followUp });
    if (!validated.ok) {
      setError(validated.error);
      return;
    }
    if (validated.medicines.length === 0) {
      setError("Add at least one complete medicine before downloading the PDF.");
      return;
    }
    void run(async () => {
      if (!isAmendMode) {
        const saveResult = await persistPrescription();
        if (!saveResult.success) {
          setError(saveResult.error);
          return;
        }
      }
      const pdfResult = await generatePrescriptionPdf(consultationId);
      if (!pdfResult.success) {
        setError(pdfResult.error);
        return;
      }
      downloadBase64Pdf(pdfResult.data.pdfBase64, pdfResult.data.filename);
    }, "download");
  }

  function handleSaveTemplate() {
    setError(null);
    void run(async () => {
      const result = await savePrescriptionTemplate({
        name: templateName,
        medicines,
        advice,
        followUp,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setTemplateName("");
      setTemplates(await listPrescriptionTemplates());
    }, "template");
  }

  function handleDeleteTemplate(id: string) {
    const template = templates.find((t) => t.id === id);
    if (
      !window.confirm(
        `Delete template${template ? ` “${template.name}”` : ""}?`
      )
    ) {
      return;
    }
    setError(null);
    void run(async () => {
      const result = await deletePrescriptionTemplate(id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setTemplates(await listPrescriptionTemplates());
    }, "delete-template");
  }

  return (
    <div>
      {!isAmendMode ? (
        <PrescriptionTemplatesBar
          templates={templates.map((template) => ({
            id: template.id,
            name: template.name,
            medicineCount: templateMedicineCount(template.medicines),
          }))}
          templateName={templateName}
          onTemplateNameChange={setTemplateName}
          onApply={applyTemplate}
          onSave={handleSaveTemplate}
          onDelete={handleDeleteTemplate}
          saving={isPending("template")}
          deleting={isPending("delete-template")}
        />
      ) : null}

      {safetyCues.length > 0 ? (
        <div className="space-y-2 border-b border-border px-3 py-2.5 md:px-4">
          {safetyCues.map((cue) => (
            <Banner
              key={cue.id}
              variant={cue.severity === "danger" ? "error" : "info"}
              className="py-2"
            >
              {cue.message}
            </Banner>
          ))}
        </div>
      ) : null}

      <div id="ws-prescription" className="scroll-mt-2" tabIndex={-1}>
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 md:px-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium tabular-nums text-ink">
              {completeCount}
            </span>{" "}
            {completeCount === 1 ? "medicine" : "medicines"}
          </p>
        </div>
        {medicines.map((med, index) => {
          const flagged = safetyCues.some((cue) =>
            cue.medicineIndexes?.includes(index)
          );
          return (
            <div
              key={index}
              className={cn(
                "border-b border-border px-3 py-3 md:px-4",
                flagged && "bg-danger/3"
              )}
            >
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {medicineTitle(med, index)}
                </p>
                {medicines.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={() => removeRow(index)}
                    aria-label={`Remove ${medicineTitle(med, index)}`}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
              <div className="flex flex-col gap-2.5">
                <MedicineCombobox
                  name={`med-name-${index}`}
                  value={med.name}
                  onChange={(value) => updateMedicine(index, "name", value)}
                  onSelectMedicine={(suggestion) =>
                    handleSelectMedicine(index, suggestion)
                  }
                  suggestions={drugSuggestions}
                  loading={drugSuggestionsLoading}
                  favorites={favorites}
                  onFavoritesChange={setFavorites}
                />

                <div className="flex flex-col gap-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <Input
                      label="Dosage"
                      name={`med-dosage-${index}`}
                      value={med.dosage}
                      onChange={(e) =>
                        updateMedicine(index, "dosage", e.target.value)
                      }
                      placeholder="e.g. 1 tablet"
                      className="h-10"
                    />
                    <PrescriptionOptionCombobox
                      label="Frequency"
                      name={`med-freq-${index}`}
                      value={med.frequency}
                      onChange={(value) =>
                        updateMedicine(
                          index,
                          "frequency",
                          expandFrequencyInput(value)
                        )
                      }
                      options={FREQUENCY_OPTIONS}
                      placeholder="OD / BD / TDS…"
                    />
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <DurationField
                      name={`med-dur-${index}`}
                      value={med.duration}
                      onChange={(value) =>
                        updateMedicine(index, "duration", value)
                      }
                    />
                    <PrescriptionOptionCombobox
                      label="Instructions"
                      name={`med-inst-${index}`}
                      value={med.instructions ?? ""}
                      onChange={(value) =>
                        updateMedicine(index, "instructions", value)
                      }
                      options={INSTRUCTION_OPTIONS}
                      placeholder="e.g. After meals"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-1">
                      <Input
                        label="Quantity"
                        name={`med-qty-${index}`}
                        value={med.quantity ?? ""}
                        onChange={(e) =>
                          updateMedicine(index, "quantity", e.target.value)
                        }
                        placeholder="Auto from freq × days"
                        inputMode="numeric"
                        className="h-10"
                      />
                      {(() => {
                        const suggested = estimateQuantity(
                          med.frequency,
                          med.duration,
                          parseDosesPerIntake(med.dosage)
                        );
                        if (!suggested || med.quantity === suggested) return null;
                        return (
                          <button
                            type="button"
                            className="self-start text-xs font-medium text-primary hover:underline"
                            onClick={() =>
                              updateMedicine(index, "quantity", suggested)
                            }
                          >
                            Use suggested qty {suggested}
                          </button>
                        );
                      })()}
                    </div>
                    <PrescriptionOptionCombobox
                      label="Route"
                      name={`med-route-${index}`}
                      value={med.route ?? ""}
                      onChange={(value) =>
                        updateMedicine(index, "route", value)
                      }
                      options={MEDICINE_ROUTES}
                      placeholder="e.g. Oral"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div className="border-b border-border px-3 py-2.5 md:px-4">
          <Button type="button" variant="secondary" size="sm" onClick={() => addRow()}>
            Add medicine
          </Button>
        </div>
      </div>

      <div
        id="ws-advice"
        className="scroll-mt-2 grid gap-2.5 border-b border-border px-3 py-3 md:grid-cols-2 md:px-4"
        tabIndex={-1}
      >
        <Textarea
          label="Advice"
          name="advice"
          value={advice}
          onChange={(e) => setAdvice(e.target.value)}
          placeholder={
            "Drink plenty of fluids.\nWarm saline gargles.\nTake adequate rest."
          }
          rows={3}
          className="min-h-16"
        />
        <Textarea
          label="Follow-up"
          name="followUp"
          value={followUp}
          onChange={(e) => setFollowUp(e.target.value)}
          placeholder="After 5 days if symptoms persist."
          rows={3}
          className="min-h-16"
        />
      </div>

      {error && (
        <p
          className="border-b border-border px-3 py-2.5 text-sm text-danger md:px-4"
          role="alert"
        >
          {error}
        </p>
      )}

      {!hideSaveActions && (
        <div className="flex flex-wrap gap-3 border-b border-border px-3 py-3 md:px-4">
          <Button
            type="button"
            onClick={handleSave}
            loading={isPending("save")}
          >
            {isAmendMode ? "Save prescription amendment" : "Save prescription"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleDownload}
            loading={isPending("download")}
          >
            Download PDF
          </Button>
        </div>
      )}

      {hideSaveActions && (
        <div className="flex flex-wrap gap-2 px-3 py-2.5 md:px-4">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            loading={isPending("download")}
          >
            Preview / download PDF
          </Button>
        </div>
      )}
    </div>
  );
}

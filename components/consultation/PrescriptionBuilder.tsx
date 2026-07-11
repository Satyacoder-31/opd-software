"use client";

import { useEffect, useState } from "react";
import {
  savePrescription,
  generatePrescriptionPdf,
} from "@/actions/prescriptions";
import {
  deletePrescriptionTemplate,
  listPrescriptionTemplates,
  savePrescriptionTemplate,
} from "@/actions/templates";
import { Button } from "@/components/ui/Button";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { downloadBase64Pdf } from "@/lib/utils";
import {
  medicineFilled,
  medicineSummary,
  medicineTitle,
  textSectionSummary,
} from "@/lib/prescription-utils";
import type { Medicine } from "@/lib/types";
import { usePendingAction } from "@/hooks/usePendingAction";

type TemplateRow = Awaited<ReturnType<typeof listPrescriptionTemplates>>[number];

type PrescriptionBuilderProps = {
  consultationId: string;
  initialMedicines: Medicine[];
  initialAdvice?: string | null;
  initialFollowUp?: string | null;
  mode?: "active" | "amend";
  amendmentReason?: string;
};

const emptyMedicine = (): Medicine => ({
  name: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
});

export function PrescriptionBuilder({
  consultationId,
  initialMedicines,
  initialAdvice,
  initialFollowUp,
  mode = "active",
  amendmentReason = "",
}: PrescriptionBuilderProps) {
  const isAmendMode = mode === "amend";
  const [medicines, setMedicines] = useState<Medicine[]>(
    initialMedicines.length > 0 ? initialMedicines : [emptyMedicine()]
  );
  const [advice, setAdvice] = useState(initialAdvice ?? "");
  const [followUp, setFollowUp] = useState(initialFollowUp ?? "");
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { isPending, run } = usePendingAction<
    "save" | "download" | "template" | "delete-template"
  >();

  useEffect(() => {
    if (isAmendMode) return;
    void listPrescriptionTemplates().then(setTemplates);
  }, [isAmendMode]);

  function updateMedicine(index: number, field: keyof Medicine, value: string) {
    setMedicines((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  }

  function addRow() {
    setMedicines((prev) => [...prev, emptyMedicine()]);
  }

  function removeRow(index: number) {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  }

  function applyTemplate(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    const meds = template.medicines as Medicine[];
    setMedicines(meds.length > 0 ? meds : [emptyMedicine()]);
    setAdvice(template.advice ?? "");
    setFollowUp(template.followUp ?? "");
  }

  async function persistPrescription() {
    return savePrescription(consultationId, medicines, {
      advice,
      followUp,
      ...(isAmendMode ? { amendmentReason } : {}),
    });
  }

  function handleSave() {
    setError(null);
    if (isAmendMode && amendmentReason.trim().length < 3) {
      setError("Enter an amendment reason above before saving the prescription.");
      return;
    }
    void run(async () => {
      const result = await persistPrescription();
      if (!result.success) setError(result.error);
    }, "save");
  }

  function handleDownload() {
    setError(null);
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
      {!isAmendMode && templates.length > 0 && (
        <div className="border-b border-border px-4 py-3">
          <Select
            label="Apply template"
            name="template"
            value=""
            onChange={(e) => {
              if (e.target.value) applyTemplate(e.target.value);
            }}
            options={[
              { value: "", label: "Choose a saved template…" },
              ...templates.map((t) => ({ value: t.id, label: t.name })),
            ]}
          />
        </div>
      )}

      {medicines.map((med, index) => (
        <CollapsibleSection
          key={index}
          flush
          contentClassName="px-4 py-3"
          title={medicineTitle(med, index)}
          summary={medicineSummary(med)}
          filled={medicineFilled(med)}
        >
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label="Medicine"
                name={`med-name-${index}`}
                value={med.name}
                onChange={(e) => updateMedicine(index, "name", e.target.value)}
                placeholder="Paracetamol 650 mg"
              />
              <Input
                label="Dosage"
                name={`med-dosage-${index}`}
                value={med.dosage}
                onChange={(e) =>
                  updateMedicine(index, "dosage", e.target.value)
                }
                placeholder="1 tablet"
              />
              <Input
                label="Frequency"
                name={`med-freq-${index}`}
                value={med.frequency}
                onChange={(e) =>
                  updateMedicine(index, "frequency", e.target.value)
                }
                placeholder="Three times daily"
              />
              <Input
                label="Duration"
                name={`med-dur-${index}`}
                value={med.duration}
                onChange={(e) =>
                  updateMedicine(index, "duration", e.target.value)
                }
                placeholder="3 days"
              />
            </div>
            <div className="flex items-end gap-2">
              <Input
                label="Instructions"
                name={`med-inst-${index}`}
                value={med.instructions ?? ""}
                onChange={(e) =>
                  updateMedicine(index, "instructions", e.target.value)
                }
                placeholder="After meals"
                className="flex-1"
              />
              {medicines.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(index)}
                  aria-label={`Remove ${medicineTitle(med, index)}`}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </CollapsibleSection>
      ))}

      <div className="border-t border-border px-4 py-3">
        <Button type="button" variant="secondary" size="sm" onClick={addRow}>
          Add medicine
        </Button>
      </div>

      <CollapsibleSection
        flush
        contentClassName="px-4 py-3"
        title="Advice"
        summary={textSectionSummary(advice)}
        filled={!!advice.trim()}
      >
        <Textarea
          label="Advice notes"
          name="advice"
          value={advice}
          onChange={(e) => setAdvice(e.target.value)}
          placeholder={
            "Drink plenty of fluids.\nWarm saline gargles.\nTake adequate rest."
          }
          rows={4}
        />
      </CollapsibleSection>

      <CollapsibleSection
        flush
        contentClassName="px-4 py-3"
        title="Follow-up"
        summary={textSectionSummary(followUp)}
        filled={!!followUp.trim()}
      >
        <Textarea
          label="Follow-up"
          name="followUp"
          value={followUp}
          onChange={(e) => setFollowUp(e.target.value)}
          placeholder="After 5 days if symptoms persist."
          rows={2}
        />
      </CollapsibleSection>

      {!isAmendMode && (
        <div className="space-y-3 border-t border-border px-4 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <Input
              label="Save as template"
              name="templateName"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. URI adult"
              className="min-w-[12rem] flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleSaveTemplate}
              loading={isPending("template")}
            >
              Save template
            </Button>
          </div>
          {templates.length > 0 && (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {templates.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2">
                  <span>{t.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    loading={isPending("delete-template")}
                    onClick={() => handleDeleteTemplate(t.id)}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && (
        <p
          className="border-t border-border px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3 border-t border-border px-4 py-4">
        <Button type="button" onClick={handleSave} loading={isPending("save")}>
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
    </div>
  );
}

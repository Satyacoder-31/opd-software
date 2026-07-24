"use client";

import Link from "next/link";
import { useState } from "react";
import { amendConsultation } from "@/actions/consultations";
import {
  ConsultationClinicalSections,
  InvestigationSections,
  MedicalCertificateSections,
} from "@/components/consultation/ClinicalSections";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { consultationClinicalSchema } from "@/lib/consultation-clinical";
import { firstFieldError } from "@/lib/form-utils";
import type { ConsultationClinicalData } from "@/lib/types";
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

/**
 * Amendment-oriented clinical editor. Active visits use ConsultationWorkspace.
 */
export function ConsultationForm({
  consultationId,
  initial,
  cancelHref,
  onSuccess,
  mode = "amend",
  amendmentReason = "",
  onAmendmentReasonChange,
}: ConsultationFormProps) {
  const [clinical, setClinical] = useState<ConsultationClinicalData>(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const { isPending, run } = usePendingAction<"amend">();

  function handleAmend() {
    const parsed = consultationClinicalSchema.safeParse(clinical);
    if (!parsed.success) {
      setMessageType("error");
      setMessage("Please check the consultation form.");
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
        parsed.data,
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

  return (
    <div>
      {mode === "amend" && (
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

      <ConsultationClinicalSections value={clinical} onChange={setClinical} />
      <InvestigationSections value={clinical} onChange={setClinical} />
      <MedicalCertificateSections value={clinical} onChange={setClinical} />

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
        <Button
          type="button"
          onClick={handleAmend}
          loading={isPending("amend")}
        >
          Save amendment
        </Button>
      </div>
    </div>
  );
}

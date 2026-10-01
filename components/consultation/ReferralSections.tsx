"use client";

import { useState } from "react";
import { faClipboard, faFileMedical } from "@fortawesome/free-solid-svg-icons";
import { generateReferralPdf } from "@/actions/consultations";
import { Button } from "@/components/ui/Button";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { Banner } from "@/components/ui/Banner";
import { ClinicalDropdownInput } from "@/components/consultation/ClinicalDropdownInput";
import { ClinicalDropdownTextarea } from "@/components/consultation/ClinicalDropdownTextarea";
import { sectionCompletion, sectionSummary } from "@/lib/consultation-clinical";
import {
  REFERRAL_SPECIALTY_RECOMMENDATIONS,
  REFERRAL_FACILITY_RECOMMENDATIONS,
  REFERRAL_REASON_RECOMMENDATIONS,
  REFERRAL_NOTES_RECOMMENDATIONS,
} from "@/lib/clinical-recommendations";
import type { ConsultationClinicalData, ReferralLetter } from "@/lib/types";

export function ReferralSections({
  consultationId,
  value,
  onChange,
}: {
  consultationId: string;
  value: ConsultationClinicalData;
  onChange: (next: ConsultationClinicalData) => void;
}) {
  const referral = value.referral ?? {};
  const completion = sectionCompletion(value).referral;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function patch(patchValue: Partial<ReferralLetter>) {
    onChange({ ...value, referral: { ...referral, ...patchValue } });
  }

  async function download() {
    setLoading(true);
    setError(null);
    const result = await generateReferralPdf(consultationId);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    const bytes = Uint8Array.from(atob(result.data.pdfBase64), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = result.data.filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <CollapsibleSection
      flush
      density="compact"
      contentClassName="px-3 py-3 md:px-4"
      title="Referral letter"
      summary={sectionSummary(completion)}
      filled={completion.filled}
    >
      <div className="flex flex-col gap-3">
        <div className="grid gap-3 md:grid-cols-2">
          <ClinicalDropdownInput
            label="Specialty"
            name="toSpecialty"
            value={referral.toSpecialty ?? ""}
            onChange={(val) => patch({ toSpecialty: val })}
            options={REFERRAL_SPECIALTY_RECOMMENDATIONS}
            placeholder="e.g. Orthopedics, Spine Surgery, Neurology"
          />
          <ClinicalDropdownInput
            label="Facility / clinician"
            name="toFacility"
            value={referral.toFacility ?? ""}
            onChange={(val) => patch({ toFacility: val })}
            options={REFERRAL_FACILITY_RECOMMENDATIONS}
            placeholder="e.g. Tertiary Care Center, Government Medical College"
          />
        </div>

        <ClinicalDropdownTextarea
          icon={faFileMedical}
          label="Reason for referral"
          name="reason"
          value={referral.reason ?? ""}
          onChange={(val) => patch({ reason: val })}
          options={REFERRAL_REASON_RECOMMENDATIONS}
          placeholder="Clinical justification for specialist consultation or surgical evaluation…"
          rows={2}
        />

        <ClinicalDropdownTextarea
          icon={faClipboard}
          label="Clinical notes"
          name="notes"
          value={referral.notes ?? ""}
          onChange={(val) => patch({ notes: val })}
          options={REFERRAL_NOTES_RECOMMENDATIONS}
          placeholder="Summary of presentation, findings, and current treatment for recipient clinician…"
          rows={3}
        />

        {error ? <Banner variant="error">{error}</Banner> : null}
        <div>
          <Button type="button" variant="secondary" onClick={download} loading={loading}>
            Download referral PDF
          </Button>
        </div>
      </div>
    </CollapsibleSection>
  );
}

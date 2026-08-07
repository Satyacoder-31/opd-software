"use client";

import { useState } from "react";
import { generateReferralPdf } from "@/actions/consultations";
import { Button } from "@/components/ui/Button";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Banner } from "@/components/ui/Banner";
import { sectionCompletion, sectionSummary } from "@/lib/consultation-clinical";
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
          <Input label="Specialty" value={referral.toSpecialty ?? ""} onChange={(e) => patch({ toSpecialty: e.target.value })} placeholder="e.g. Cardiology" />
          <Input label="Facility / clinician" value={referral.toFacility ?? ""} onChange={(e) => patch({ toFacility: e.target.value })} />
        </div>
        <Textarea label="Reason for referral" value={referral.reason ?? ""} onChange={(e) => patch({ reason: e.target.value })} rows={2} />
        <Textarea label="Clinical notes" value={referral.notes ?? ""} onChange={(e) => patch({ notes: e.target.value })} rows={3} />
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

import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { DetailRow } from "@/components/ui/DetailRow";
import {
  sectionCompletion,
  sectionSummary,
} from "@/lib/consultation-clinical";
import type { ConsultationClinicalData } from "@/lib/types";
import type { Vitals } from "@/lib/types";

type ConsultationProfileProps = ConsultationClinicalData;

function MultilineValue({ value }: { value?: string | null }) {
  if (!value?.trim()) return "—";
  return <span className="whitespace-pre-wrap">{value}</span>;
}

function RecordRows({
  fields,
}: {
  fields: Array<{ label: string; value?: string }>;
}) {
  const filled = fields.filter((f) => f.value?.trim());
  if (filled.length === 0) {
    return <p className="text-sm text-muted-foreground">No details recorded.</p>;
  }
  return (
    <dl>
      {filled.map((field) => (
        <DetailRow
          key={field.label}
          label={field.label}
          value={<MultilineValue value={field.value} />}
        />
      ))}
    </dl>
  );
}

export function ConsultationProfile(data: ConsultationProfileProps) {
  const v = (data.vitals as Vitals) ?? {};
  const clinicalPresentation = data.clinicalPresentation ?? {};
  const patientHistory = data.patientHistory ?? {};
  const examination = data.examination ?? {};
  const investigationResults = data.investigationResults ?? {};
  const medicalCertificate = data.medicalCertificate ?? {};
  const completion = sectionCompletion(data);

  return (
    <div>
      <CollapsibleSection
        flush
        contentClassName="px-4"
        title="Vitals"
        summary={sectionSummary(completion.vitals)}
        filled={completion.vitals.filled}
      >
        <dl>
          <DetailRow label="BP" value={v.bp || "—"} />
          <DetailRow label="Pulse" value={v.pulse || "—"} />
          <DetailRow label="Temp" value={v.temp || "—"} />
          <DetailRow label="Weight" value={v.weight || "—"} />
          <DetailRow label="SpO2" value={v.spo2 || "—"} />
        </dl>
      </CollapsibleSection>

      <CollapsibleSection
        flush
        contentClassName="px-4"
        title="Clinical presentation"
        summary={sectionSummary(completion.clinicalPresentation)}
        filled={completion.clinicalPresentation.filled}
      >
        <dl>
          <DetailRow
            label="Chief complaint"
            value={<MultilineValue value={data.chiefComplaint} />}
          />
          <DetailRow
            label="History of present illness"
            value={
              <MultilineValue value={clinicalPresentation.historyOfPresentIllness} />
            }
          />
          <DetailRow label="Onset" value={clinicalPresentation.onset || "—"} />
          <DetailRow
            label="Duration"
            value={clinicalPresentation.duration || "—"}
          />
        </dl>
      </CollapsibleSection>

      <CollapsibleSection
        flush
        contentClassName="px-4"
        title="Patient history"
        summary={sectionSummary(completion.patientHistory)}
        filled={completion.patientHistory.filled}
      >
        <RecordRows
          fields={[
            { label: "Past medical history", value: patientHistory.pastMedical },
            { label: "Past surgical history", value: patientHistory.pastSurgical },
            { label: "Allergies", value: patientHistory.allergies },
            { label: "Current medications", value: patientHistory.medications },
            { label: "Family history", value: patientHistory.familyHistory },
            { label: "Social history", value: patientHistory.socialHistory },
          ]}
        />
      </CollapsibleSection>

      <CollapsibleSection
        flush
        contentClassName="px-4"
        title="Examination"
        summary={sectionSummary(completion.examination)}
        filled={completion.examination.filled}
      >
        <RecordRows
          fields={[
            { label: "General", value: examination.general },
            { label: "Cardiovascular", value: examination.cardiovascular },
            { label: "Respiratory", value: examination.respiratory },
            { label: "Abdomen", value: examination.abdomen },
            { label: "Neurological", value: examination.neurological },
            { label: "Other findings", value: examination.other },
          ]}
        />
      </CollapsibleSection>

      <CollapsibleSection
        flush
        contentClassName="px-4"
        title="Investigation results"
        summary={sectionSummary(completion.investigationResults)}
        filled={completion.investigationResults.filled}
      >
        <RecordRows
          fields={[
            { label: "Lab results", value: investigationResults.labs },
            { label: "Imaging", value: investigationResults.imaging },
            { label: "Other investigations", value: investigationResults.other },
          ]}
        />
      </CollapsibleSection>

      <CollapsibleSection
        flush
        contentClassName="px-4"
        title="Diagnosis"
        summary={sectionSummary(completion.diagnosis)}
        filled={completion.diagnosis.filled}
      >
        <dl>
          <DetailRow
            label="Diagnosis"
            value={<MultilineValue value={data.diagnosis} />}
          />
        </dl>
      </CollapsibleSection>

      <CollapsibleSection
        flush
        contentClassName="px-4"
        title="Annotations"
        summary={sectionSummary(completion.notes)}
        filled={completion.notes.filled}
      >
        <dl>
          <DetailRow label="Notes" value={<MultilineValue value={data.notes} />} />
        </dl>
      </CollapsibleSection>

      <CollapsibleSection
        flush
        contentClassName="px-4"
        title="Medical certificate"
        summary={sectionSummary(completion.medicalCertificate)}
        filled={completion.medicalCertificate.filled}
      >
        <RecordRows
          fields={[
            {
              label: "Diagnosis for certificate",
              value: medicalCertificate.diagnosisForCertificate,
            },
            { label: "Rest from", value: medicalCertificate.restFrom },
            { label: "Rest to", value: medicalCertificate.restTo },
            { label: "Fitness status", value: medicalCertificate.fitnessStatus },
            { label: "Remarks", value: medicalCertificate.remarks },
          ]}
        />
      </CollapsibleSection>
    </div>
  );
}

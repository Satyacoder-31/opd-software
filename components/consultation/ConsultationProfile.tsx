import { DetailRow } from "@/components/ui/DetailRow";
import {
  formatVitalValue,
  sectionCompletion,
  vitalFieldLabel,
  VITAL_FIELDS,
} from "@/lib/consultation-clinical";
import type { ConsultationClinicalData, Vitals } from "@/lib/types";

type ProfileSectionKey =
  | "vitals"
  | "clinicalPresentation"
  | "patientHistory"
  | "examination"
  | "investigationResults"
  | "diagnosis"
  | "notes"
  | "medicalCertificate";

type ConsultationProfileProps = ConsultationClinicalData & {
  include?: ProfileSectionKey[];
};

function MultilineValue({ value }: { value?: string | null }) {
  if (!value?.trim()) return "—";
  return <span className="whitespace-pre-wrap">{value}</span>;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-5 py-5 sm:px-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </section>
  );
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

export function ConsultationProfile({
  include,
  ...data
}: ConsultationProfileProps) {
  const v = (data.vitals as Vitals) ?? {};
  const clinicalPresentation = data.clinicalPresentation ?? {};
  const patientHistory = data.patientHistory ?? {};
  const examination = data.examination ?? {};
  const investigationResults = data.investigationResults ?? {};
  const medicalCertificate = data.medicalCertificate ?? {};
  const completion = sectionCompletion(data);

  const sections: Array<{
    key: ProfileSectionKey;
    title: string;
    filled: boolean;
    content: React.ReactNode;
  }> = [
    {
      key: "vitals",
      title: "Vitals",
      filled: completion.vitals.filled,
      content: (
        <RecordRows
          fields={VITAL_FIELDS.map((field) => ({
            label: vitalFieldLabel(field.label, field.unit),
            value: formatVitalValue(v[field.key], field.unit),
          }))}
        />
      ),
    },
    {
      key: "clinicalPresentation",
      title: "Clinical presentation",
      filled: completion.clinicalPresentation.filled,
      content: (
        <RecordRows
          fields={[
            { label: "Chief complaint", value: data.chiefComplaint },
            {
              label: "History of present illness",
              value: clinicalPresentation.historyOfPresentIllness,
            },
            { label: "Onset", value: clinicalPresentation.onset },
            { label: "Duration", value: clinicalPresentation.duration },
          ]}
        />
      ),
    },
    {
      key: "patientHistory",
      title: "Patient history",
      filled: completion.patientHistory.filled,
      content: (
        <RecordRows
          fields={[
            { label: "Past medical history", value: patientHistory.pastMedical },
            {
              label: "Past surgical history",
              value: patientHistory.pastSurgical,
            },
            { label: "Allergies", value: patientHistory.allergies },
            { label: "Current medications", value: patientHistory.medications },
            { label: "Family history", value: patientHistory.familyHistory },
            { label: "Social history", value: patientHistory.socialHistory },
          ]}
        />
      ),
    },
    {
      key: "examination",
      title: "Examination",
      filled: completion.examination.filled,
      content: (
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
      ),
    },
    {
      key: "investigationResults",
      title: "Investigation results",
      filled: completion.investigationResults.filled,
      content: (
        <RecordRows
          fields={[
            { label: "Lab results", value: investigationResults.labs },
            { label: "Imaging", value: investigationResults.imaging },
            { label: "Other investigations", value: investigationResults.other },
          ]}
        />
      ),
    },
    {
      key: "diagnosis",
      title: "Diagnosis",
      filled: completion.diagnosis.filled,
      content: (
        <p className="text-sm text-ink">
          <MultilineValue value={data.diagnosis} />
        </p>
      ),
    },
    {
      key: "notes",
      title: "Annotations",
      filled: completion.notes.filled,
      content: (
        <p className="text-sm text-ink">
          <MultilineValue value={data.notes} />
        </p>
      ),
    },
    {
      key: "medicalCertificate",
      title: "Medical certificate",
      filled: completion.medicalCertificate.filled,
      content: (
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
      ),
    },
  ];

  const visibleSections = include
    ? sections.filter((section) => include.includes(section.key))
    : sections;
  const filledSections = visibleSections.filter((section) => section.filled);
  const emptySections = visibleSections.filter((section) => !section.filled);

  if (filledSections.length === 0) {
    return (
      <p className="px-5 py-6 text-sm text-muted-foreground sm:px-6">
        Nothing was recorded during this consultation.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border">
      {filledSections.map((section) => (
        <Section key={section.title} title={section.title}>
          {section.content}
        </Section>
      ))}
      {emptySections.length > 0 && (
        <p className="px-5 py-4 text-sm text-muted-foreground sm:px-6">
          Not recorded:{" "}
          {emptySections.map((section) => section.title).join(", ")}
        </p>
      )}
    </div>
  );
}

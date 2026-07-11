import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { DetailRow } from "@/components/ui/DetailRow";
import {
  medicineFilled,
  medicineSummary,
  medicineTitle,
  textSectionSummary,
} from "@/lib/prescription-utils";
import type { Medicine } from "@/lib/types";

type PrescriptionProfileProps = {
  medicines: Medicine[];
  advice?: string | null;
  followUp?: string | null;
};

function MultilineValue({ value }: { value?: string | null }) {
  if (!value?.trim()) return "—";
  return <span className="whitespace-pre-wrap">{value}</span>;
}

export function PrescriptionProfile({
  medicines,
  advice,
  followUp,
}: PrescriptionProfileProps) {
  const filledMedicines = medicines.filter((m) => m.name?.trim());

  return (
    <div>
      {filledMedicines.length === 0 ? (
        <p className="border-b border-border px-4 py-4 text-sm text-muted-foreground">
          No medicines prescribed yet.
        </p>
      ) : (
        filledMedicines.map((med, index) => (
          <CollapsibleSection
            key={index}
            flush
            contentClassName="px-4"
            title={medicineTitle(med, index)}
            summary={medicineSummary(med)}
            filled={medicineFilled(med)}
          >
            <dl>
              <DetailRow label="Dosage" value={med.dosage || "—"} />
              <DetailRow label="Frequency" value={med.frequency || "—"} />
              <DetailRow label="Duration" value={med.duration || "—"} />
              <DetailRow
                label="Instructions"
                value={med.instructions?.trim() || "—"}
              />
            </dl>
          </CollapsibleSection>
        ))
      )}

      <CollapsibleSection
        flush
        contentClassName="px-4"
        title="Advice"
        summary={textSectionSummary(advice)}
        filled={!!advice?.trim()}
      >
        <p className="text-sm text-ink">
          <MultilineValue value={advice} />
        </p>
      </CollapsibleSection>

      <CollapsibleSection
        flush
        contentClassName="px-4"
        title="Follow-up"
        summary={textSectionSummary(followUp)}
        filled={!!followUp?.trim()}
      >
        <p className="text-sm text-ink">
          <MultilineValue value={followUp} />
        </p>
      </CollapsibleSection>
    </div>
  );
}

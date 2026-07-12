import { PillIcon } from "lucide-react";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { DetailRow } from "@/components/ui/DetailRow";
import { EmptyState } from "@/components/ui/EmptyState";
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
        <EmptyState
          icon={PillIcon}
          title="No medicines prescribed yet"
          description="Medicines added during consultation will appear here."
          compact
        />
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

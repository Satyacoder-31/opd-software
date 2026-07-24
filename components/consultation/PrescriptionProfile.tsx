import { faPills } from "@fortawesome/free-solid-svg-icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { medicineTitle } from "@/lib/prescription-utils";
import type { Medicine } from "@/lib/types";
import { cn } from "@/lib/utils";

type PrescriptionProfileProps = {
  medicines: Medicine[];
  advice?: string | null;
  followUp?: string | null;
};

function MultilineValue({ value }: { value?: string | null }) {
  if (!value?.trim()) return "—";
  return <span className="whitespace-pre-wrap">{value}</span>;
}

function CellValue({ value }: { value?: string | null }) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return <span className="text-muted-foreground">—</span>;
  }
  return <>{trimmed}</>;
}

const MEDICINE_COLUMNS = [
  { key: "index", label: "#" },
  { key: "name", label: "Medicine" },
  { key: "dosage", label: "Dosage" },
  { key: "route", label: "Route" },
  { key: "frequency", label: "Frequency" },
  { key: "duration", label: "Duration" },
  { key: "instructions", label: "Instructions" },
] as const;

const MEDICINE_ROW_GRID =
  "grid grid-cols-[2rem_minmax(10rem,1.6fr)_minmax(5.5rem,0.8fr)_minmax(5rem,0.7fr)_minmax(7rem,1fr)_minmax(5rem,0.7fr)_minmax(8rem,1.2fr)] gap-x-3";

export function PrescriptionProfile({
  medicines,
  advice,
  followUp,
}: PrescriptionProfileProps) {
  const filledMedicines = medicines.filter((m) => m.name?.trim());

  return (
    <div className="divide-y divide-border">
      <section className="py-5">
        <h3 className="px-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-6">
          Medicines
        </h3>
        {filledMedicines.length === 0 ? (
          <div className="mt-2 px-5 sm:px-6">
            <EmptyState
              icon={faPills}
              title="No medicines prescribed"
              description="Medicines added during consultation will appear here."
              compact
            />
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto scrollbar-hide">
            <div
              role="table"
              aria-label="Prescribed medicines"
              className="min-w-[44rem] text-sm"
            >
              <div
                role="row"
                className={cn(
                  MEDICINE_ROW_GRID,
                  "border-y border-border bg-surface-muted/60 px-5 py-2.5 text-xs font-medium text-muted-foreground sm:px-6"
                )}
              >
                {MEDICINE_COLUMNS.map((column) => (
                  <div key={column.key} role="columnheader">
                    {column.label}
                  </div>
                ))}
              </div>

              <div role="rowgroup" className="divide-y divide-border">
                {filledMedicines.map((med, index) => (
                  <div
                    key={index}
                    role="row"
                    className={cn(MEDICINE_ROW_GRID, "px-5 py-3 sm:px-6")}
                  >
                    <div
                      role="cell"
                      className="tabular-nums text-muted-foreground"
                    >
                      {index + 1}
                    </div>
                    <div role="cell" className="min-w-0 font-medium text-ink">
                      {medicineTitle(med, index)}
                    </div>
                    <div role="cell" className="text-ink">
                      <CellValue value={med.dosage} />
                    </div>
                    <div role="cell" className="text-ink">
                      <CellValue value={med.route} />
                    </div>
                    <div role="cell" className="text-ink">
                      <CellValue value={med.frequency} />
                    </div>
                    <div role="cell" className="text-ink">
                      <CellValue value={med.duration} />
                    </div>
                    <div role="cell" className="text-ink">
                      <CellValue value={med.instructions} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="px-5 py-5 sm:px-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Advice
        </h3>
        <p className="mt-2 text-sm text-ink">
          <MultilineValue value={advice} />
        </p>
      </section>

      <section className="px-5 py-5 sm:px-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Follow-up
        </h3>
        <p className="mt-2 text-sm text-ink">
          <MultilineValue value={followUp} />
        </p>
      </section>
    </div>
  );
}

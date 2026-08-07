type Test = {
  id: string;
  name: string;
  code: string | null;
  sampleType: string | null;
  feeAmount: unknown;
  isActive: boolean;
};

type LabCatalogViewProps = {
  tests: Test[];
};

export function LabCatalogView({ tests }: LabCatalogViewProps) {
  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {tests.length === 0 ? (
        <li className="px-4 py-3 text-sm text-muted-foreground">
          No lab tests yet. Open Edit to add tests.
        </li>
      ) : null}
      {tests.map((test) => (
        <li
          key={test.id}
          className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
        >
          <span>
            <strong>{test.name}</strong>
            <span className="block text-muted-foreground">
              {[
                test.code,
                test.sampleType,
                test.feeAmount ? `₹${Number(test.feeAmount)}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              {!test.isActive ? " · inactive" : ""}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

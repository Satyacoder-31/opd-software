import { faIndianRupeeSign } from "@fortawesome/free-solid-svg-icons";
import { EmptyState } from "@/components/ui/EmptyState";

export type FeeRow = {
  id: string;
  name: string;
  amount: number;
  isActive: boolean;
  hsnSac: string | null;
};

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

export function FeeItemLabel({ item }: { item: FeeRow }) {
  return (
    <span className="min-w-0 break-words">
      {item.name}{" "}
      <span className="tabular-nums text-muted-foreground">
        · {formatAmount(item.amount)}
        {!item.isActive ? " · inactive" : ""}
        {item.hsnSac ? ` · HSN/SAC ${item.hsnSac}` : ""}
      </span>
    </span>
  );
}

type FeeMasterViewProps = {
  items: FeeRow[];
};

export function FeeMasterView({ items }: FeeMasterViewProps) {
  return (
    <ul className="flex flex-col gap-3">
      {items.length === 0 ? (
        <li>
          <EmptyState
            icon={faIndianRupeeSign}
            title="No fee items yet"
            description="Open Edit to add consultation and procedure fees."
            compact
          />
        </li>
      ) : null}
      {items.map((item) => (
        <li
          key={item.id}
          className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
        >
          <FeeItemLabel item={item} />
        </li>
      ))}
    </ul>
  );
}

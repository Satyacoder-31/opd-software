"use client";

import {
  faArrowTrendDown,
  faArrowTrendUp,
  faClockRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import type { StockMovementRecord } from "@/actions/medicines";

type StockMovementsTableProps = {
  movements: StockMovementRecord[];
  loading?: boolean;
};

export function StockMovementsTable({
  movements,
  loading = false,
}: StockMovementsTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
        Loading stock movement audit logs…
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
          <Icon icon={faClockRotateLeft} className="size-5" />
        </div>
        <p className="text-sm font-medium text-ink">No stock movements recorded yet</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Stock movements will appear here automatically when medicines are restocked, adjusted, or prescribed during patient consultations.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Date & Time</th>
            <th className="px-4 py-3">Medicine</th>
            <th className="px-4 py-3">Transaction</th>
            <th className="px-4 py-3 text-right">Change</th>
            <th className="px-4 py-3 text-right">Balance</th>
            <th className="px-4 py-3">Reference / Remarks</th>
            <th className="px-4 py-3">User</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {movements.map((m) => {
            const isAddition = m.quantity > 0;
            const isDispense = m.type === "consultation";

            return (
              <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(m.createdAt).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-ink block">{m.drug.name}</span>
                  {m.drug.category ? (
                    <span className="text-[11px] text-muted-foreground">
                      {m.drug.category}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {isDispense ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                      <Icon icon={faArrowTrendDown} className="size-3" />
                      Consultation Rx
                    </span>
                  ) : m.type === "purchase" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      <Icon icon={faArrowTrendUp} className="size-3" />
                      Restock / Receipt
                    </span>
                  ) : m.type === "initial" ? (
                    <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-400">
                      Opening Balance
                    </span>
                  ) : m.type === "expired" ? (
                    <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-700 dark:text-rose-400">
                      Expired Discard
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                      Adjustment
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right font-semibold">
                  <span
                    className={cn(
                      isAddition
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {isAddition ? `+${m.quantity}` : m.quantity}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right font-medium text-ink">
                  {m.balanceAfter}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
                  {m.notes || m.reference || "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                  {m.createdByUser?.name || "System"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

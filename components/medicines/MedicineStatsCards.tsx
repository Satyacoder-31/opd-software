"use client";

import {
  faBoxesStacked,
  faTriangleExclamation,
  faCircleExclamation,
  faCalendarXmark,
  faIndianRupeeSign,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import type { MedicineStats } from "@/actions/medicines";

type MedicineStatsCardsProps = {
  stats: MedicineStats;
  currentFilter?: string;
  onFilterChange?: (filter: "all" | "in_stock" | "low_stock" | "out_of_stock" | "expiring_soon") => void;
};

export function MedicineStatsCards({
  stats,
  currentFilter = "all",
  onFilterChange,
}: MedicineStatsCardsProps) {
  const cards = [
    {
      id: "all",
      label: "Total Medicines",
      value: stats.totalMedicines,
      subtext: `${stats.totalStockUnits.toLocaleString("en-IN")} total units in stock`,
      icon: faBoxesStacked,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      id: "in_stock",
      label: "Adequate Stock",
      value: stats.inStockCount,
      subtext: "Above reorder threshold",
      icon: faCircleCheck,
      color: "text-emerald-700 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      id: "low_stock",
      label: "Low Stock Alert",
      value: stats.lowStockCount,
      subtext: "At or below reorder level",
      icon: faTriangleExclamation,
      color: "text-amber-700 dark:text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/25",
      urgent: stats.lowStockCount > 0,
    },
    {
      id: "out_of_stock",
      label: "Out of Stock",
      value: stats.outOfStockCount,
      subtext: "Unavailable for prescription",
      icon: faCircleExclamation,
      color: "text-rose-700 dark:text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/25",
      urgent: stats.outOfStockCount > 0,
    },
    {
      id: "expiring_soon",
      label: "Expiring Soon",
      value: stats.expiringSoonCount,
      subtext: "Within 60 days or expired",
      icon: faCalendarXmark,
      color: "text-purple-700 dark:text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      urgent: stats.expiringSoonCount > 0,
    },
    {
      id: "valuation",
      label: "Inventory Value",
      value: `₹${stats.inventoryValuation.toLocaleString("en-IN")}`,
      subtext: "Retail inventory MRP worth",
      icon: faIndianRupeeSign,
      color: "text-blue-700 dark:text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      nonClickable: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((c) => {
        const isSelected = currentFilter === c.id;
        const clickable = !c.nonClickable && onFilterChange;

        return (
          <div
            key={c.id}
            onClick={() => {
              if (clickable) {
                onFilterChange(c.id as "all" | "in_stock" | "low_stock" | "out_of_stock" | "expiring_soon");
              }
            }}
            className={cn(
              "group relative flex flex-col justify-between rounded-xl border p-3.5 transition-all duration-200",
              c.border,
              clickable ? "cursor-pointer hover:shadow-md hover:border-primary/40 active:scale-[0.99]" : "",
              isSelected ? "ring-2 ring-primary ring-offset-2 bg-card shadow-sm" : "bg-card/80"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground truncate">{c.label}</span>
              <div className={cn("flex size-7 items-center justify-center rounded-lg shrink-0", c.bg, c.color)}>
                <Icon icon={c.icon} className="size-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className={cn("text-xl font-bold tracking-tight text-ink", c.urgent ? c.color : "")}>
                {c.value}
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground truncate leading-tight">
                {c.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

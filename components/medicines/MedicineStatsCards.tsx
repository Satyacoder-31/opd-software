"use client";

import {
  faGlobe,
  faPills,
  faSyringe,
  faFlask,
  faBandage,
  faEyeDropper,
} from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import type { MedicineStats } from "@/actions/medicines";

type MedicineStatsCardsProps = {
  stats: MedicineStats;
  currentCategory?: string;
  onCategoryChange?: (category: string) => void;
};

export function MedicineStatsCards({
  stats,
  currentCategory = "all",
  onCategoryChange,
}: MedicineStatsCardsProps) {
  const cards = [
    {
      id: "all",
      label: "Global Catalog",
      value: stats.totalMedicines.toLocaleString("en-IN"),
      subtext: "Worldwide & NLEM Directory",
      icon: faGlobe,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
    {
      id: "Tablet",
      label: "Tablets & Capsules",
      value: (stats.oralCount || 0).toLocaleString("en-IN"),
      subtext: "Oral solids & sustained release",
      icon: faPills,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      id: "Injection",
      label: "Injections & IV",
      value: (stats.injectionCount || 0).toLocaleString("en-IN"),
      subtext: "Vials, ampoules & infusions",
      icon: faSyringe,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
    {
      id: "Syrup",
      label: "Syrups & Suspensions",
      value: (stats.syrupCount || 0).toLocaleString("en-IN"),
      subtext: "Pediatric & oral liquids",
      icon: faFlask,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      id: "Gel / Ointment",
      label: "Topicals & Ointments",
      value: (stats.topicalCount || 0).toLocaleString("en-IN"),
      subtext: "Gels, creams & liniments",
      icon: faBandage,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      id: "Drops",
      label: "Drops & Inhalers",
      value: (stats.dropsCount || 0).toLocaleString("en-IN"),
      subtext: "Eye, ear, nasal & MDI sprays",
      icon: faEyeDropper,
      color: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((c) => {
        const isSelected = currentCategory === c.id;
        const clickable = Boolean(onCategoryChange);

        return (
          <div
            key={c.id}
            onClick={() => {
              if (clickable && onCategoryChange) {
                onCategoryChange(c.id);
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
              <div className="text-xl font-bold tracking-tight text-ink">
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

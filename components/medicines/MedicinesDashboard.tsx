"use client";

import { useEffect, useState, useTransition } from "react";
import {
  faPlus,
  faArrowsRotate,
  faMagnifyingGlass,
  faPills,
} from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type {
  MedicineRecord,
  MedicineStats,
  StockMovementRecord,
} from "@/actions/medicines";
import {
  listMedicines,
  getMedicineStats,
} from "@/actions/medicines";
import { MedicineStatsCards } from "./MedicineStatsCards";
import { MedicineTable } from "./MedicineTable";
import { AddMedicineModal } from "./AddMedicineModal";

type MedicinesDashboardProps = {
  initialMedicines: MedicineRecord[];
  initialStats: MedicineStats;
  initialMovements: StockMovementRecord[];
};

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Formulations & Categories" },
  { value: "Tablet", label: "Tablets & Capsules" },
  { value: "Syrup", label: "Syrups & Suspensions" },
  { value: "Injection", label: "Injections & IV Infusions" },
  { value: "Gel / Ointment", label: "Gels, Ointments & Creams" },
  { value: "Drops", label: "Eye, Ear & Nasal Drops" },
  { value: "Inhaler", label: "Inhalers & Respules" },
  { value: "Sachet", label: "Sachets & Powders" },
  { value: "Suppository", label: "Suppositories & Enemas" },
  { value: "Other", label: "Other Formulations" },
];

export function MedicinesDashboard({
  initialMedicines,
  initialStats,
}: MedicinesDashboardProps) {
  const [medicines, setMedicines] = useState<MedicineRecord[]>(initialMedicines);
  const [stats, setStats] = useState<MedicineStats>(initialStats);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "usage">("name");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function reloadData() {
    startTransition(async () => {
      const [newMeds, newStats] = await Promise.all([
        listMedicines({
          query: searchQuery,
          category: selectedCategory,
          sortBy,
        }),
        getMedicineStats(),
      ]);
      setMedicines(newMeds);
      setStats(newStats);
    });
  }

  // Refetch when search, category, or sorting changes
  useEffect(() => {
    const handler = setTimeout(() => {
      void (async () => {
        const newMeds = await listMedicines({
          query: searchQuery,
          category: selectedCategory,
          sortBy,
        });
        setMedicines(newMeds);
      })();
    }, 200);

    return () => clearTimeout(handler);
  }, [searchQuery, selectedCategory, sortBy]);

  return (
    <div className="flex flex-col gap-6">
      {/* Category breakdown overview */}
      <MedicineStatsCards
        stats={stats}
        currentCategory={selectedCategory}
        onCategoryChange={(cat) => setSelectedCategory(cat)}
      />

      {/* Header controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3.5 py-2 text-sm font-semibold shadow-xs">
            <Icon icon={faPills} className="size-4" />
            Medicines Directory
            <span className="ml-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs font-bold">
              {medicines.length}
            </span>
          </div>
          {selectedCategory !== "all" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className="text-xs text-muted-foreground hover:text-ink"
            >
              Reset Category
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void reloadData()}
            loading={isPending}
            title="Refresh medicines"
          >
            <Icon icon={faArrowsRotate} className="size-3.5" />
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Icon icon={faPlus} className="size-3.5" />
            Add Medicine
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Filters Bar */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 bg-card/60 p-3 rounded-xl border border-border">
          <div className="relative">
            <Input
              placeholder="Search name, generic salt, class, manufacturer…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
            <Icon
              icon={faMagnifyingGlass}
              className="absolute left-3 top-3 size-4 text-muted-foreground pointer-events-none"
            />
          </div>

          <Select
            label="Filter by Category"
            hideLabel
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={CATEGORY_OPTIONS}
          />

          <Select
            label="Sort Medicines"
            hideLabel
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "name" | "usage")
            }
            options={[
              { value: "name", label: "Sort: Name (A-Z)" },
              { value: "usage", label: "Sort: Consultation Usage (Highest First)" },
            ]}
          />
        </div>

        {/* Table */}
        <MedicineTable
          medicines={medicines}
          onRefresh={reloadData}
        />
      </div>

      {/* Add Medicine Modal */}
      <AddMedicineModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={reloadData}
      />
    </div>
  );
}

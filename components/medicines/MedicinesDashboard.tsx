"use client";

import { useEffect, useState, useTransition } from "react";
import {
  faPlus,
  faArrowsRotate,
  faBoxesPacking,
  faMagnifyingGlass,
  faClockRotateLeft,
  faPills,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Banner } from "@/components/ui/Banner";
import type {
  MedicineRecord,
  MedicineStats,
  StockMovementRecord,
} from "@/actions/medicines";
import {
  listMedicines,
  getMedicineStats,
  listStockMovements,
  seedCommonMedicinesWithStock,
} from "@/actions/medicines";
import { MedicineStatsCards } from "./MedicineStatsCards";
import { MedicineTable } from "./MedicineTable";
import { AddMedicineModal } from "./AddMedicineModal";
import { StockMovementsTable } from "./StockMovementsTable";

type MedicinesDashboardProps = {
  initialMedicines: MedicineRecord[];
  initialStats: MedicineStats;
  initialMovements: StockMovementRecord[];
};

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "Tablet", label: "Tablets" },
  { value: "Capsule", label: "Capsules" },
  { value: "Syrup", label: "Syrups & Suspensions" },
  { value: "Injection", label: "Injections & Ampoules" },
  { value: "IV Fluid", label: "IV Fluids & Infusions" },
  { value: "Gel / Ointment", label: "Gels, Ointments & Creams" },
  { value: "Drops", label: "Eye, Ear & Nasal Drops" },
  { value: "Inhaler", label: "Inhalers & Respules" },
  { value: "Sachet", label: "Sachets & Powders" },
  { value: "Suppository", label: "Suppositories & Pessaries" },
  { value: "Other", label: "Other" },
];

export function MedicinesDashboard({
  initialMedicines,
  initialStats,
  initialMovements,
}: MedicinesDashboardProps) {
  const [medicines, setMedicines] = useState<MedicineRecord[]>(initialMedicines);
  const [stats, setStats] = useState<MedicineStats>(initialStats);
  const [movements, setMovements] = useState<StockMovementRecord[]>(initialMovements);

  const [activeTab, setActiveTab] = useState<"catalog" | "movements">("catalog");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<
    "all" | "in_stock" | "low_stock" | "out_of_stock" | "expiring_soon"
  >("all");
  const [sortBy, setSortBy] = useState<"name" | "stock" | "expiry" | "usage">("name");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [seedSuccessMessage, setSeedSuccessMessage] = useState<string | null>(null);

  async function reloadData() {
    startTransition(async () => {
      const [newMeds, newStats, newMovements] = await Promise.all([
        listMedicines({
          query: searchQuery,
          category: selectedCategory,
          status: selectedStatus,
          sortBy,
        }),
        getMedicineStats(),
        listStockMovements(),
      ]);
      setMedicines(newMeds);
      setStats(newStats);
      setMovements(newMovements);
    });
  }

  // Refetch when search, category, status, or sorting changes
  useEffect(() => {
    const handler = setTimeout(() => {
      void (async () => {
        const newMeds = await listMedicines({
          query: searchQuery,
          category: selectedCategory,
          status: selectedStatus,
          sortBy,
        });
        setMedicines(newMeds);
      })();
    }, 200);

    return () => clearTimeout(handler);
  }, [searchQuery, selectedCategory, selectedStatus, sortBy]);

  async function handleSeedCatalog() {
    startTransition(async () => {
      const res = await seedCommonMedicinesWithStock();
      if (res.success) {
        setSeedSuccessMessage(
          `Successfully imported / updated ${res.data.addedCount} standard OPD & Orthopaedic medicines with opening stocks!`
        );
        setTimeout(() => setSeedSuccessMessage(null), 6000);
        await reloadData();
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {seedSuccessMessage ? (
        <Banner variant="info">{seedSuccessMessage}</Banner>
      ) : null}

      {/* KPI Stats overview */}
      <MedicineStatsCards
        stats={stats}
        currentFilter={selectedStatus}
        onFilterChange={(filter) => {
          setSelectedStatus(filter);
          setActiveTab("catalog");
        }}
      />

      {/* Header controls & Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("catalog")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
              activeTab === "catalog"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-ink"
            }`}
          >
            <Icon icon={faPills} className="size-4" />
            Medicine Inventory
            <span className="ml-1 rounded-full bg-primary-foreground/20 px-1.5 py-0.2 text-[11px]">
              {medicines.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("movements")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
              activeTab === "movements"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-ink"
            }`}
          >
            <Icon icon={faClockRotateLeft} className="size-4" />
            Stock Audit Logs
            <span className="ml-1 rounded-full bg-muted-foreground/20 px-1.5 py-0.2 text-[11px]">
              {movements.length}
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void reloadData()}
            loading={isPending}
            title="Refresh data"
          >
            <Icon icon={faArrowsRotate} className="size-3.5" />
          </Button>

          {stats.totalMedicines < 20 ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void handleSeedCatalog()}
              loading={isPending}
              title="Populate common OPD & Orthopaedic drugs with opening stock"
            >
              <Icon icon={faBoxesPacking} className="size-3.5" />
              Import Standard OPD Drugs
            </Button>
          ) : null}

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

      {activeTab === "catalog" ? (
        <div className="flex flex-col gap-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 bg-card/60 p-3 rounded-xl border border-border">
            <div className="relative">
              <Input
                placeholder="Search name, salt, batch, manufacturer…"
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
              label="Filter by Stock Status"
              hideLabel
              value={selectedStatus}
              onChange={(e) =>
                setSelectedStatus(
                  e.target.value as "all" | "in_stock" | "low_stock" | "out_of_stock" | "expiring_soon"
                )
              }
              options={[
                { value: "all", label: "All Stock Levels" },
                { value: "in_stock", label: "In Stock Only" },
                { value: "low_stock", label: "Low Stock Alert (≤ Min)" },
                { value: "out_of_stock", label: "Out of Stock (0)" },
                { value: "expiring_soon", label: "Expiring Soon / Expired" },
              ]}
            />

            <Select
              label="Sort Medicines"
              hideLabel
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "name" | "stock" | "expiry" | "usage")
              }
              options={[
                { value: "name", label: "Sort: Name (A-Z)" },
                { value: "stock", label: "Sort: Stock Quantity (Lowest First)" },
                { value: "usage", label: "Sort: Consultation Usage (Highest)" },
                { value: "expiry", label: "Sort: Expiry Date (Earliest First)" },
              ]}
            />
          </div>

          {selectedStatus === "low_stock" || selectedStatus === "out_of_stock" ? (
            <Banner variant="info" className="py-2 text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <Icon icon={faTriangleExclamation} className="size-3.5 text-amber-600" />
                Showing medicines requiring reorder or restock. Click &ldquo;Restock&rdquo; on any item to receive units.
              </span>
            </Banner>
          ) : null}

          {/* Table */}
          <MedicineTable
            medicines={medicines}
            onRefresh={reloadData}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Real-time audit log of all stock received, adjustments made, and medicines dispensed during patient consultations.
            </p>
          </div>
          <StockMovementsTable movements={movements} loading={isPending} />
        </div>
      )}

      {/* Add Medicine Modal */}
      <AddMedicineModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={reloadData}
      />
    </div>
  );
}

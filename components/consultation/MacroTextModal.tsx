"use client";

import { useState, useMemo, useEffect } from "react";
import { FontAwesomeIcon as Icon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faPlus,
  faTrashCan,
  faMagnifyingGlass,
  faCheck,
  faFileLines,
} from "@fortawesome/free-solid-svg-icons";
import {
  type ClinicalMacro,
  loadAllClinicalMacros,
  saveCustomClinicalMacro,
  deleteCustomClinicalMacro,
} from "@/lib/clinical-macros";
import { Button } from "@/components/ui/Button";

export type MacroTextModalProps = {
  isOpen: boolean;
  category?: "complaints" | "examination" | "advice" | "plan" | "all";
  onClose: () => void;
  onSelectMacro: (description: string) => void;
};

export function MacroTextModal({
  isOpen,
  category = "all",
  onClose,
  onSelectMacro,
}: MacroTextModalProps) {
  const [macros, setMacros] = useState<ClinicalMacro[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(category);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState<"complaints" | "examination" | "advice" | "plan">("advice");

  useEffect(() => {
    if (isOpen) {
      setMacros(loadAllClinicalMacros());
      setActiveCategory(category);
      setSelectedId(null);
      setIsAddingNew(false);
      setSearch("");
    }
  }, [isOpen, category]);

  const filteredMacros = useMemo(() => {
    return macros.filter((m) => {
      if (activeCategory !== "all" && m.category !== activeCategory && m.category !== "all") {
        return false;
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        m.code.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
      );
    });
  }, [macros, activeCategory, search]);

  if (!isOpen) return null;

  const handleApply = () => {
    const selected = macros.find((m) => m.id === selectedId);
    if (selected) {
      onSelectMacro(selected.description);
      onClose();
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newDescription.trim()) return;
    const created = saveCustomClinicalMacro({
      code: newCode,
      category: newCategory,
      description: newDescription,
    });
    setMacros((prev) => [created, ...prev]);
    setSelectedId(created.id);
    setIsAddingNew(false);
    setNewCode("");
    setNewDescription("");
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCustomClinicalMacro(id);
    setMacros((prev) => prev.filter((m) => m.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="macro-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative flex flex-col w-full max-w-4xl max-h-[88vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* HEADER (Exact Apollo SOM EMR Style) */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400">
              <Icon icon={faFileLines} className="size-4" />
            </div>
            <div>
              <h2 id="macro-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                Macro Text
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Select clinical macro text to insert directly into consultation records
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <Icon icon={faXmark} className="text-lg" />
          </button>
        </div>

        {/* SUB-HEADER: TABS & SEARCH */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            {(
              [
                { id: "all", label: "All Macros" },
                { id: "examination", label: "Examination" },
                { id: "complaints", label: "Complaints" },
                { id: "advice", label: "Advice" },
                { id: "plan", label: "Plan" },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Icon
              icon={faMagnifyingGlass}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Macro Code or Text..."
              className="w-full h-8 pl-7 pr-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* BODY / TABLE (Exact Apollo SOM EMR Macro Modal Columns) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/40">
          {isAddingNew && (
            <form
              onSubmit={handleCreate}
              className="mb-4 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                  + Add New Custom Macro
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Macro Code (e.g. KNEE, LUMBAR, GOUT DIET)
                  </label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="e.g. ANKLE SPRAIN RICE"
                    className="w-full h-8 px-2.5 text-xs font-mono font-bold uppercase rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Section Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full h-8 px-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="advice">Advice</option>
                    <option value="examination">Examination</option>
                    <option value="complaints">Complaints</option>
                    <option value="plan">Plan</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Full Description Text (Will be inserted into consultation)
                </label>
                <textarea
                  required
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Enter the complete medical findings or instructions..."
                  className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="submit"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-7 px-3"
                >
                  Save Macro
                </Button>
              </div>
            </form>
          )}

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12">Select</th>
                  <th className="py-2.5 px-3 w-48">Macro Code</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-3 text-right w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMacros.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No matching macro text found. Click &quot;+ Add New Macro&quot; below to create one.
                    </td>
                  </tr>
                ) : (
                  filteredMacros.map((macro) => {
                    const isSelected = selectedId === macro.id;
                    return (
                      <tr
                        key={macro.id}
                        onClick={() => setSelectedId(macro.id)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50/90 dark:bg-indigo-950/40"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="radio"
                            name="macro-select"
                            checked={isSelected}
                            onChange={() => setSelectedId(macro.id)}
                            className="size-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3 align-top">
                          <div className="font-bold font-mono text-slate-900 dark:text-white">
                            {macro.code}
                          </div>
                          <span className="inline-block mt-0.5 text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {macro.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 align-top leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-line text-xs font-medium">
                          {macro.description}
                        </td>
                        <td className="py-3 px-3 align-top text-right">
                          {!macro.isBuiltIn && (
                            <button
                              type="button"
                              onClick={(e) => handleDelete(macro.id, e)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete custom macro"
                            >
                              <Icon icon={faTrashCan} className="size-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddingNew((prev) => !prev)}
            className="text-xs font-semibold gap-1.5 border-indigo-200 text-indigo-700 dark:border-indigo-800 dark:text-indigo-400 hover:bg-indigo-50"
          >
            <Icon icon={faPlus} className="size-3" />
            <span>Add New Macro</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              disabled={!selectedId}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-xs cursor-pointer disabled:opacity-40"
            >
              <Icon icon={faCheck} className="size-3" />
              <span>Add</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

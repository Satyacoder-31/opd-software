"use client";

import { useMemo, useState } from "react";
import { faMagnifyingGlass, faPills } from "@fortawesome/free-solid-svg-icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchField } from "@/components/ui/SearchField";
import {
  defaultsFromEntry,
  formatDrugDefaultsSummary,
} from "@/lib/drug-catalog";

export type DrugDictionaryRow = {
  id: string;
  name: string;
  isActive: boolean;
  usageCount: number;
  dosage: string | null;
  route: string | null;
  frequency: string | null;
  duration: string | null;
  quantity: string | null;
  instructions: string | null;
};

type DrugDictionaryViewProps = {
  initialItems: DrugDictionaryRow[];
};

export function DrugDictionaryView({ initialItems }: DrugDictionaryViewProps) {
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("en");
    if (!normalizedQuery) return initialItems;
    return initialItems.filter((item) =>
      item.name.toLocaleLowerCase("en").includes(normalizedQuery)
    );
  }, [initialItems, query]);

  return (
    <div className="flex flex-col gap-5">
      <SearchField
        label="Find clinic medicines"
        name="medicine-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by name or strength"
      />

      <ul className="flex flex-col gap-2">
        {filteredItems.length === 0 ? (
          <li>
            <EmptyState
              icon={query ? faMagnifyingGlass : faPills}
              title={query ? "No matching medicines" : "No clinic medicines yet"}
              description={
                query
                  ? "Try another name or strength."
                  : "Open Edit to add medicines, or save a prescription to build the dictionary."
              }
              compact
            />
          </li>
        ) : null}
        {filteredItems.map((item) => {
          const summary = formatDrugDefaultsSummary(defaultsFromEntry(item));

          return (
            <li
              key={item.id}
              className="rounded-lg border border-border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="wrap-break-word text-sm font-medium text-ink">
                  {item.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.usageCount === 1
                    ? "Used once"
                    : `Used ${item.usageCount} times`}
                  {!item.isActive ? " · inactive" : ""}
                </p>
                {summary ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {summary}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    No defaults yet.
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

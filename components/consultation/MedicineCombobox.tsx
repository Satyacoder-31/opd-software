"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import {
  filterDrugSuggestions,
  formatDrugDefaultsSummary,
  normalizeDrugName,
  type DrugSuggestion,
} from "@/lib/drug-catalog";
import {
  isFavoriteMedicine,
  loadFavoriteMedicines,
  loadRecentMedicines,
  toggleFavoriteMedicine,
} from "@/lib/prescription-favorites";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Field, FieldLabel } from "@/components/ui/shadcn/field";
import { Input } from "@/components/ui/shadcn/input";

type MedicineComboboxProps = {
  name: string;
  value: string;
  onChange: (value: string) => void;
  /** Fired when a catalog/favorite/recent chip is chosen (not free typing). */
  onSelectMedicine?: (suggestion: DrugSuggestion) => void;
  suggestions: DrugSuggestion[];
  loading?: boolean;
  favorites?: string[];
  onFavoritesChange?: (favorites: string[]) => void;
};

type BrowseItem = {
  id: string;
  name: string;
  badge: string;
  suggestion: DrugSuggestion;
};

function formatBrowseHint(suggestion: DrugSuggestion): string {
  return formatDrugDefaultsSummary(suggestion.defaults);
}

function uniqueByName(items: BrowseItem[]): BrowseItem[] {
  const seen = new Set<string>();
  const result: BrowseItem[] = [];
  for (const item of items) {
    const key = normalizeDrugName(item.name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function suggestionFromName(
  name: string,
  suggestions: DrugSuggestion[],
  idPrefix: string,
  index: number
): DrugSuggestion {
  const match = suggestions.find(
    (item) => normalizeDrugName(item.name) === normalizeDrugName(name)
  );
  if (match) return match;
  return {
    id: `${idPrefix}-${index}`,
    name,
    source: "clinic",
    usageCount: 0,
    defaults: {},
  };
}

export function MedicineCombobox({
  name,
  value,
  onChange,
  onSelectMedicine,
  suggestions,
  loading = false,
  favorites: controlledFavorites,
  onFavoritesChange,
}: MedicineComboboxProps) {
  const generatedId = useId();
  const inputId = `${generatedId}-medicine`;
  const listboxId = `${generatedId}-listbox`;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [internalFavorites, setInternalFavorites] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);

  const favorites = controlledFavorites ?? internalFavorites;

  useEffect(() => {
    setInternalFavorites(loadFavoriteMedicines());
    setRecents(loadRecentMedicines());
  }, []);

  const query = value.trim();
  const catalogMatches = useMemo(
    () => filterDrugSuggestions(suggestions, value, 10),
    [suggestions, value]
  );

  const browseItems = useMemo(() => {
    if (query) {
      return catalogMatches.map((suggestion) => ({
        id: suggestion.id,
        name: suggestion.name,
        badge:
          suggestion.source === "clinic"
            ? suggestion.usageCount > 0
              ? `Clinic · ${suggestion.usageCount}`
              : "Clinic"
            : "Common",
        suggestion,
      }));
    }

    const favoriteItems: BrowseItem[] = favorites.map((item, index) => ({
      id: `fav-${index}`,
      name: item,
      badge: "Favorite",
      suggestion: suggestionFromName(item, suggestions, "fav", index),
    }));
    const recentItems: BrowseItem[] = recents.map((item, index) => ({
      id: `recent-${index}`,
      name: item,
      badge: "Recent",
      suggestion: suggestionFromName(item, suggestions, "recent", index),
    }));
    const frequentClinic: BrowseItem[] = suggestions
      .filter((item) => item.source === "clinic" && item.usageCount > 0)
      .slice(0, 6)
      .map((item) => ({
        id: item.id,
        name: item.name,
        badge: `Used ${item.usageCount}×`,
        suggestion: item,
      }));

    return uniqueByName([
      ...favoriteItems,
      ...recentItems,
      ...frequentClinic,
    ]).slice(0, 12);
  }, [catalogMatches, favorites, query, recents, suggestions]);

  useEffect(() => {
    setActiveIndex(0);
  }, [value, open, browseItems.length]);

  function commitSelection(suggestion: DrugSuggestion) {
    onChange(suggestion.name);
    onSelectMedicine?.(suggestion);
    setOpen(false);
  }

  function handleToggleFavorite(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const trimmed = value.trim();
    if (!trimmed) return;
    const next = toggleFavoriteMedicine(trimmed);
    setInternalFavorites(next);
    onFavoritesChange?.(next);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) =>
        browseItems.length ? (current + 1) % browseItems.length : 0
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) =>
        browseItems.length
          ? (current - 1 + browseItems.length) % browseItems.length
          : 0
      );
      return;
    }

    if (event.key === "Enter" && open && browseItems[activeIndex]) {
      event.preventDefault();
      commitSelection(browseItems[activeIndex].suggestion);
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const activeOptionId =
    open && browseItems[activeIndex]
      ? `${listboxId}-option-${activeIndex}`
      : undefined;
  const starred = isFavoriteMedicine(value, favorites);

  return (
    <Field>
      <div className="flex items-center justify-between gap-2">
        <FieldLabel htmlFor={inputId}>Medicine</FieldLabel>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            starred
              ? "text-amber-700"
              : "text-muted-foreground hover:text-ink",
            !value.trim() && "invisible"
          )}
          aria-label={starred ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={starred}
          onMouseDown={(event) => event.preventDefault()}
          onClick={handleToggleFavorite}
        >
          <Icon
            icon={faStar}
            className="size-3.5"
            aria-hidden
          />
          {starred ? "Favorited" : "Favorite"}
        </button>
      </div>
      <div className={cn("relative", open && "z-50")}>
        <Input
          id={inputId}
          name={name}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          placeholder="Search catalog, favorites, or type a name"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          className="h-11"
        />

        {open && (
          <div
            id={listboxId}
            role="listbox"
            aria-label="Medicine suggestions"
            className="absolute inset-x-0 top-[calc(100%+0.25rem)] z-50 max-h-72 overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg"
          >
            {loading ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Loading medicine dictionary…
              </p>
            ) : browseItems.length > 0 ? (
              <>
                {!query ? (
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Favorites · Recent · Clinic
                  </p>
                ) : null}
                {browseItems.map((item, index) => (
                  <button
                    key={item.id}
                    id={`${listboxId}-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    tabIndex={-1}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm",
                      index === activeIndex
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                    onPointerDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => commitSelection(item.suggestion)}
                  >
                    <span className="min-w-0 truncate">
                      <span className="block truncate">{item.name}</span>
                      {formatBrowseHint(item.suggestion) ? (
                        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                          {formatBrowseHint(item.suggestion)}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {item.badge}
                    </span>
                  </button>
                ))}
              </>
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                {query
                  ? "New medicine — it will be remembered after you save."
                  : "No favorites yet. Search the catalog or star a medicine."}
              </p>
            )}
          </div>
        )}
      </div>
    </Field>
  );
}

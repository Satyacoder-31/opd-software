"use client";

import { useId, useMemo, useRef, useState, useEffect } from "react";
import {
  faChevronDown,
  faChevronUp,
  faMagnifyingGlass,
  faXmark,
  faStar,
  faPlus,
  faTrashCan,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Icon } from "@/components/ui/Icon";
import { Field, FieldLabel } from "@/components/ui/shadcn/field";
import { Textarea as ShadcnTextarea } from "@/components/ui/shadcn/textarea";
import { useClinicalRecommendations } from "@/lib/clinical-recommendations-storage";
import { cn } from "@/lib/utils";

type ClinicalDropdownTextareaProps = {
  label: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  rows?: number;
  className?: string;
  icon?: IconDefinition;
  fieldKey?: string;
};

export function ClinicalDropdownTextarea({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  rows = 2,
  className,
  icon,
  fieldKey,
}: ClinicalDropdownTextareaProps) {
  const generatedId = useId();
  const textareaId = `${generatedId}-textarea`;
  const [open, setOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newRecInput, setNewRecInput] = useState("");
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const keyIdentifier = fieldKey || name || label;
  const {
    allOptions,
    favoriteOptions,
    standardOptions,
    favoritesCount,
    isCustom,
    addCustom,
    removeCustom,
    toggleFavorite,
  } = useClinicalRecommendations(keyIdentifier, options);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setIsAddingNew(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const queryLower = filterQuery.trim().toLowerCase();

  const filteredFavorites = useMemo(() => {
    if (!queryLower) return favoriteOptions;
    return favoriteOptions.filter((opt) =>
      opt.toLowerCase().includes(queryLower)
    );
  }, [favoriteOptions, queryLower]);

  const filteredStandard = useMemo(() => {
    if (!queryLower) return standardOptions;
    return standardOptions.filter((opt) =>
      opt.toLowerCase().includes(queryLower)
    );
  }, [standardOptions, queryLower]);

  const hasExactMatch = useMemo(() => {
    if (!queryLower) return true;
    return allOptions.some((opt) => opt.toLowerCase() === queryLower);
  }, [allOptions, queryLower]);

  const trimmedValue = value.trim();
  const canSaveCurrentValue = useMemo(() => {
    if (!trimmedValue || trimmedValue.length < 3) return false;
    const lower = trimmedValue.toLowerCase();
    return !allOptions.some((opt) => opt.toLowerCase() === lower);
  }, [trimmedValue, allOptions]);

  function handleSelect(option: string, mode: "append" | "replace" = "append") {
    if (!value.trim() || mode === "replace") {
      onChange(option);
    } else {
      const trimmed = value.trim();
      if (trimmed.endsWith(",") || trimmed.endsWith(";") || trimmed.endsWith(".")) {
        onChange(`${trimmed} ${option}`);
      } else if (trimmed.includes("\n") || option.length > 50) {
        onChange(`${trimmed}\n• ${option}`);
      } else {
        onChange(`${trimmed}, ${option}`);
      }
    }
    setOpen(false);
    setFilterQuery("");
  }

  function handleAddNewRecommendation(textToAdd?: string) {
    const target = (textToAdd ?? newRecInput).trim();
    if (!target) return;
    addCustom(target);
    setNewRecInput("");
    setIsAddingNew(false);
    setSavedNotice(`Added "${target.slice(0, 24)}${target.length > 24 ? "…" : ""}"`);
    setTimeout(() => setSavedNotice(null), 2500);
  }

  return (
    <Field className={className}>
      {/* Header bar: Icon + Label on left, Clear button + Recommendations Dropdown Menu on right */}
      <div className="flex items-center justify-between gap-2 pb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {icon && (
            <Icon
              icon={icon}
              className="size-3.5 text-muted-foreground shrink-0"
              aria-hidden
            />
          )}
          <FieldLabel
            htmlFor={textareaId}
            className="text-xs font-semibold text-ink sm:text-xs"
          >
            {label}
          </FieldLabel>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Clear button */}
          {value.trim().length > 0 && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs font-medium text-muted-foreground hover:text-danger transition-colors px-1"
              title={`Clear ${label}`}
            >
              Clear
            </button>
          )}

          {/* Recommendations trigger button */}
          <div className="relative" ref={containerRef}>
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-ink transition-colors shadow-2xs",
                "hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
                open && "border-primary ring-1 ring-primary bg-primary/5 text-primary"
              )}
              aria-expanded={open}
              title={`Open ${label} recommendations`}
            >
              {favoritesCount > 0 ? (
                <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                  <Icon icon={faStar} className="size-2.5 text-amber-500" />
                  <span>{favoritesCount}</span>
                </span>
              ) : null}
              <span>Select recommendation</span>
              <Icon
                icon={open ? faChevronUp : faChevronDown}
                className="size-2.5 text-muted-foreground"
              />
            </button>

            {/* Floating Dropdown Menu Panel */}
            {open && (
              <div
                className="absolute right-0 top-[calc(100%+0.25rem)] z-50 w-80 sm:w-96 rounded-xl border border-border bg-popover p-2.5 text-popover-foreground shadow-2xl ring-1 ring-border/80"
                role="region"
                aria-label={`${label} recommendations`}
              >
                {/* Search Bar + Add New Toggle */}
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="relative flex-1">
                    <Icon
                      icon={faMagnifyingGlass}
                      className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      type="text"
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      placeholder={`Search or filter ${label.toLowerCase()}…`}
                      className="h-7 w-full rounded-md border border-border bg-card pl-7 pr-6 text-xs text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                    />
                    {filterQuery && (
                      <button
                        type="button"
                        onClick={() => setFilterQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink"
                        title="Clear filter"
                      >
                        <Icon icon={faXmark} className="size-2.5" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddingNew((prev) => !prev)}
                    className={cn(
                      "shrink-0 inline-flex items-center gap-1 h-7 rounded-md border px-2 text-[11px] font-semibold transition-colors",
                      isAddingNew
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-ink hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                    )}
                    title={isAddingNew ? "Close add box" : "Add custom recommendation"}
                  >
                    <Icon icon={isAddingNew ? faXmark : faPlus} className="size-2.5" />
                    <span>{isAddingNew ? "Cancel" : "Add"}</span>
                  </button>
                </div>

                {/* Inline Add New Recommendation Box */}
                {isAddingNew && (
                  <div className="mb-2 p-2 rounded-lg border border-primary/30 bg-primary/5 dark:bg-primary/10">
                    <label className="block text-[11px] font-semibold text-primary mb-1">
                      Add doctor recommendation to &ldquo;{label}&rdquo;
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newRecInput}
                        onChange={(e) => setNewRecInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddNewRecommendation();
                          }
                        }}
                        placeholder="Type recommendation..."
                        className="h-7 flex-1 rounded border border-border bg-card px-2 text-xs text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleAddNewRecommendation()}
                        disabled={!newRecInput.trim()}
                        className="h-7 rounded bg-primary px-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-opacity"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* Feedback Toast */}
                {savedNotice && (
                  <div className="mb-2 flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    <Icon icon={faCheck} className="size-3 text-emerald-600" />
                    <span className="truncate">{savedNotice}</span>
                  </div>
                )}

                {/* Quick Add from Search Query */}
                {queryLower.length > 1 && !hasExactMatch && !isAddingNew && (
                  <button
                    type="button"
                    onClick={() => {
                      handleAddNewRecommendation(filterQuery);
                      setFilterQuery("");
                    }}
                    className="mb-2 flex w-full items-center justify-between gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-2 text-left text-xs text-primary hover:bg-primary/10 transition-colors"
                  >
                    <span className="truncate">
                      + Add &ldquo;<strong>{filterQuery.trim()}</strong>&rdquo; to recommendations
                    </span>
                    <span className="shrink-0 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      + Save
                    </span>
                  </button>
                )}

                {/* Quick Add from Current Textarea Input */}
                {canSaveCurrentValue && !isAddingNew && (
                  <button
                    type="button"
                    onClick={() => handleAddNewRecommendation(trimmedValue)}
                    className="mb-2 flex w-full items-center justify-between gap-2 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 px-2 py-1 text-left text-[11px] text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-colors"
                    title="Save current text in this field to dropdown recommendations"
                  >
                    <span className="truncate">
                      Save current field text as recommendation ({trimmedValue.slice(0, 20)}…)
                    </span>
                    <span className="shrink-0 font-semibold">+ Save</span>
                  </button>
                )}

                {/* Scrollable recommendations list */}
                <div className="max-h-60 space-y-2 overflow-y-auto pr-0.5">
                  {/* FAVORITES SECTION (Pinned to Top) */}
                  {filteredFavorites.length > 0 && (
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between px-2 pt-0.5 pb-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <Icon icon={faStar} className="size-2.5 text-amber-500" />
                          Favourites ({filteredFavorites.length})
                        </span>
                        <span className="text-[9px] font-medium lowercase text-muted-foreground">
                          pinned to top
                        </span>
                      </div>
                      {filteredFavorites.map((opt) => (
                        <div
                          key={`fav-${opt}`}
                          className="flex items-center justify-between gap-1.5 rounded-md px-2 py-1 text-left text-xs text-ink hover:bg-accent hover:text-accent-foreground transition-colors group"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(opt);
                            }}
                            className="shrink-0 p-1 text-amber-500 hover:scale-125 transition-transform"
                            title="Remove from favourites"
                            aria-label={`Unfavorite ${opt}`}
                          >
                            <Icon icon={faStar} className="size-3 text-amber-500" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelect(opt, "append")}
                            className="flex-1 text-left min-w-0 line-clamp-2 leading-relaxed"
                          >
                            <span>{opt}</span>
                            {isCustom(opt) && (
                              <span className="ml-1.5 inline-block rounded bg-primary/10 px-1 py-0.2 text-[9px] font-semibold text-primary uppercase tracking-wider">
                                Custom
                              </span>
                            )}
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            {isCustom(opt) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeCustom(opt);
                                }}
                                className="p-1 text-muted-foreground hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete custom recommendation"
                                aria-label={`Delete custom recommendation ${opt}`}
                              >
                                <Icon icon={faTrashCan} className="size-2.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleSelect(opt, "append")}
                              className="text-[10px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                            >
                              + Insert
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* STANDARD RECOMMENDATIONS SECTION */}
                  {filteredStandard.length > 0 && (
                    <div className="space-y-0.5">
                      {filteredFavorites.length > 0 && (
                        <div className="my-1 border-t border-border/80" />
                      )}
                      <div className="px-2 pt-0.5 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {filteredFavorites.length > 0 ? "Other Recommendations" : "Recommendations"} ({filteredStandard.length})
                      </div>
                      {filteredStandard.map((opt) => (
                        <div
                          key={`std-${opt}`}
                          className="flex items-center justify-between gap-1.5 rounded-md px-2 py-1 text-left text-xs text-ink hover:bg-accent hover:text-accent-foreground transition-colors group"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(opt);
                            }}
                            className="shrink-0 p-1 text-muted-foreground/35 hover:text-amber-500 transition-colors"
                            title="Add to favourites (pins to top)"
                            aria-label={`Favorite ${opt}`}
                          >
                            <Icon icon={faStar} className="size-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelect(opt, "append")}
                            className="flex-1 text-left min-w-0 line-clamp-2 leading-relaxed"
                          >
                            <span>{opt}</span>
                            {isCustom(opt) && (
                              <span className="ml-1.5 inline-block rounded bg-primary/10 px-1 py-0.2 text-[9px] font-semibold text-primary uppercase tracking-wider">
                                Custom
                              </span>
                            )}
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            {isCustom(opt) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeCustom(opt);
                                }}
                                className="p-1 text-muted-foreground hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete custom recommendation"
                                aria-label={`Delete custom recommendation ${opt}`}
                              >
                                <Icon icon={faTrashCan} className="size-2.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleSelect(opt, "append")}
                              className="text-[10px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                            >
                              + Insert
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* EMPTY STATE */}
                  {filteredFavorites.length === 0 && filteredStandard.length === 0 && (
                    <div className="px-3 py-4 text-center">
                      <p className="text-xs text-muted-foreground mb-2">
                        {filterQuery
                          ? `No recommendations matching "${filterQuery}".`
                          : "No recommendations yet."}
                      </p>
                      {filterQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            handleAddNewRecommendation(filterQuery);
                            setFilterQuery("");
                          }}
                          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 shadow-2xs"
                        >
                          <Icon icon={faPlus} className="size-3" />
                          Add &ldquo;{filterQuery.trim()}&rdquo; to recommendations
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Textarea */}
      <ShadcnTextarea
        id={textareaId}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="min-h-14 text-sm leading-relaxed"
      />
    </Field>
  );
}

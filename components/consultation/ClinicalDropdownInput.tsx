"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  faChevronDown,
  faChevronUp,
  faStar,
  faPlus,
  faTrashCan,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import { Field, FieldLabel } from "@/components/ui/shadcn/field";
import { Input } from "@/components/ui/shadcn/input";
import { useClinicalRecommendations } from "@/lib/clinical-recommendations-storage";
import { cn } from "@/lib/utils";

type ClinicalDropdownInputProps = {
  label: string;
  name: string;
  value: string;
  options: readonly string[];
  placeholder?: string;
  className?: string;
  onChange: (value: string) => void;
  fieldKey?: string;
};

export function ClinicalDropdownInput({
  label,
  name,
  value,
  options,
  placeholder,
  className,
  onChange,
  fieldKey,
}: ClinicalDropdownInputProps) {
  const generatedId = useId();
  const inputId = `${generatedId}-input`;
  const listboxId = `${generatedId}-listbox`;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newRecInput, setNewRecInput] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
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

  const query = value.trim().toLowerCase();

  const favoriteMatches = useMemo(() => {
    if (!query) return favoriteOptions;
    return favoriteOptions.filter((opt) => opt.toLowerCase().includes(query));
  }, [favoriteOptions, query]);

  const standardMatches = useMemo(() => {
    if (!query) return standardOptions;
    return standardOptions.filter((opt) => opt.toLowerCase().includes(query));
  }, [standardOptions, query]);

  // Combined matches: Favorites are ALWAYS first at the top!
  const flatMatches = useMemo(
    () => [...favoriteMatches, ...standardMatches],
    [favoriteMatches, standardMatches]
  );

  const hasExactMatch = useMemo(() => {
    if (!query) return true;
    return allOptions.some((opt) => opt.toLowerCase() === query);
  }, [allOptions, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [value, open]);

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

  function selectOption(option: string) {
    onChange(option);
    setOpen(false);
    setIsAddingNew(false);
  }

  function handleAddCurrentValue() {
    const trimmed = value.trim();
    if (!trimmed) return;
    addCustom(trimmed);
    setNotice(`Saved "${trimmed.slice(0, 20)}"`);
    setTimeout(() => setNotice(null), 2000);
  }

  function handleAddNewCustom() {
    const trimmed = newRecInput.trim();
    if (!trimmed) return;
    addCustom(trimmed);
    setNewRecInput("");
    setIsAddingNew(false);
    setNotice(`Added recommendation`);
    setTimeout(() => setNotice(null), 2000);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) =>
        flatMatches.length ? (current + 1) % flatMatches.length : 0
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) =>
        flatMatches.length
          ? (current - 1 + flatMatches.length) % flatMatches.length
          : 0
      );
      return;
    }

    if (event.key === "Enter" && open && flatMatches[activeIndex]) {
      event.preventDefault();
      selectOption(flatMatches[activeIndex]);
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
      setIsAddingNew(false);
    }
  }

  const activeOptionId =
    open && flatMatches[activeIndex]
      ? `${listboxId}-option-${activeIndex}`
      : undefined;

  return (
    <Field className={className}>
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-1.5">
          <FieldLabel htmlFor={inputId} className="text-xs font-semibold text-ink sm:text-xs">
            {label}
          </FieldLabel>
          {favoritesCount > 0 && (
            <span
              className="inline-flex items-center gap-0.5 rounded px-1 py-0.2 text-[10px] font-semibold text-amber-600 dark:text-amber-400"
              title={`${favoritesCount} favorite recommendation(s)`}
            >
              <Icon icon={faStar} className="size-2.5 text-amber-500" />
              <span>{favoritesCount}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
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
        </div>
      </div>

      <div ref={containerRef} className={cn("relative", open && "z-50")}>
        <div className="relative">
          <Input
            id={inputId}
            name={name}
            value={value}
            onChange={(event) => {
              onChange(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-activedescendant={activeOptionId}
            className="h-10 pr-8 text-sm"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setOpen((prev) => !prev)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink transition-colors"
            aria-label="Toggle options"
          >
            <Icon icon={open ? faChevronUp : faChevronDown} className="size-3" />
          </button>
        </div>

        {open && (
          <div
            id={listboxId}
            role="listbox"
            aria-label={`${label} recommendations`}
            className="absolute inset-x-0 top-[calc(100%+0.25rem)] z-50 max-h-64 overflow-y-auto rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-2xl ring-1 ring-border/80"
          >
            {/* Notification */}
            {notice && (
              <div className="mb-1.5 flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <Icon icon={faCheck} className="size-3 text-emerald-600" />
                <span>{notice}</span>
              </div>
            )}

            {/* Quick Add typed value to recommendations */}
            {value.trim().length > 1 && !hasExactMatch && (
              <div className="mb-1.5 p-1 rounded-md bg-primary/5 border border-primary/20">
                <button
                  type="button"
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={handleAddCurrentValue}
                  className="flex w-full items-center justify-between gap-2 px-2 py-1 text-left text-xs font-medium text-primary hover:bg-primary/10 rounded transition-colors"
                >
                  <span className="truncate">
                    + Add &ldquo;<strong>{value.trim()}</strong>&rdquo; to recommendations
                  </span>
                  <span className="shrink-0 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    Save
                  </span>
                </button>
              </div>
            )}

            {/* FAVORITES (At the top of recommendations) */}
            {favoriteMatches.length > 0 && (
              <div className="mb-1">
                <div className="flex items-center justify-between px-2 pt-1 pb-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Icon icon={faStar} className="size-2.5 text-amber-500" />
                    Favourites ({favoriteMatches.length})
                  </span>
                  <span className="text-[9px] font-normal lowercase text-muted-foreground">
                    pinned to top
                  </span>
                </div>
                {favoriteMatches.map((option, idx) => {
                  const globalIdx = idx;
                  const isSelected = globalIdx === activeIndex;
                  return (
                    <div
                      key={`fav-${option}`}
                      className={cn(
                        "group flex w-full items-center justify-between gap-1.5 rounded-md px-2 py-1.5 text-left text-xs sm:text-sm transition-colors cursor-pointer",
                        isSelected
                          ? "bg-accent text-accent-foreground font-medium"
                          : "hover:bg-accent/70 hover:text-accent-foreground"
                      )}
                      onPointerDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActiveIndex(globalIdx)}
                      onClick={() => selectOption(option)}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(option);
                        }}
                        className="shrink-0 p-1 text-amber-500 hover:scale-125 transition-transform"
                        title="Remove from favourites"
                        aria-label={`Unfavorite ${option}`}
                      >
                        <Icon icon={faStar} className="size-3 text-amber-500" />
                      </button>

                      <span className="flex-1 min-w-0 truncate text-xs sm:text-sm">
                        {option}
                        {isCustom(option) && (
                          <span className="ml-1.5 inline-block rounded bg-primary/10 px-1 py-0.2 text-[9px] font-semibold text-primary uppercase tracking-wider">
                            Custom
                          </span>
                        )}
                      </span>

                      {isCustom(option) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCustom(option);
                          }}
                          className="shrink-0 p-1 text-muted-foreground hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete custom recommendation"
                        >
                          <Icon icon={faTrashCan} className="size-2.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* STANDARD RECOMMENDATIONS */}
            {standardMatches.length > 0 && (
              <div>
                {favoriteMatches.length > 0 && (
                  <div className="my-1 border-t border-border/80" />
                )}
                <div className="px-2 pt-1 pb-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {favoriteMatches.length > 0 ? "Other Recommendations" : "Recommendations"} ({standardMatches.length})
                </div>
                {standardMatches.map((option, idx) => {
                  const globalIdx = favoriteMatches.length + idx;
                  const isSelected = globalIdx === activeIndex;
                  return (
                    <div
                      key={`std-${option}`}
                      className={cn(
                        "group flex w-full items-center justify-between gap-1.5 rounded-md px-2 py-1.5 text-left text-xs sm:text-sm transition-colors cursor-pointer",
                        isSelected
                          ? "bg-accent text-accent-foreground font-medium"
                          : "hover:bg-accent/70 hover:text-accent-foreground"
                      )}
                      onPointerDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActiveIndex(globalIdx)}
                      onClick={() => selectOption(option)}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(option);
                        }}
                        className="shrink-0 p-1 text-muted-foreground/35 hover:text-amber-500 transition-colors"
                        title="Add to favourites (pins to top)"
                        aria-label={`Favorite ${option}`}
                      >
                        <Icon icon={faStar} className="size-3" />
                      </button>

                      <span className="flex-1 min-w-0 truncate text-xs sm:text-sm">
                        {option}
                        {isCustom(option) && (
                          <span className="ml-1.5 inline-block rounded bg-primary/10 px-1 py-0.2 text-[9px] font-semibold text-primary uppercase tracking-wider">
                            Custom
                          </span>
                        )}
                      </span>

                      {isCustom(option) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCustom(option);
                          }}
                          className="shrink-0 p-1 text-muted-foreground hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete custom recommendation"
                        >
                          <Icon icon={faTrashCan} className="size-2.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty matching list */}
            {flatMatches.length === 0 && (
              <div className="px-3 py-3 text-center text-xs text-muted-foreground">
                <p>No recommendation matching &ldquo;{value}&rdquo;.</p>
                <p className="mt-1 text-[11px] text-muted-foreground/80">
                  Your entry will be saved in the patient record as typed.
                </p>
              </div>
            )}

            {/* Bottom Add New Toggle Form */}
            <div className="mt-1 pt-1 border-t border-border/80">
              {isAddingNew ? (
                <div className="p-1.5 rounded-md bg-muted/40">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newRecInput}
                      onChange={(e) => setNewRecInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddNewCustom();
                        }
                      }}
                      placeholder="Add new recommendation..."
                      className="h-7 flex-1 rounded border border-border bg-card px-2 text-xs text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddNewCustom}
                      disabled={!newRecInput.trim()}
                      className="h-7 rounded bg-primary px-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingNew(false)}
                      className="h-7 px-1.5 text-xs text-muted-foreground hover:text-ink"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingNew(true)}
                  className="flex w-full items-center justify-center gap-1.5 py-1 text-center text-xs font-medium text-primary hover:bg-primary/5 rounded transition-colors"
                >
                  <Icon icon={faPlus} className="size-2.5" />
                  <span>Add new recommendation</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Field>
  );
}

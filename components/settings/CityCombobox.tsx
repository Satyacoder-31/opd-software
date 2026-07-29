"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { listLearnedCities } from "@/actions/cities";
import { Field, FieldLabel } from "@/components/ui/shadcn/field";
import { Input } from "@/components/ui/shadcn/input";
import {
  INDIAN_CITIES,
  searchIndianCities,
  getCitiesForState,
} from "@/lib/indian-cities";
import { cn } from "@/lib/utils";

type CityComboboxProps = {
  label?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** When set, only shows cities for this state. */
  state?: string;
  /** Preserve a saved city that is not in the catalog (legacy free-text values). */
  extraOptions?: string[];
};

export function CityCombobox({
  label = "City",
  name = "city",
  value,
  onChange,
  placeholder = "Search city…",
  className,
  state,
  extraOptions = [],
}: CityComboboxProps) {
  const generatedId = useId();
  const inputId = `${generatedId}-input`;
  const listboxId = `${generatedId}-listbox`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [activeIndex, setActiveIndex] = useState(0);
  const [learnedCities, setLearnedCities] = useState<string[]>([]);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    if (!state?.trim()) {
      setLearnedCities([]);
      return;
    }
    void listLearnedCities(state).then((cities) => {
      if (!cancelled) setLearnedCities(cities);
    });
    return () => {
      cancelled = true;
    };
  }, [state]);

  const communityExtras = useMemo(() => {
    const pool = state ? getCitiesForState(state) : INDIAN_CITIES;
    const poolLower = new Set(pool.map((c) => c.toLocaleLowerCase()));
    return [...learnedCities, ...extraOptions]
      .map((c) => c.trim())
      .filter(Boolean)
      .filter((c) => !poolLower.has(c.toLocaleLowerCase()))
      .filter(
        (c, i, arr) =>
          arr.findIndex((x) => x.toLocaleLowerCase() === c.toLocaleLowerCase()) ===
          i,
      );
  }, [learnedCities, extraOptions, state]);

  const options = useMemo(() => {
    const catalogMatches = searchIndianCities(query, 50, state);
    const q = query.trim().toLocaleLowerCase();
    const extraMatches = communityExtras.filter(
      (c) => !q || c.toLocaleLowerCase().includes(q),
    );
    const catalogFiltered = catalogMatches.filter(
      (c) =>
        !extraMatches.some((e) => e.toLocaleLowerCase() === c.toLocaleLowerCase()),
    );
    // Learned / community cities first so new towns surface quickly.
    return [...extraMatches, ...catalogFiltered];
  }, [communityExtras, query, state]);

  const canAddCustom = useMemo(() => {
    const q = query.trim();
    if (q.length < 2) return false;
    const lower = q.toLocaleLowerCase();
    return !options.some((c) => c.toLocaleLowerCase() === lower);
  }, [options, query]);

  const listItems = useMemo(() => {
    if (!canAddCustom) return options;
    return [`__add__:${query.trim()}`, ...options];
  }, [canAddCustom, options, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, listItems.length]);

  function selectCity(city: string) {
    onChange(city);
    setQuery(city);
    setOpen(false);
  }

  function clearCity() {
    onChange("");
    setQuery("");
    setOpen(false);
  }

  function handleBlur() {
    setQuery(value);
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) =>
        listItems.length ? (current + 1) % listItems.length : 0,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) =>
        listItems.length
          ? (current - 1 + listItems.length) % listItems.length
          : 0,
      );
      return;
    }

    if (event.key === "Enter" && open && listItems[activeIndex]) {
      event.preventDefault();
      const item = listItems[activeIndex];
      if (item.startsWith("__add__:")) {
        selectCity(item.slice("__add__:".length));
      } else {
        selectCity(item);
      }
      return;
    }

    if (event.key === "Escape") {
      setQuery(value);
      setOpen(false);
    }
  }

  const activeOptionId =
    open && listItems[activeIndex]
      ? `${listboxId}-option-${activeIndex}`
      : undefined;

  return (
    <Field>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <div className={cn("relative", open && "z-50")}>
        <input type="hidden" name={name} value={value} />
        <Input
          id={inputId}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          className={cn("h-11", className)}
        />

        {open ? (
          <div
            id={listboxId}
            role="listbox"
            aria-label="City suggestions"
            className="absolute inset-x-0 top-[calc(100%+0.25rem)] z-50 max-h-72 overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg"
          >
            {value ? (
              <button
                type="button"
                tabIndex={-1}
                className="flex w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                onPointerDown={(event) => event.preventDefault()}
                onClick={clearCity}
              >
                Clear city
              </button>
            ) : null}
            {listItems.length > 0 ? (
              listItems.map((item, index) => {
                const isAdd = item.startsWith("__add__:");
                const city = isAdd ? item.slice("__add__:".length) : item;
                return (
                  <button
                    key={item}
                    id={`${listboxId}-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={city === value || index === activeIndex}
                    tabIndex={-1}
                    className={cn(
                      "flex w-full rounded-md px-3 py-2 text-left text-sm",
                      index === activeIndex || city === value
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent hover:text-accent-foreground",
                      isAdd && "font-medium text-primary",
                    )}
                    onPointerDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectCity(city)}
                  >
                    {isAdd ? (
                      <>
                        Add “{city}”
                        <span className="ml-auto text-xs font-normal text-muted-foreground">
                          new city
                        </span>
                      </>
                    ) : (
                      <>
                        {city}
                        {communityExtras.some(
                          (c) => c.toLocaleLowerCase() === city.toLocaleLowerCase(),
                        ) ? (
                          <span className="ml-auto text-xs text-muted-foreground">
                            from clinics
                          </span>
                        ) : null}
                      </>
                    )}
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Type a city name to add it.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </Field>
  );
}

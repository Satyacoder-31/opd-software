"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_CUSTOM_PREFIX = "emr.recs.custom.";
const STORAGE_FAVORITES_PREFIX = "emr.recs.favs.";
const MAX_CUSTOM_ITEMS = 100;
const MAX_FAVORITES = 50;

/** Normalize field name or label to a stable key for localStorage */
export function normalizeFieldKey(nameOrLabel?: string): string {
  if (!nameOrLabel) return "general";
  const trimmed = nameOrLabel.trim().toLowerCase();

  // Handle indexed names like med-dosage-0, med-freq-1, med-dur-2
  if (trimmed.startsWith("med-dosage-")) return "dosage";
  if (trimmed.startsWith("med-freq-")) return "frequency";
  if (trimmed.startsWith("med-dur-")) return "duration";
  if (trimmed.startsWith("med-instr-")) return "instructions";

  return trimmed
    .replace(/[^a-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "general";
}

const memoryStore = new Map<string, string>();

function getStorageItem(key: string): string | null {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memoryStore.get(key) ?? null;
    }
  }
  return memoryStore.get(key) ?? null;
}

function setStorageItem(key: string, value: string): void {
  memoryStore.set(key, value);
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Ignore quota / private-browsing errors
    }
  }
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(
        new CustomEvent("clinical-recs-change", { detail: { key } })
      );
    } catch {
      // Ignore event dispatch failure in non-browser envs
    }
  }
}

/** Clear all storage (useful for tests) */
export function clearClinicalRecommendationsStorage(): void {
  memoryStore.clear();
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.clear();
    } catch {
      // Ignore
    }
  }
}

function readJsonArray(key: string): string[] {
  try {
    const raw = getStorageItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const item of parsed) {
      if (typeof item === "string") {
        const clean = item.trim();
        const lower = clean.toLowerCase();
        if (clean && !seen.has(lower)) {
          seen.add(lower);
          result.push(clean);
        }
      }
    }
    return result;
  } catch {
    return [];
  }
}

function writeJsonArray(key: string, values: string[]): void {
  try {
    setStorageItem(key, JSON.stringify(values));
  } catch {
    // Ignore
  }
}

export function loadCustomRecommendations(fieldKey: string): string[] {
  const normKey = normalizeFieldKey(fieldKey);
  return readJsonArray(`${STORAGE_CUSTOM_PREFIX}${normKey}`).slice(0, MAX_CUSTOM_ITEMS);
}

export function saveCustomRecommendations(fieldKey: string, items: string[]): void {
  const normKey = normalizeFieldKey(fieldKey);
  writeJsonArray(`${STORAGE_CUSTOM_PREFIX}${normKey}`, items.slice(0, MAX_CUSTOM_ITEMS));
}

export function addCustomRecommendation(fieldKey: string, text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return loadCustomRecommendations(fieldKey);
  const current = loadCustomRecommendations(fieldKey);
  const lower = trimmed.toLowerCase();
  const exists = current.some((item) => item.toLowerCase() === lower);
  if (exists) return current;

  const next = [trimmed, ...current].slice(0, MAX_CUSTOM_ITEMS);
  saveCustomRecommendations(fieldKey, next);
  return next;
}

export function removeCustomRecommendation(fieldKey: string, text: string): string[] {
  const lower = text.trim().toLowerCase();
  const current = loadCustomRecommendations(fieldKey);
  const next = current.filter((item) => item.toLowerCase() !== lower);
  saveCustomRecommendations(fieldKey, next);

  // Also remove from favorites if present
  const favs = loadFavoriteRecommendations(fieldKey);
  if (favs.some((item) => item.toLowerCase() === lower)) {
    const nextFavs = favs.filter((item) => item.toLowerCase() !== lower);
    saveFavoriteRecommendations(fieldKey, nextFavs);
  }

  return next;
}

export function loadFavoriteRecommendations(fieldKey: string): string[] {
  const normKey = normalizeFieldKey(fieldKey);
  return readJsonArray(`${STORAGE_FAVORITES_PREFIX}${normKey}`).slice(0, MAX_FAVORITES);
}

export function saveFavoriteRecommendations(fieldKey: string, items: string[]): void {
  const normKey = normalizeFieldKey(fieldKey);
  writeJsonArray(`${STORAGE_FAVORITES_PREFIX}${normKey}`, items.slice(0, MAX_FAVORITES));
}

export function toggleFavoriteRecommendation(
  fieldKey: string,
  text: string
): { isFavorite: boolean; favorites: string[] } {
  const trimmed = text.trim();
  if (!trimmed) {
    const current = loadFavoriteRecommendations(fieldKey);
    return { isFavorite: false, favorites: current };
  }
  const lower = trimmed.toLowerCase();
  const current = loadFavoriteRecommendations(fieldKey);
  const exists = current.some((item) => item.toLowerCase() === lower);

  let next: string[];
  let isFavorite: boolean;
  if (exists) {
    next = current.filter((item) => item.toLowerCase() !== lower);
    isFavorite = false;
  } else {
    next = [trimmed, ...current].slice(0, MAX_FAVORITES);
    isFavorite = true;
  }
  saveFavoriteRecommendations(fieldKey, next);
  return { isFavorite, favorites: next };
}

export function isFavoriteRecommendation(
  favorites: string[],
  text: string
): boolean {
  if (!text) return false;
  const lower = text.trim().toLowerCase();
  return favorites.some((item) => item.toLowerCase() === lower);
}

/** Sort recommendations so that all favorites appear at the very top */
export function sortRecommendationsWithFavorites(
  allOptions: readonly string[],
  favorites: readonly string[]
): {
  favoriteOptions: string[];
  standardOptions: string[];
  sortedOptions: string[];
} {
  const favSet = new Set(favorites.map((f) => f.trim().toLowerCase()).filter(Boolean));
  const favoriteOptions: string[] = [];
  const standardOptions: string[] = [];

  for (const opt of allOptions) {
    const trimmed = opt.trim();
    if (!trimmed) continue;
    if (favSet.has(trimmed.toLowerCase())) {
      favoriteOptions.push(trimmed);
    } else {
      standardOptions.push(trimmed);
    }
  }

  return {
    favoriteOptions,
    standardOptions,
    sortedOptions: [...favoriteOptions, ...standardOptions],
  };
}

/**
 * React hook to manage custom doctor-added recommendations and favorites
 * for any clinical form field.
 */
export function useClinicalRecommendations(
  nameOrLabel: string,
  defaultOptions: readonly string[] = []
) {
  const fieldKey = useMemo(() => normalizeFieldKey(nameOrLabel), [nameOrLabel]);

  const [customList, setCustomList] = useState<string[]>([]);
  const [favList, setFavList] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setCustomList(loadCustomRecommendations(fieldKey));
    setFavList(loadFavoriteRecommendations(fieldKey));

    function handleUpdate(e: Event) {
      const customEvent = e as CustomEvent<{ key?: string }>;
      const eventKey = customEvent.detail?.key;
      const targetCustomKey = `${STORAGE_CUSTOM_PREFIX}${fieldKey}`;
      const targetFavKey = `${STORAGE_FAVORITES_PREFIX}${fieldKey}`;

      if (!eventKey || eventKey === targetCustomKey) {
        setCustomList(loadCustomRecommendations(fieldKey));
      }
      if (!eventKey || eventKey === targetFavKey) {
        setFavList(loadFavoriteRecommendations(fieldKey));
      }
    }

    window.addEventListener("clinical-recs-change", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("clinical-recs-change", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [fieldKey]);

  // Combined unique options: presets + custom items
  const combinedOptions = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];

    // Custom doctor options first in the pool so their exact casing is prioritized
    for (const opt of customList) {
      const lower = opt.trim().toLowerCase();
      if (lower && !seen.has(lower)) {
        seen.add(lower);
        result.push(opt.trim());
      }
    }

    for (const opt of defaultOptions) {
      const lower = opt.trim().toLowerCase();
      if (lower && !seen.has(lower)) {
        seen.add(lower);
        result.push(opt.trim());
      }
    }

    return result;
  }, [customList, defaultOptions]);

  // Split into favorites and standard options
  const { favoriteOptions, standardOptions, sortedOptions } = useMemo(() => {
    return sortRecommendationsWithFavorites(combinedOptions, favList);
  }, [combinedOptions, favList]);

  function addCustom(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed) return false;
    const lower = trimmed.toLowerCase();
    const alreadyExists = combinedOptions.some(
      (opt) => opt.toLowerCase() === lower
    );
    const updated = addCustomRecommendation(fieldKey, trimmed);
    setCustomList(updated);
    return !alreadyExists;
  }

  function removeCustom(text: string) {
    const updated = removeCustomRecommendation(fieldKey, text);
    setCustomList(updated);
    setFavList(loadFavoriteRecommendations(fieldKey));
  }

  function toggleFavorite(text: string) {
    const { favorites } = toggleFavoriteRecommendation(fieldKey, text);
    setFavList(favorites);
  }

  function isFavorite(text: string): boolean {
    return isFavoriteRecommendation(favList, text);
  }

  function isCustom(text: string): boolean {
    const lower = text.trim().toLowerCase();
    return customList.some((item) => item.toLowerCase() === lower);
  }

  return {
    fieldKey,
    isClient,
    allOptions: sortedOptions,
    favoriteOptions,
    standardOptions,
    customOptions: customList,
    favoritesCount: favList.length,
    isFavorite,
    isCustom,
    addCustom,
    removeCustom,
    toggleFavorite,
  };
}

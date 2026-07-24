import { normalizeDrugName } from "@/lib/drug-catalog";

const FAVORITES_KEY = "emr.rx.favorites.v1";
const RECENTS_KEY = "emr.rx.recents.v1";
const MAX_RECENTS = 12;
const MAX_FAVORITES = 24;

function readJsonArray(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function writeJsonArray(key: string, values: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(values));
  } catch {
    // Ignore quota / private mode failures — shortcuts still work without persistence.
  }
}

export function loadFavoriteMedicines(): string[] {
  return readJsonArray(FAVORITES_KEY).slice(0, MAX_FAVORITES);
}

export function loadRecentMedicines(): string[] {
  return readJsonArray(RECENTS_KEY).slice(0, MAX_RECENTS);
}

export function isFavoriteMedicine(
  name: string,
  favorites: string[] = loadFavoriteMedicines()
): boolean {
  const key = normalizeDrugName(name);
  if (!key) return false;
  return favorites.some((item) => normalizeDrugName(item) === key);
}

export function toggleFavoriteMedicine(name: string): string[] {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) return loadFavoriteMedicines();

  const key = normalizeDrugName(trimmed);
  const current = loadFavoriteMedicines();
  const without = current.filter((item) => normalizeDrugName(item) !== key);
  const next =
    without.length === current.length
      ? [trimmed, ...without].slice(0, MAX_FAVORITES)
      : without;

  writeJsonArray(FAVORITES_KEY, next);
  return next;
}

/** Push a prescribed (or selected) medicine to the front of the recent list. */
export function rememberRecentMedicine(name: string): string[] {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) return loadRecentMedicines();

  const key = normalizeDrugName(trimmed);
  const next = [
    trimmed,
    ...loadRecentMedicines().filter((item) => normalizeDrugName(item) !== key),
  ].slice(0, MAX_RECENTS);

  writeJsonArray(RECENTS_KEY, next);
  return next;
}

export function rememberRecentMedicines(names: string[]): string[] {
  let next = loadRecentMedicines();
  for (const name of names) {
    const trimmed = name.trim().replace(/\s+/g, " ");
    if (!trimmed) continue;
    const key = normalizeDrugName(trimmed);
    next = [trimmed, ...next.filter((item) => normalizeDrugName(item) !== key)];
  }
  next = next.slice(0, MAX_RECENTS);
  writeJsonArray(RECENTS_KEY, next);
  return next;
}

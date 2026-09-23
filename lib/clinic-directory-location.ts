import { getCitiesForState, INDIAN_CITIES } from "@/lib/indian-cities";
import { INDIAN_STATES, type IndianState } from "@/lib/indian-states";

export const CLINIC_LOCATION_STORAGE_KEY = "drorthos.clinic-location";

export type SavedClinicLocation = {
  city: string;
  state: string;
  lat?: number;
  lng?: number;
  source: "geo" | "manual";
  label?: string;
};

export function readSavedClinicLocation(): SavedClinicLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CLINIC_LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedClinicLocation;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.city !== "string" && typeof parsed.state !== "string") {
      return null;
    }
    return {
      city: parsed.city?.trim() ?? "",
      state: parsed.state?.trim() ?? "",
      lat: typeof parsed.lat === "number" ? parsed.lat : undefined,
      lng: typeof parsed.lng === "number" ? parsed.lng : undefined,
      source: parsed.source === "geo" ? "geo" : "manual",
      label: typeof parsed.label === "string" ? parsed.label : undefined,
    };
  } catch {
    return null;
  }
}

export function writeSavedClinicLocation(loc: SavedClinicLocation) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLINIC_LOCATION_STORAGE_KEY, JSON.stringify(loc));
  } catch {
    // ignore quota / private mode
  }
}

export function clearSavedClinicLocation() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CLINIC_LOCATION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function normalizePlace(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bcity\b|\btown\b|\bdistrict\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Map Nominatim / free-text state onto our catalog when possible. */
export function matchIndianState(raw?: string | null): IndianState | "" {
  if (!raw?.trim()) return "";
  const n = normalizePlace(raw);
  const exact = INDIAN_STATES.find((s) => normalizePlace(s) === n);
  if (exact) return exact;
  // Common aliases
  if (n === "nct of delhi" || n === "nct delhi") return "Delhi";
  if (n.includes("pondicherry")) return "Puducherry";
  const partial = INDIAN_STATES.find(
    (s) => normalizePlace(s).includes(n) || n.includes(normalizePlace(s)),
  );
  return partial ?? "";
}

/** Prefer a catalog city name that matches the geocoded city. */
export function matchIndianCity(
  raw?: string | null,
  state?: string | null,
): string {
  if (!raw?.trim()) return "";
  const n = normalizePlace(raw);
  const pool = state ? getCitiesForState(state) : INDIAN_CITIES;
  const exact = pool.find((c) => normalizePlace(c) === n);
  if (exact) return exact;
  // Bengaluru / Bangalore etc.
  const aliases: Record<string, string> = {
    bangalore: "Bengaluru",
    bengalooru: "Bengaluru",
    bombay: "Mumbai",
    calcutta: "Kolkata",
    madras: "Chennai",
    poona: "Pune",
    trivandrum: "Thiruvananthapuram",
    baroda: "Vadodara",
    gurgaon: "Gurugram",
  };
  const alias = aliases[n];
  if (alias && (!state || getCitiesForState(state).includes(alias) || !state)) {
    return alias;
  }
  const partial = pool.find(
    (c) => normalizePlace(c).includes(n) || n.includes(normalizePlace(c)),
  );
  return partial || raw.trim();
}

export function formatLocationLabel(city?: string, state?: string) {
  const parts = [city?.trim(), state?.trim()].filter(Boolean);
  return parts.join(", ");
}

/** Great-circle distance in km. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Current Terms / Privacy version accepted at signup. */
export const TERMS_VERSION = "2026-07-1";

export const CLINIC_TYPE_OPTIONS = [
  { value: "solo", label: "Solo practice" },
  { value: "multi_doctor", label: "Multi-doctor clinic" },
  { value: "polyclinic", label: "Polyclinic" },
  { value: "specialty", label: "Specialty clinic" },
  { value: "hospital_opd", label: "Hospital OPD" },
] as const;

export type ClinicTypeValue = (typeof CLINIC_TYPE_OPTIONS)[number]["value"];

/** Timezones offered during onboarding (India-first). */
export const CLINIC_TIMEZONE_OPTIONS = [
  { value: "Asia/Kolkata", label: "India (IST) — Asia/Kolkata" },
  { value: "Asia/Colombo", label: "Sri Lanka — Asia/Colombo" },
  { value: "Asia/Kathmandu", label: "Nepal — Asia/Kathmandu" },
  { value: "Asia/Dhaka", label: "Bangladesh — Asia/Dhaka" },
  { value: "Asia/Dubai", label: "UAE — Asia/Dubai" },
] as const;

export type ClinicHourRow = {
  dayOfWeek: number;
  open: string;
  close: string;
  closed: boolean;
};

export const DEFAULT_CLINIC_HOURS: ClinicHourRow[] = [
  { dayOfWeek: 1, open: "09:00", close: "18:00", closed: false },
  { dayOfWeek: 2, open: "09:00", close: "18:00", closed: false },
  { dayOfWeek: 3, open: "09:00", close: "18:00", closed: false },
  { dayOfWeek: 4, open: "09:00", close: "18:00", closed: false },
  { dayOfWeek: 5, open: "09:00", close: "18:00", closed: false },
  { dayOfWeek: 6, open: "09:00", close: "14:00", closed: false },
  { dayOfWeek: 0, open: "09:00", close: "13:00", closed: true },
];

export function parseClinicHours(value: unknown): ClinicHourRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const dayOfWeek = Number(r.dayOfWeek);
      const open = String(r.open ?? "09:00");
      const close = String(r.close ?? "18:00");
      const closed = Boolean(r.closed);
      if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        return null;
      }
      return { dayOfWeek, open, close, closed };
    })
    .filter((row): row is ClinicHourRow => row != null)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}

export function cancelCutoffForClinicType(type: ClinicTypeValue): number {
  return type === "hospital_opd" ? 4 : 2;
}

export const BUSINESS_ENTITY_OPTIONS = [
  { value: "sole_prop", label: "Sole proprietorship" },
  { value: "partnership", label: "Partnership" },
  { value: "pvt_ltd", label: "Private limited" },
  { value: "trust", label: "Trust / society" },
  { value: "other", label: "Other" },
] as const;

export type BusinessEntityValue =
  (typeof BUSINESS_ENTITY_OPTIONS)[number]["value"];

export { INDIAN_STATE_OPTIONS, INDIAN_STATES } from "./indian-states";
export type { IndianState } from "./indian-states";

export const CLINIC_LANGUAGE_OPTIONS = [
  "English",
  "Hindi",
  "Bengali",
  "Tamil",
  "Telugu",
  "Marathi",
  "Gujarati",
  "Kannada",
  "Malayalam",
  "Punjabi",
  "Urdu",
  "Odia",
  "Assamese",
] as const;

/** Amenities patients use when choosing a local OPD / polyclinic. Sorted A–Z. */
export const CLINIC_FACILITY_OPTIONS = [
  "AC waiting area",
  "ECG",
  "In-house lab",
  "In-house pharmacy",
  "Minor procedure room",
  "Online reports",
  "Parking",
  "Physiotherapy",
  "Sample collection",
  "Ultrasound",
  "Wheelchair access",
  "X-ray",
] as const;

/** Collapse duplicate comma-separated segments (e.g. area repeated in line 1). */
export function dedupeAddressSegments(address: string): string {
  const seen = new Set<string>();
  return address
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => {
      const key = p.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(", ");
}

/** Build legacy single-line address from structured parts (+ optional city). */
export function formatClinicAddress(parts: {
  addressLine1?: string | null;
  addressLine2?: string | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  landmark?: string | null;
}): string {
  return dedupeAddressSegments(
    [
      parts.addressLine1,
      parts.addressLine2,
      parts.area,
      parts.landmark ? `Near ${parts.landmark}` : null,
      parts.city,
      parts.state,
      parts.pincode,
    ]
      .map((p) => (p ?? "").trim())
      .filter(Boolean)
      .join(", "),
  );
}

export function isValidIndianPincode(value: string): boolean {
  return /^[1-9][0-9]{5}$/.test(value.trim());
}

export function isValidPan(value: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(value.trim());
}

export function mapsUrlFromCoords(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

/** Parse a lat/lng string; returns null if empty or out of range. */
export function parseOptionalCoord(
  value: string | undefined | null,
  kind: "lat" | "lng",
): number | null {
  if (value == null || !String(value).trim()) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (kind === "lat" && (n < -90 || n > 90)) return null;
  if (kind === "lng" && (n < -180 || n > 180)) return null;
  return n;
}

/** Extract lat/lng from common Google Maps / geo URLs. */
export function parseCoordsFromMapsUrl(
  url: string,
): { lat: number; lng: number } | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const atMatch = trimmed.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) {
    return { lat: Number(atMatch[1]), lng: Number(atMatch[2]) };
  }

  const qMatch = trimmed.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) {
    return { lat: Number(qMatch[1]), lng: Number(qMatch[2]) };
  }

  const llMatch = trimmed.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (llMatch) {
    return { lat: Number(llMatch[1]), lng: Number(llMatch[2]) };
  }

  const placeMatch = trimmed.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  if (placeMatch) {
    return { lat: Number(placeMatch[1]), lng: Number(placeMatch[2]) };
  }

  return null;
}

export type ReverseGeocodeResult = {
  addressLine1: string;
  addressLine2?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  displayName: string;
};

/**
 * Reverse-geocode via OpenStreetMap Nominatim (no API key).
 * Call from the browser only; respects Nominatim usage policy.
 */
export async function reverseGeocodeNominatim(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error("Could not resolve address from coordinates.");
  }

  const data = (await res.json()) as {
    display_name?: string;
    address?: Record<string, string>;
  };
  // TODO: remove after debugging
  console.log("[reverseGeocode] raw Nominatim response:", JSON.stringify(data, null, 2));
  const a = data.address ?? {};

  // --- Address line 1 ---
  // Nominatim often lacks road / house_number for rural and semi-urban India.
  // Strategy: build the best street-level string we can; for hamlets / villages
  // combine multiple locality parts so the user gets something recognisable
  // instead of a single cryptic hamlet name like "Hatte".
  const roadPart = a.road || a.pedestrian || a.path || a.street;
  const roadLine = [a.house_number, roadPart].filter(Boolean).join(" ").trim();

  let addressLine1: string;
  if (roadLine) {
    addressLine1 = roadLine;
  } else {
    // No road — combine hamlet + village + suburb to form a useful line.
    // e.g. "Hatte, Puchal" instead of just "Hatte".
    const localParts = [
      a.hamlet,
      a.village,
      a.neighbourhood,
      a.residential,
      a.suburb,
    ].filter(Boolean);
    // De-duplicate (hamlet may equal village in some responses)
    const unique = [...new Set(localParts)];
    addressLine1 = unique.join(", ");
  }
  if (!addressLine1 && data.display_name) {
    const parts = data.display_name
      .split(",")
      .map((s) => s.trim())
      .filter(
        (s) =>
          s &&
          !/^\d{5,}$/.test(s) &&
          s !== a.country &&
          s !== a.state &&
          s !== a.postcode,
      );
    addressLine1 = parts.slice(0, 3).join(", ");
  }
  if (!addressLine1) addressLine1 = "Clinic location";

  // --- Area / locality ---
  // Prefer a locality that isn't already baked into addressLine1 (common when
  // Nominatim has no road and line 1 was built from hamlet/village/suburb).
  const areaCandidates = [
    a.suburb,
    a.neighbourhood,
    a.residential,
    a.village,
    a.hamlet,
  ].filter(Boolean) as string[];
  const line1Parts = new Set(
    addressLine1
      .split(",")
      .map((p) => p.trim().toLocaleLowerCase())
      .filter(Boolean),
  );
  const area = areaCandidates.find(
    (candidate) => !line1Parts.has(candidate.trim().toLocaleLowerCase()),
  );

  // --- City ---
  const city =
    a.city || a.town || a.municipality || a.county || a.state_district;
  const state = a.state;

  // --- Pincode ---
  // Nominatim may omit postcode entirely for rural India. When present it may
  // contain spaces or be embedded in a longer string — extract the 6-digit PIN.
  let pincode: string | undefined;
  if (a.postcode) {
    const digits = a.postcode.replace(/\s/g, "");
    if (/^[1-9]\d{5}$/.test(digits)) {
      pincode = digits;
    } else {
      const match = digits.match(/([1-9]\d{5})/);
      if (match) pincode = match[1];
    }
  }

  return {
    addressLine1,
    addressLine2: a.building || undefined,
    area: area || undefined,
    city: city || undefined,
    state: state || undefined,
    pincode,
    landmark: a.amenity || a.shop || undefined,
    displayName: data.display_name || "",
  };
}

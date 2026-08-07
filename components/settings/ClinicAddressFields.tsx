"use client";

import { useEffect, useRef, useState } from "react";
import {
  faCircleCheck,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { CityCombobox } from "@/components/settings/CityCombobox";
import { StateCombobox } from "@/components/settings/StateCombobox";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import {
  mapsUrlFromCoords,
  parseCoordsFromMapsUrl,
  reverseGeocodeNominatim,
} from "@/lib/clinic-onboarding";
import { cn } from "@/lib/utils";

export type ClinicAddressValue = {
  addressLine1: string;
  addressLine2: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  mapsUrl: string;
  latitude: string;
  longitude: string;
};

type FieldErrors = Partial<Record<keyof ClinicAddressValue | "city", string>>;

type ClinicAddressFieldsProps = {
  value: ClinicAddressValue;
  onChange: (next: ClinicAddressValue) => void;
  errors?: FieldErrors;
  /** Prefix for form field names (e.g. "" or "clinic"). */
  namePrefix?: string;
  showMapsLink?: boolean;
  required?: boolean;
};

type GeoFeedback =
  | { tone: "info" | "success" | "error"; text: string }
  | null;

type AutofillKey =
  | "addressLine1"
  | "addressLine2"
  | "state"
  | "city"
  | "area"
  | "landmark"
  | "pincode"
  | "mapsUrl";

const AUTOFILL_LABELS: Record<AutofillKey, string> = {
  addressLine1: "Address line 1",
  addressLine2: "Address line 2",
  state: "State",
  city: "City",
  area: "Area",
  landmark: "Landmark",
  pincode: "PIN code",
  mapsUrl: "Maps link",
};

function fieldName(prefix: string, key: string) {
  return prefix ? `${prefix}${key[0].toUpperCase()}${key.slice(1)}` : key;
}

function AutofillShell({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl p-1.5 transition-[background-color,box-shadow] duration-300",
        active &&
          "bg-success/15 shadow-[inset_0_0_0_2px] shadow-success/70",
      )}
    >
      {children}
    </div>
  );
}

const AUTOFILL_INPUT_CLASS =
  "border-success bg-success/10 focus-visible:border-success focus-visible:ring-success/30";

export function ClinicAddressFields({
  value,
  onChange,
  errors,
  namePrefix = "",
  showMapsLink = true,
  required = true,
}: ClinicAddressFieldsProps) {
  const [locating, setLocating] = useState(false);
  const [geoFeedback, setGeoFeedback] = useState<GeoFeedback>(null);
  const [autofilled, setAutofilled] = useState<Set<AutofillKey>>(
    () => new Set(),
  );
  const [pinCaptured, setPinCaptured] = useState(
    () => Boolean(value.latitude && value.longitude),
  );
  const feedbackRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    if (!autofilled.size) return;
    const timer = window.setTimeout(() => setAutofilled(new Set()), 3500);
    return () => window.clearTimeout(timer);
  }, [autofilled]);

  useEffect(() => {
    if (!geoFeedback) return;
    feedbackRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [geoFeedback]);

  function patch(partial: Partial<ClinicAddressValue>) {
    onChange({ ...valueRef.current, ...partial });
  }

  function markAutofilled(keys: AutofillKey[], next: ClinicAddressValue) {
    const filled = keys.filter((key) => Boolean(next[key]?.trim()));
    setAutofilled(new Set(filled));
    return filled;
  }

  async function handleMyLocation() {
    setGeoFeedback(null);
    setAutofilled(new Set());
    if (!navigator.geolocation) {
      setGeoFeedback({
        tone: "error",
        text: "Geolocation is not supported in this browser.",
      });
      return;
    }
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setGeoFeedback({
        tone: "error",
        text: "Location needs HTTPS or localhost. Paste a Google Maps link instead.",
      });
      return;
    }

    let permState: PermissionState | null = null;
    try {
      const status = await navigator.permissions.query({ name: "geolocation" });
      permState = status.state;
    } catch {
      // Permissions API not available — proceed anyway
    }

    if (permState === "denied") {
      setGeoFeedback({
        tone: "error",
        text: "Location permission is blocked. Allow location in the browser site settings, reload, then try again.",
      });
      return;
    }

    if (permState === "prompt") {
      setGeoFeedback({
        tone: "info",
        text: "Allow location in the browser popup to fill your clinic address.",
      });
    }

    setLocating(true);

    function onSuccess(pos: GeolocationPosition) {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const prev = valueRef.current;
      reverseGeocodeNominatim(lat, lng)
        .then((geo) => {
          const next: ClinicAddressValue = {
            ...prev,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6),
            mapsUrl: mapsUrlFromCoords(lat, lng),
            addressLine1: geo.addressLine1 || prev.addressLine1,
            addressLine2: geo.addressLine2 || prev.addressLine2,
            area: geo.area || prev.area,
            city: geo.city || prev.city,
            state: geo.state || prev.state,
            pincode: geo.pincode || prev.pincode,
            landmark: geo.landmark || prev.landmark,
          };
          onChange(next);
          setPinCaptured(true);

          const changed: AutofillKey[] = (
            [
              "addressLine1",
              "addressLine2",
              "area",
              "city",
              "state",
              "pincode",
              "landmark",
              "mapsUrl",
            ] as const
          ).filter((key) => {
            const before = (prev[key] ?? "").trim();
            const after = (next[key] ?? "").trim();
            return Boolean(after) && after !== before;
          });

          const filled = markAutofilled(
            changed.length ? [...changed] : ["mapsUrl"],
            next,
          );

          const missing: string[] = [];
          if (!geo.pincode) missing.push("PIN code");
          if (!geo.addressLine1 || geo.addressLine1 === "Clinic location") {
            missing.push("address line 1");
          }

          const filledLabels = filled
            .filter((k) => k !== "mapsUrl")
            .map((k) => AUTOFILL_LABELS[k]);

          if (missing.length) {
            setGeoFeedback({
              tone: "info",
              text: `Location captured — we filled ${
                filledLabels.length
                  ? filledLabels.join(", ")
                  : "your map pin"
              }. Please add ${missing.join(" and ")} manually.`,
            });
          } else {
            setGeoFeedback({
              tone: "success",
              text: `Location captured — address fields updated from GPS${
                filledLabels.length ? ` (${filledLabels.join(", ")})` : ""
              }. Review and edit if anything looks off.`,
            });
          }
        })
        .catch(() => {
          const next: ClinicAddressValue = {
            ...prev,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6),
            mapsUrl: mapsUrlFromCoords(lat, lng),
          };
          onChange(next);
          setPinCaptured(true);
          markAutofilled(["mapsUrl"], next);
          setGeoFeedback({
            tone: "info",
            text: "Map pin saved from your location. Fill the address lines below — GPS could not resolve a full address.",
          });
        })
        .finally(() => setLocating(false));
    }

    function onError(
      err: GeolocationPositionError,
      retriedLowAccuracy: boolean,
    ) {
      const code = err.code;

      if (!retriedLowAccuracy && (code === 2 || code === 3)) {
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          (retryErr) => onError(retryErr, true),
          { enableHighAccuracy: false, timeout: 15_000, maximumAge: 60_000 },
        );
        return;
      }

      setLocating(false);
      if (code === 1) {
        setGeoFeedback({
          tone: "error",
          text: "Location permission was denied. Allow it in the browser address-bar site settings, reload, and try again — or paste a Google Maps link.",
        });
      } else if (code === 2) {
        setGeoFeedback({
          tone: "error",
          text: "Location unavailable. Check system location settings, or paste a Google Maps link below.",
        });
      } else if (code === 3) {
        setGeoFeedback({
          tone: "error",
          text: "Location request timed out. Try again or paste a Google Maps link.",
        });
      } else {
        setGeoFeedback({
          tone: "error",
          text: "Could not read your location. Try again or paste a Google Maps link.",
        });
      }
    }

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (err) => onError(err, false),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }

  function onMapsUrlChange(mapsUrl: string) {
    const coords = parseCoordsFromMapsUrl(mapsUrl);
    if (coords) {
      patch({
        mapsUrl,
        latitude: coords.lat.toFixed(6),
        longitude: coords.lng.toFixed(6),
      });
      setPinCaptured(true);
      setAutofilled(new Set(["mapsUrl"]));
      setGeoFeedback({
        tone: "success",
        text: "Coordinates extracted from your Maps link — pin is set.",
      });
      return;
    }
    patch({ mapsUrl });
  }

  const n = (key: keyof ClinicAddressValue) => fieldName(namePrefix, key);
  const flashed = (key: AutofillKey) => autofilled.has(key);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface/60 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={locating}
            onClick={() => void handleMyLocation()}
          >
            <Icon icon={faLocationDot} data-icon="inline-start" />
            {locating ? "Detecting location…" : "Use my current location"}
          </Button>
          {pinCaptured && value.latitude && value.longitude ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
              <Icon icon={faCircleCheck} className="size-3" aria-hidden />
              Location pin set
            </span>
          ) : null}
          {value.latitude && value.longitude ? (
            <a
              href={mapsUrlFromCoords(
                Number(value.latitude),
                Number(value.longitude),
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary underline-offset-2 hover:underline"
            >
              Open pin on Maps
            </a>
          ) : null}
        </div>

        <div ref={feedbackRef}>
          {geoFeedback ? (
            <Banner variant={geoFeedback.tone}>{geoFeedback.text}</Banner>
          ) : (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Tap the button to autofill address from GPS. Updated fields get a
              green highlight for a few seconds.
            </p>
          )}
        </div>
      </div>

      <AutofillShell active={flashed("addressLine1")}>
        <Input
          label="Address line 1"
          name={n("addressLine1")}
          value={value.addressLine1}
          onChange={(e) => patch({ addressLine1: e.target.value })}
          error={errors?.addressLine1}
          required={required}
          autoComplete="address-line1"
          placeholder="Building / street"
          className={flashed("addressLine1") ? AUTOFILL_INPUT_CLASS : undefined}
        />
      </AutofillShell>
      <AutofillShell active={flashed("addressLine2")}>
        <Input
          label="Address line 2 (optional)"
          name={n("addressLine2")}
          value={value.addressLine2}
          onChange={(e) => patch({ addressLine2: e.target.value })}
          autoComplete="address-line2"
          placeholder="Floor, suite, unit"
          className={flashed("addressLine2") ? AUTOFILL_INPUT_CLASS : undefined}
        />
      </AutofillShell>
      <div className="grid grid-cols-2 gap-4">
        <AutofillShell active={flashed("state")}>
          <StateCombobox
            value={value.state}
            onChange={(state) => {
              if (state !== value.state) patch({ state, city: "" });
              else patch({ state });
            }}
            name={n("state")}
            required={required}
            error={errors?.state}
            className={flashed("state") ? AUTOFILL_INPUT_CLASS : undefined}
          />
        </AutofillShell>
        <AutofillShell active={flashed("city")}>
          <div>
            <CityCombobox
              value={value.city}
              onChange={(city) => patch({ city })}
              name={n("city")}
              state={value.state}
              className={flashed("city") ? AUTOFILL_INPUT_CLASS : undefined}
            />
            {errors?.city ? (
              <p className="mt-1 text-sm text-danger" role="alert">
                {errors.city}
              </p>
            ) : null}
          </div>
        </AutofillShell>
      </div>
      <AutofillShell active={flashed("area")}>
        <Input
          label="Area / locality"
          name={n("area")}
          value={value.area}
          onChange={(e) => patch({ area: e.target.value })}
          className={flashed("area") ? AUTOFILL_INPUT_CLASS : undefined}
        />
      </AutofillShell>
      <div className="grid grid-cols-[1fr_8.5rem] gap-4">
        <AutofillShell active={flashed("landmark")}>
          <Input
            label="Landmark (optional)"
            name={n("landmark")}
            value={value.landmark}
            onChange={(e) => patch({ landmark: e.target.value })}
            placeholder="Opposite City Hospital"
            className={flashed("landmark") ? AUTOFILL_INPUT_CLASS : undefined}
          />
        </AutofillShell>
        <AutofillShell active={flashed("pincode")}>
          <Input
            label="PIN code"
            name={n("pincode")}
            value={value.pincode}
            onChange={(e) =>
              patch({ pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })
            }
            maxLength={6}
            inputMode="numeric"
            required={required}
            error={errors?.pincode}
            className={flashed("pincode") ? AUTOFILL_INPUT_CLASS : undefined}
          />
        </AutofillShell>
      </div>

      {showMapsLink ? (
        <AutofillShell active={flashed("mapsUrl")}>
          <Input
            label="Google Maps link (optional)"
            name={n("mapsUrl")}
            value={value.mapsUrl}
            onChange={(e) => onMapsUrlChange(e.target.value)}
            placeholder="https://maps.google.com/… or https://maps.app.goo.gl/…"
            error={errors?.mapsUrl}
            className={flashed("mapsUrl") ? AUTOFILL_INPUT_CLASS : undefined}
          />
        </AutofillShell>
      ) : null}

      <input type="hidden" name={n("latitude")} value={value.latitude} />
      <input type="hidden" name={n("longitude")} value={value.longitude} />
    </div>
  );
}

export const EMPTY_CLINIC_ADDRESS: ClinicAddressValue = {
  addressLine1: "",
  addressLine2: "",
  area: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
  mapsUrl: "",
  latitude: "",
  longitude: "",
};

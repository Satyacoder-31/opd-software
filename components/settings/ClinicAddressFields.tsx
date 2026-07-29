"use client";

import { useState } from "react";
import { CityCombobox } from "@/components/settings/CityCombobox";
import { StateCombobox } from "@/components/settings/StateCombobox";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  mapsUrlFromCoords,
  parseCoordsFromMapsUrl,
  reverseGeocodeNominatim,
} from "@/lib/clinic-onboarding";

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

function fieldName(prefix: string, key: string) {
  return prefix ? `${prefix}${key[0].toUpperCase()}${key.slice(1)}` : key;
}

export function ClinicAddressFields({
  value,
  onChange,
  errors,
  namePrefix = "",
  showMapsLink = true,
  required = true,
}: ClinicAddressFieldsProps) {
  const [locating, setLocating] = useState(false);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

  function patch(partial: Partial<ClinicAddressValue>) {
    onChange({ ...value, ...partial });
  }

  async function handleMyLocation() {
    setGeoMessage(null);
    if (!navigator.geolocation) {
      setGeoMessage("Geolocation is not supported in this browser.");
      return;
    }
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setGeoMessage(
        "Location needs a secure context (HTTPS or localhost). Paste a Google Maps link instead.",
      );
      return;
    }

    // Check permission state before requesting location so we can show
    // the right guidance. "prompt" means the browser will ask — we should
    // tell the user to look for the popup and click Allow.
    let permState: PermissionState | null = null;
    try {
      const status = await navigator.permissions.query({ name: "geolocation" });
      permState = status.state;
    } catch {
      // Permissions API not available — proceed anyway
    }

    if (permState === "denied") {
      setGeoMessage(
        "Location permission is blocked. Click the lock/tune icon in the address bar → Site settings → Location → Allow, then reload the page.",
      );
      return;
    }

    if (permState === "prompt") {
      setGeoMessage(
        "A browser popup is asking for location access — click 'Allow' to continue.",
      );
    }

    setLocating(true);

    function onSuccess(pos: GeolocationPosition) {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      reverseGeocodeNominatim(lat, lng)
        .then((geo) => {
          patch({
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6),
            mapsUrl: mapsUrlFromCoords(lat, lng),
            addressLine1: geo.addressLine1 || value.addressLine1,
            addressLine2: geo.addressLine2 || value.addressLine2,
            area: geo.area || value.area,
            city: geo.city || value.city,
            state: geo.state || value.state,
            pincode: geo.pincode || value.pincode,
            landmark: geo.landmark || value.landmark,
          });
          const missing: string[] = [];
          if (!geo.pincode) missing.push("PIN code");
          if (!geo.addressLine1 || geo.addressLine1 === "Clinic location")
            missing.push("address line 1");
          setGeoMessage(
            missing.length
              ? `Location captured. Please fill ${missing.join(" and ")} manually — not available from GPS.`
              : "Location captured and address filled from GPS.",
          );
        })
        .catch(() => {
          patch({
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6),
            mapsUrl: mapsUrlFromCoords(lat, lng),
          });
          setGeoMessage(
            "Coordinates saved. Fill the address lines manually if needed.",
          );
        })
        .finally(() => setLocating(false));
    }

    function onError(err: GeolocationPositionError, retriedLowAccuracy: boolean) {
      const code = err.code;

      // High-accuracy can fail on desktops without GPS hardware —
      // retry once with low accuracy (Wi-Fi / IP based).
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
        setGeoMessage(
          "Location permission was denied. Click the lock/tune icon in your browser's address bar → Site settings → Location → set to 'Allow,' then reload and try again. Or paste a Google Maps link below.",
        );
      } else if (code === 2) {
        setGeoMessage(
          "Location unavailable. Ensure Windows Settings → Privacy & Security → Location is ON and 'Let desktop apps access your location' is enabled. Or paste a Google Maps link.",
        );
      } else if (code === 3) {
        setGeoMessage(
          "Location request timed out. Try again or paste a Google Maps link.",
        );
      } else {
        setGeoMessage(
          "Could not read your location. Try again or paste a Google Maps link.",
        );
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
      setGeoMessage("Coordinates extracted from Maps link.");
      return;
    }
    patch({ mapsUrl });
  }

  const n = (key: keyof ClinicAddressValue) => fieldName(namePrefix, key);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={locating}
          onClick={() => void handleMyLocation()}
        >
          Use my current location
        </Button>
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
            Open pin on Maps ({value.latitude}, {value.longitude})
          </a>
        ) : null}
      </div>
      {geoMessage ? (
        <p className="text-xs text-muted-foreground" role="status">
          {geoMessage}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Capture GPS for a genuine clinic pin, or paste a Google Maps link
          below.
        </p>
      )}

      <Input
        label="Address line 1"
        name={n("addressLine1")}
        value={value.addressLine1}
        onChange={(e) => patch({ addressLine1: e.target.value })}
        error={errors?.addressLine1}
        required={required}
        autoComplete="address-line1"
        placeholder="Building / street"
      />
      <Input
        label="Address line 2 (optional)"
        name={n("addressLine2")}
        value={value.addressLine2}
        onChange={(e) => patch({ addressLine2: e.target.value })}
        autoComplete="address-line2"
        placeholder="Floor, suite, unit"
      />
      <Input
        label="Landmark (optional)"
        name={n("landmark")}
        value={value.landmark}
        onChange={(e) => patch({ landmark: e.target.value })}
        placeholder="Opposite City Hospital"
      />
      <Input
        label="Area / locality"
        name={n("area")}
        value={value.area}
        onChange={(e) => patch({ area: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-4">
        <StateCombobox
          value={value.state}
          onChange={(state) => {
            if (state !== value.state) patch({ state, city: "" });
            else patch({ state });
          }}
          name={n("state")}
          required={required}
          error={errors?.state}
        />
        <div>
          <CityCombobox
            value={value.city}
            onChange={(city) => patch({ city })}
            name={n("city")}
            state={value.state}
          />
          {errors?.city ? (
            <p className="mt-1 text-sm text-danger" role="alert">
              {errors.city}
            </p>
          ) : null}
        </div>
      </div>
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
      />

      {showMapsLink ? (
        <Input
          label="Google Maps link (optional)"
          name={n("mapsUrl")}
          value={value.mapsUrl}
          onChange={(e) => onMapsUrlChange(e.target.value)}
          placeholder="https://maps.google.com/… or https://maps.app.goo.gl/…"
          error={errors?.mapsUrl}
        />
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

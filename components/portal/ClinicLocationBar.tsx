"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  faLocationArrow,
  faLocationDot,
  faPen,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { reverseGeocodeNominatim } from "@/lib/clinic-onboarding";
import {
  clearSavedClinicLocation,
  formatLocationLabel,
  matchIndianCity,
  matchIndianState,
  readSavedClinicLocation,
  writeSavedClinicLocation,
  type SavedClinicLocation,
} from "@/lib/clinic-directory-location";
import { listLearnedCities } from "@/actions/cities";
import { getCitiesForState } from "@/lib/indian-cities";
import { INDIAN_STATES } from "@/lib/indian-states";
import { cn } from "@/lib/utils";

type ClinicLocationBarProps = {
  initial: { city?: string; state?: string };
};

type Status = "idle" | "detecting" | "ready" | "needs-location" | "error";

const selectClass =
  "h-10 w-full appearance-none rounded-lg border border-border bg-white px-3 pr-9 text-sm text-ink outline-none transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25";

export function ClinicLocationBar({ initial }: ClinicLocationBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const editPanelId = useId();
  const autoStarted = useRef(false);

  const [status, setStatus] = useState<Status>(() =>
    initial.city || initial.state ? "ready" : "idle",
  );
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [city, setCity] = useState(initial.city ?? "");
  const [state, setState] = useState(initial.state ?? "");
  const [draftCity, setDraftCity] = useState(initial.city ?? "");
  const [draftState, setDraftState] = useState(initial.state ?? "");
  const [learnedCities, setLearnedCities] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!draftState.trim()) {
      setLearnedCities([]);
      return;
    }
    void listLearnedCities(draftState).then((cities) => {
      if (!cancelled) setLearnedCities(cities);
    });
    return () => {
      cancelled = true;
    };
  }, [draftState]);

  const cityOptions = useMemo(() => {
    if (!draftState) return draftCity ? [draftCity] : [];
    const catalog = getCitiesForState(draftState);
    const catalogLower = new Set(catalog.map((c) => c.toLocaleLowerCase()));
    const learned = learnedCities.filter(
      (c) => !catalogLower.has(c.toLocaleLowerCase()),
    );
    const merged = [...learned, ...catalog];
    if (
      draftCity &&
      !merged.some((c) => c.toLocaleLowerCase() === draftCity.toLocaleLowerCase())
    ) {
      return [draftCity, ...merged];
    }
    return merged;
  }, [draftState, draftCity, learnedCities]);

  const label = formatLocationLabel(city, state);

  function pushLocation(next: {
    city: string;
    state: string;
    lat?: number;
    lng?: number;
    source: "geo" | "manual";
  }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.city.trim()) params.set("city", next.city.trim());
    else params.delete("city");
    if (next.state.trim()) params.set("state", next.state.trim());
    else params.delete("state");
    if (typeof next.lat === "number" && typeof next.lng === "number") {
      params.set("lat", next.lat.toFixed(5));
      params.set("lng", next.lng.toFixed(5));
    } else {
      params.delete("lat");
      params.delete("lng");
    }

    const saved: SavedClinicLocation = {
      city: next.city.trim(),
      state: next.state.trim(),
      lat: next.lat,
      lng: next.lng,
      source: next.source,
      label: formatLocationLabel(next.city, next.state) || undefined,
    };
    writeSavedClinicLocation(saved);

    setCity(saved.city);
    setState(saved.state);
    setDraftCity(saved.city);
    setDraftState(saved.state);
    setStatus(saved.city || saved.state ? "ready" : "needs-location");
    setEditing(false);
    setMessage(null);

    startTransition(() => {
      router.replace(`/clinics?${params.toString()}`);
    });
  }

  async function detectLocation() {
    setMessage(null);
    setStatus("detecting");

    if (!navigator.geolocation) {
      setStatus("needs-location");
      setMessage("Location isn’t supported here — pick a city instead.");
      setEditing(true);
      return;
    }
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setStatus("needs-location");
      setMessage("Location needs HTTPS. Choose a city manually.");
      setEditing(true);
      return;
    }

    try {
      const statusPerm = await navigator.permissions
        ?.query({ name: "geolocation" })
        .catch(() => null);
      if (statusPerm?.state === "denied") {
        setStatus("needs-location");
        setMessage(
          "Location is blocked in your browser. Choose a city, or allow location in site settings.",
        );
        setEditing(true);
        return;
      }
      if (statusPerm?.state === "prompt") {
        setMessage("Allow location access when your browser asks.");
      }
    } catch {
      // Permissions API optional
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const geo = await reverseGeocodeNominatim(lat, lng);
          const matchedState = matchIndianState(geo.state);
          const matchedCity = matchIndianCity(geo.city, matchedState);
          if (!matchedCity && !matchedState) {
            setStatus("needs-location");
            setMessage("We found you, but couldn’t name the city. Pick one below.");
            setEditing(true);
            return;
          }
          pushLocation({
            city: matchedCity,
            state: matchedState,
            lat,
            lng,
            source: "geo",
          });
        } catch {
          setStatus("error");
          setMessage("Couldn’t resolve your area. Pick a city instead.");
          setEditing(true);
        }
      },
      (err) => {
        setStatus("needs-location");
        setEditing(true);
        if (err.code === err.PERMISSION_DENIED) {
          setMessage("Location permission denied. Choose a city to continue.");
        } else if (err.code === err.TIMEOUT) {
          setMessage("Location timed out. Choose a city, or try again.");
        } else {
          setMessage("Couldn’t get your location. Choose a city instead.");
        }
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 5 * 60 * 1000 },
    );
  }

  useEffect(() => {
    if (autoStarted.current) return;
    autoStarted.current = true;

    if (initial.city || initial.state) {
      setStatus("ready");
      return;
    }

    const saved = readSavedClinicLocation();
    if (saved && (saved.city || saved.state)) {
      pushLocation({
        city: saved.city,
        state: saved.state,
        lat: saved.lat,
        lng: saved.lng,
        source: saved.source,
      });
      return;
    }

    void detectLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount for auto-detect
  }, []);

  function onDraftStateChange(next: string) {
    setDraftState(next);
    if (!next) {
      setDraftCity("");
      return;
    }
    const allowed = getCitiesForState(next);
    if (draftCity && !allowed.includes(draftCity)) setDraftCity("");
  }

  function applyManual() {
    if (!draftCity.trim() && !draftState.trim()) {
      setMessage("Pick a state and city to continue.");
      return;
    }
    pushLocation({
      city: draftCity.trim(),
      state: draftState.trim(),
      source: "manual",
    });
  }

  function clearLocation() {
    clearSavedClinicLocation();
    setCity("");
    setState("");
    setDraftCity("");
    setDraftState("");
    setStatus("needs-location");
    setEditing(true);
    setMessage(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("city");
    params.delete("state");
    params.delete("lat");
    params.delete("lng");
    startTransition(() => {
      router.replace(params.toString() ? `/clinics?${params.toString()}` : "/clinics");
    });
  }

  return (
    <section
      aria-label="Your location"
      className="overflow-hidden rounded-xl border border-border/80 bg-white/90"
    >
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-3.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Icon
            icon={faLocationDot}
            className={cn(
              "shrink-0 text-primary",
              status === "detecting" && "animate-pulse",
            )}
            aria-hidden
          />
          <p className="min-w-0 truncate text-sm font-medium text-ink" aria-live="polite">
            {status === "detecting"
              ? "Finding your area…"
              : label || "Choose a city"}
          </p>
          {message ? (
            <p className="hidden text-xs text-muted-foreground sm:block sm:truncate">
              · {message}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {status !== "detecting" ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-xs"
              onClick={() => {
                setDraftCity(city);
                setDraftState(state);
                setEditing((open) => !open);
                setMessage(null);
              }}
              aria-expanded={editing}
              aria-controls={editPanelId}
            >
              <Icon icon={editing ? faXmark : faPen} data-icon="inline-start" />
              {editing ? "Close" : label ? "Change" : "Set"}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-xs"
            loading={status === "detecting" || pending}
            onClick={() => void detectLocation()}
            disabled={status === "detecting"}
          >
            <Icon icon={faLocationArrow} data-icon="inline-start" />
            My location
          </Button>
        </div>
      </div>

      {message && !editing ? (
        <p className="border-t border-border/60 px-3 py-1.5 text-xs text-muted-foreground sm:hidden">
          {message}
        </p>
      ) : null}

      {editing ? (
        <div
          id={editPanelId}
          className="border-t border-border/80 bg-surface-muted/40 px-3 py-3 sm:px-3.5"
        >
          <div className="grid gap-2.5 sm:grid-cols-2">
            <div className="relative">
              <label
                htmlFor={`${editPanelId}-state`}
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                State
              </label>
              <select
                id={`${editPanelId}-state`}
                value={draftState}
                onChange={(e) => onDraftStateChange(e.target.value)}
                className={selectClass}
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <SelectChevron />
            </div>
            <div className="relative">
              <label
                htmlFor={`${editPanelId}-city`}
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                City
              </label>
              <select
                id={`${editPanelId}-city`}
                value={draftCity}
                onChange={(e) => setDraftCity(e.target.value)}
                className={selectClass}
                disabled={!draftState}
              >
                <option value="">
                  {draftState ? "Select city" : "Select state first"}
                </option>
                {cityOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <SelectChevron />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="h-9 px-3"
              loading={pending}
              onClick={applyManual}
            >
              Apply
            </Button>
            {label ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9"
                onClick={clearLocation}
                disabled={pending}
              >
                Clear
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SelectChevron() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute right-3 top-[2.15rem] text-muted-foreground"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </span>
  );
}

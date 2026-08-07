"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Patient } from "@prisma/client";
import { faMagnifyingGlass, faUsers } from "@fortawesome/free-solid-svg-icons";
import { searchPatients } from "@/actions/patients";
import { Icon } from "@/components/ui/Icon";
import { formatPhone, cn } from "@/lib/utils";

const RESULT_LIMIT = 6;

export function GlobalPatientSearch({
  enabled,
  className,
  inputId = "global-patient-search",
  placeholder = "Search patients by name, phone, or MRN",
}: {
  enabled: boolean;
  className?: string;
  inputId?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Patient[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!enabled) return;

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    const handle = window.setTimeout(() => {
      startTransition(async () => {
        const rows = await searchPatients(trimmed, 0, RESULT_LIMIT);
        setResults(rows);
        setOpen(true);
      });
    }, 220);

    return () => window.clearTimeout(handle);
  }, [enabled, query]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  if (!enabled) return null;

  function goToPatientsList() {
    setOpen(false);
    router.push("/patients");
  }

  return (
    <div ref={rootRef} className={cn("relative min-w-0 flex-1", className)}>
      <label className="sr-only" htmlFor={inputId}>
        Search patients
      </label>
      <div className="group/search relative">
        <Icon
          icon={faMagnifyingGlass}
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within/search:text-primary"
        />
        <input
          id={inputId}
          type="search"
          role="combobox"
          aria-expanded={open && (results.length > 0 || query.trim().length >= 2)}
          aria-controls={listId}
          aria-autocomplete="list"
          enterKeyHint="search"
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              return;
            }
            if (event.key === "Enter") {
              event.preventDefault();
              if (results[0]) {
                setOpen(false);
                router.push(`/patients/${results[0].id}`);
                return;
              }
              goToPatientsList();
            }
          }}
          className={cn(
            "h-10 w-full rounded-full border border-border/80 bg-white pl-9 pr-4 text-sm text-ink shadow-none",
            "placeholder:text-muted-foreground/70",
            "transition-[border-color,box-shadow] duration-150",
            "hover:border-border",
            "focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-primary/55 focus-visible:outline-none",
            "[&::-webkit-search-cancel-button]:hidden"
          )}
        />
      </div>

      {open && query.trim().length >= 2 ? (
        <div
          id={listId}
          role="listbox"
          className="absolute top-[calc(100%+0.4rem)] left-0 z-50 w-full min-w-[18rem] overflow-hidden rounded-lg border border-border bg-white shadow-md"
        >
          {pending && results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">Searching…</p>
          ) : results.length === 0 ? (
            <div className="flex items-start gap-2.5 px-3 py-3">
              <Icon icon={faUsers} className="mt-0.5 size-3.5 text-muted-foreground" aria-hidden />
              <div>
                <p className="text-sm text-ink">No patients found</p>
                <Link
                  href="/patients"
                  className="mt-1 inline-block text-sm font-medium text-primary hover:underline"
                  onClick={() => setOpen(false)}
                >
                  Open patient list
                </Link>
              </div>
            </div>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {results.map((patient) => (
                <li key={patient.id} role="option">
                  <Link
                    href={`/patients/${patient.id}`}
                    className="flex flex-col gap-0.5 px-3 py-2.5 transition-colors hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none"
                    onClick={() => setOpen(false)}
                  >
                    <span className="truncate text-sm font-medium text-ink">
                      {patient.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {[patient.mrn ? `MRN ${patient.mrn}` : null, formatPhone(patient.phone)]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </Link>
                </li>
              ))}
              <li className="border-t border-border">
                <Link
                  href="/patients"
                  className="block px-3 py-2.5 text-sm font-medium text-primary hover:bg-surface-muted"
                  onClick={() => setOpen(false)}
                >
                  View all patients
                </Link>
              </li>
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

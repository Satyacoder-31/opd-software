"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import type { Patient } from "@prisma/client";
import { searchPatients, countPatients } from "@/actions/patients";
import { createAppointment } from "@/actions/appointments";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { formatPhone } from "@/lib/utils";
import { formatPatientAge } from "@/lib/date-utils";
import { usePendingAction } from "@/hooks/usePendingAction";
import { PATIENT_PAGE_SIZE } from "@/lib/constants";

type PatientTableProps = {
  initialPatients: Patient[];
  initialTotal: number;
  initialQueuedPatientIds?: string[];
};

export function PatientTable({
  initialPatients,
  initialTotal,
  initialQueuedPatientIds = [],
}: PatientTableProps) {
  const [patients, setPatients] = useState(initialPatients);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(initialTotal);
  const [queuedPatientIds, setQueuedPatientIds] = useState(
    () => new Set(initialQueuedPatientIds)
  );
  const [searching, startSearch] = useTransition();
  const { isPending: isQueuePending, run: runQueueAction } = usePendingAction<string>();
  const [queueMsg, setQueueMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const skipInitialSearch = useRef(true);

  useEffect(() => {
    setPatients(initialPatients);
    setTotal(initialTotal);
    setSkip(0);
  }, [initialPatients, initialTotal]);

  useEffect(() => {
    setQueuedPatientIds(new Set(initialQueuedPatientIds));
  }, [initialQueuedPatientIds]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const runSearch = useCallback(
    (q: string, nextSkip: number, append: boolean) => {
      startSearch(async () => {
        const [results, count] = await Promise.all([
          searchPatients(q, nextSkip, PATIENT_PAGE_SIZE),
          countPatients(q),
        ]);
        setTotal(count);
        setSkip(nextSkip);
        setPatients((prev) => (append ? [...prev, ...results] : results));
      });
    },
    []
  );

  useEffect(() => {
    if (skipInitialSearch.current && debouncedQuery === "") {
      skipInitialSearch.current = false;
      return;
    }

    runSearch(debouncedQuery, 0, false);
  }, [debouncedQuery, runSearch]);

  function handleLoadMore() {
    const nextSkip = skip + PATIENT_PAGE_SIZE;
    setLoadingMore(true);
    startSearch(async () => {
      const results = await searchPatients(debouncedQuery, nextSkip, PATIENT_PAGE_SIZE);
      setPatients((prev) => [...prev, ...results]);
      setSkip(nextSkip);
      setLoadingMore(false);
    });
  }

  function handleAddToQueue(patientId: string) {
    setQueueMsg(null);
    void runQueueAction(async () => {
      const result = await createAppointment(patientId);
      if (!result.success) {
        setQueueMsg({ type: "error", text: result.error });
        return;
      }
      setQueuedPatientIds((prev) => new Set(prev).add(patientId));
      setQueueMsg({
        type: "success",
        text: `Patient added to queue as token #${result.data.tokenNumber}.`,
      });
    }, patientId);
  }

  const hasMore = patients.length < total;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 px-5">
        <Input
          label="Search by name, phone, or MRN"
          name="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Start typing…"
        />

        {searching && patients.length === 0 && (
          <p className="text-sm text-muted-foreground">Loading patients…</p>
        )}

        {queueMsg && (
          <Banner variant={queueMsg.type === "success" ? "success" : "error"}>
            {queueMsg.text}
          </Banner>
        )}
      </div>

      {patients.length === 0 && !searching ? (
        <p className="px-5 pb-5 py-8 text-center text-muted-foreground">
          No patients found.{" "}
          <Link href="/patients/new" className="text-primary hover:underline">
            Register your first patient
          </Link>
        </p>
      ) : (
        <>
          <div className="overflow-x-auto border-t border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">MRN</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Phone</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Age</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 font-mono text-xs">{patient.mrn}</td>
                    <td className="px-4 py-3 font-medium">{patient.name}</td>
                    <td className="px-4 py-3">{formatPhone(patient.phone)}</td>
                    <td className="px-4 py-3">{formatPatientAge(patient) ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/patients/${patient.id}`}
                          className="text-primary hover:underline"
                        >
                          View
                        </Link>
                        <Link
                          href={`/patients/${patient.id}`}
                          className="text-primary hover:underline"
                        >
                          Schedule
                        </Link>
                        {queuedPatientIds.has(patient.id) ? (
                          <span className="text-muted-foreground">In queue</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddToQueue(patient.id)}
                            disabled={isQueuePending(patient.id)}
                            className="inline-flex items-center gap-1.5 text-primary hover:underline disabled:opacity-50"
                            aria-busy={isQueuePending(patient.id) || undefined}
                          >
                            {isQueuePending(patient.id) && (
                              <span
                                className="inline-block size-3 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
                                aria-hidden
                              />
                            )}
                            Add to queue
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="flex justify-center px-5 pb-5">
              <Button
                type="button"
                variant="secondary"
                onClick={handleLoadMore}
                loading={loadingMore}
              >
                Load more ({patients.length} of {total})
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import Link from "next/link";
import type { Patient } from "@prisma/client";
import {
  faListOl,
  faUsers,
  faMagnifyingGlass,
  faArrowRight,
  faTriangleExclamation,
  faPhone,
  faCalendarCheck,
  faUserCheck,
} from "@fortawesome/free-solid-svg-icons";
import { searchPatients } from "@/actions/patients";
import { createAppointment } from "@/actions/appointments";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { formatPhone, cn } from "@/lib/utils";
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
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(initialTotal);
  const [searchQuery, setSearchQuery] = useState("");
  const [queuedPatientIds, setQueuedPatientIds] = useState(
    () => new Set(initialQueuedPatientIds)
  );
  const [loadingMore, startLoadMore] = useTransition();
  const [searching, startSearch] = useTransition();
  const { isPending: isQueuePending, run: runQueueAction } =
    usePendingAction<string>();
  const [queueMsg, setQueueMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setPatients(initialPatients);
    setTotal(initialTotal);
    setSkip(0);
  }, [initialPatients, initialTotal]);

  useEffect(() => {
    setQueuedPatientIds(new Set(initialQueuedPatientIds));
  }, [initialQueuedPatientIds]);

  function handleSearch(query: string) {
    setSearchQuery(query);
    startSearch(async () => {
      const results = await searchPatients(query, 0, PATIENT_PAGE_SIZE);
      setPatients(results);
      setSkip(0);
    });
  }

  function handleLoadMore() {
    if (loadingMore) return;
    const nextSkip = skip + PATIENT_PAGE_SIZE;
    startLoadMore(async () => {
      const results = await searchPatients(searchQuery, nextSkip, PATIENT_PAGE_SIZE);
      setPatients((prev) => [...prev, ...results]);
      setSkip(nextSkip);
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
        text: `Patient added to queue as Token #${result.data.tokenNumber}.`,
      });
    }, patientId);
  }

  const hasMore = patients.length < total;

  if (patients.length === 0 && !searchQuery) {
    return (
      <EmptyState
        icon={faUsers}
        title="No patients registered yet"
        description={
          <>
            Register your first patient to start managing appointments and queue visits.{" "}
            <Link href="/patients/new" className="text-primary font-semibold hover:underline">
              Register patient
            </Link>
          </>
        }
        className="px-4 py-12"
      />
    );
  }

  return (
    <div className="flex flex-col">
      {/* Search and Filters Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 sm:px-6 md:px-8 border-b border-border bg-card">
        <div className="relative w-full sm:max-w-md">
          <Icon
            icon={faMagnifyingGlass}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-3.5"
          />
          <input
            type="text"
            placeholder="Search patient name, phone, or MRN..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-xs font-medium text-ink focus:border-primary focus:outline-hidden"
          />
          {searching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 size-3 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          )}
        </div>

        <div className="text-xs text-muted-foreground self-start sm:self-center">
          Showing <strong className="text-ink">{patients.length}</strong> of{" "}
          <strong className="text-ink">{total}</strong> registered patients
        </div>
      </div>

      {queueMsg ? (
        <div className="px-4 pt-3 sm:px-6 md:px-8">
          <Banner variant={queueMsg.type === "success" ? "success" : "error"}>
            {queueMsg.text}
          </Banner>
        </div>
      ) : null}

      {/* Patient Directory Table */}
      <div className="overflow-x-auto">
        <table className="w-full whitespace-nowrap text-xs text-left">
          <thead className="bg-surface-muted text-muted-foreground font-semibold border-b border-border">
            <tr>
              <th className="px-5 py-3">Patient Name & Demographics</th>
              <th className="px-4 py-3">UHID / MRN</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Safety Alerts</th>
              <th className="px-4 py-3">Queue Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {patients.map((patient) => {
              const inQueue = queuedPatientIds.has(patient.id);
              const isPending = isQueuePending(patient.id);

              return (
                <tr
                  key={patient.id}
                  className="hover:bg-sky-50/25 transition-colors group"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-sky-50 font-bold text-sky-800 text-xs shadow-2xs border border-sky-200/60">
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <Link
                          href={`/patients/${patient.id}`}
                          className="font-bold text-ink text-sm hover:text-primary transition-colors block"
                        >
                          {patient.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                          {patient.gender && (
                            <span className="capitalize">{patient.gender}</span>
                          )}
                          {patient.gender && patient.age != null && <span>·</span>}
                          {formatPatientAge(patient) && (
                            <span>{formatPatientAge(patient)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs font-semibold rounded-md bg-slate-100 px-2 py-0.5 text-slate-800 border border-slate-200/60">
                      {patient.mrn}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-slate-700">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Icon icon={faPhone} className="text-slate-400 size-3" />
                      <span>{formatPhone(patient.phone)}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    {patient.allergies ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                        <Icon icon={faTriangleExclamation} className="size-3 text-rose-600" />
                        {patient.allergies}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">No alerts</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5">
                    {inQueue ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                        <Icon icon={faUserCheck} className="size-3 text-emerald-600" />
                        Active in Queue
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">Not queued</span>
                    )}
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-2">
                      {!inQueue ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAddToQueue(patient.id)}
                          loading={isPending}
                        >
                          <Icon icon={faListOl} data-icon="inline-start" />
                          Add to Queue
                        </Button>
                      ) : null}

                      <Link href={`/patients/${patient.id}`}>
                        <Button size="sm" variant="ghost">
                          <span>View Profile</span>
                          <Icon icon={faArrowRight} data-icon="inline-end" />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasMore ? (
        <div className="flex justify-center px-4 py-5 border-t border-border bg-card sm:px-6 md:px-8">
          <Button
            type="button"
            variant="secondary"
            onClick={handleLoadMore}
            loading={loadingMore}
          >
            Load more patients ({patients.length} of {total})
          </Button>
        </div>
      ) : null}
    </div>
  );
}

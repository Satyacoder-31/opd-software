"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import type { Patient } from "@prisma/client";
import { faListOl, faUsers } from "@fortawesome/free-solid-svg-icons";
import { searchPatients } from "@/actions/patients";
import { createAppointment } from "@/actions/appointments";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
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
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(initialTotal);
  const [queuedPatientIds, setQueuedPatientIds] = useState(
    () => new Set(initialQueuedPatientIds)
  );
  const [loadingMore, startLoadMore] = useTransition();
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

  function handleLoadMore() {
    if (loadingMore) return;
    const nextSkip = skip + PATIENT_PAGE_SIZE;
    startLoadMore(async () => {
      const results = await searchPatients("", nextSkip, PATIENT_PAGE_SIZE);
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
        text: `Patient added to queue as token #${result.data.tokenNumber}.`,
      });
    }, patientId);
  }

  const hasMore = patients.length < total;

  if (patients.length === 0) {
    return (
      <EmptyState
        icon={faUsers}
        title="No patients yet"
        description={
          <>
            Register your first patient to start managing visits.{" "}
            <Link href="/patients/new">Register patient</Link>
          </>
        }
        className="px-4 pb-5 sm:px-6 md:px-8"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {queueMsg ? (
        <div className="px-4 pt-1 sm:px-6 md:px-8">
          <Banner variant={queueMsg.type === "success" ? "success" : "error"}>
            {queueMsg.text}
          </Banner>
        </div>
      ) : null}

      <div className="overflow-x-auto border-t border-border">
        <table className="w-full whitespace-nowrap text-sm">
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
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <Link
                      href={`/patients/${patient.id}`}
                      className="text-primary underline-offset-4 transition-[color,opacity] duration-150 hover:underline active:opacity-70"
                    >
                      View
                    </Link>
                    {queuedPatientIds.has(patient.id) ? (
                      <span className="text-muted-foreground">In queue</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddToQueue(patient.id)}
                        disabled={isQueuePending(patient.id)}
                        className="inline-flex shrink-0 items-center gap-1.5 text-primary underline-offset-4 transition-[color,opacity] duration-150 hover:underline active:opacity-70 disabled:opacity-50"
                        aria-busy={isQueuePending(patient.id) || undefined}
                      >
                        {isQueuePending(patient.id) && (
                          <span
                            className="inline-block size-3 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
                            aria-hidden
                          />
                        )}
                        <Icon icon={faListOl} className="size-3.5" aria-hidden />
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

      {hasMore ? (
        <div className="flex justify-center px-4 pb-5 sm:px-6 md:px-8">
          <Button
            type="button"
            variant="secondary"
            onClick={handleLoadMore}
            loading={loadingMore}
          >
            Load more ({patients.length} of {total})
          </Button>
        </div>
      ) : null}
    </div>
  );
}

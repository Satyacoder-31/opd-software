"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Patient } from "@prisma/client";
import {
  faCalendarXmark,
  faFilePrescription,
  faFlaskVial,
  faNotesMedical,
  faPrint,
  faXRay,
} from "@fortawesome/free-solid-svg-icons";
import { PatientProfile } from "@/components/patients/PatientProfile";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { Medicine } from "@/lib/types";
import { cn } from "@/lib/utils";

type VisitAppointment = {
  id: string;
  tokenNumber: number;
  createdAt: Date;
  status: string;
  consultation: {
    id: string;
    diagnosis: string | null;
    doctor?: { name: string } | null;
    prescription: {
      id: string;
      medicines?: unknown;
      advice?: string | null;
      followUp?: string | null;
      createdAt?: Date;
    } | null;
    invoice: { id: string } | null;
    investigationResults?: unknown;
  } | null;
};

type LabOrderItemData = {
  id: string;
  status: string;
  resultValue?: string | null;
  resultUnit?: string | null;
  resultNotes?: string | null;
  resultedAt?: Date | null;
  labTest: {
    id: string;
    name: string;
    code?: string | null;
    sampleType?: string | null;
  };
  resultedBy?: { name: string } | null;
};

type LabOrderData = {
  id: string;
  status: string;
  createdAt: Date;
  notes?: string | null;
  orderedBy?: { name: string } | null;
  consultation?: {
    id: string;
    createdAt: Date;
    doctor?: { name: string } | null;
    appointment?: { tokenNumber: number } | null;
  } | null;
  items: LabOrderItemData[];
};

type PatientDetailTabsProps = {
  patient: Patient;
  appointments: VisitAppointment[];
  labOrders?: LabOrderData[];
};

export function PatientDetailTabs({
  patient,
  appointments,
  labOrders = [],
}: PatientDetailTabsProps) {
  const prescriptions = useMemo(() => {
    return appointments
      .filter((appt) => appt.consultation?.prescription)
      .map((appt) => {
        const c = appt.consultation!;
        const p = c.prescription!;
        return {
          id: p.id,
          consultationId: c.id,
          date: p.createdAt ?? appt.createdAt,
          doctorName: c.doctor?.name ?? "Attending Doctor",
          diagnosis: c.diagnosis,
          medicines: (Array.isArray(p.medicines) ? p.medicines : []) as Medicine[],
          advice: p.advice,
          followUp: p.followUp,
          tokenNumber: appt.tokenNumber,
        };
      });
  }, [appointments]);

  const allLabResults = useMemo(() => {
    const results: Array<{
      id: string;
      orderId: string;
      testName: string;
      sampleType?: string | null;
      status: string;
      resultValue?: string | null;
      resultUnit?: string | null;
      resultNotes?: string | null;
      resultedAt?: Date | null;
      orderedAt: Date;
      doctorName: string;
      tokenNumber?: number;
    }> = [];

    for (const order of labOrders) {
      const docName =
        order.orderedBy?.name ??
        order.consultation?.doctor?.name ??
        "Attending Doctor";
      const token = order.consultation?.appointment?.tokenNumber;
      for (const item of order.items) {
        if (item.resultValue != null || item.status === "resulted") {
          results.push({
            id: item.id,
            orderId: order.id,
            testName: item.labTest.name,
            sampleType: item.labTest.sampleType,
            status: item.status,
            resultValue: item.resultValue,
            resultUnit: item.resultUnit,
            resultNotes: item.resultNotes,
            resultedAt: item.resultedAt,
            orderedAt: order.createdAt,
            doctorName: docName,
            tokenNumber: token,
          });
        }
      }
    }
    return results;
  }, [labOrders]);

  const clinicalInvestigations = useMemo(() => {
    return appointments
      .filter((appt) => {
        const inv = appt.consultation?.investigationResults as {
          labs?: string | null;
          imaging?: string | null;
          other?: string | null;
        } | null;
        return (
          inv &&
          (Boolean(inv.labs?.trim()) ||
            Boolean(inv.imaging?.trim()) ||
            Boolean(inv.other?.trim()))
        );
      })
      .map((appt) => {
        const c = appt.consultation!;
        const inv = c.investigationResults as {
          labs?: string | null;
          imaging?: string | null;
          other?: string | null;
        } | null;
        return {
          id: c.id,
          date: appt.createdAt,
          tokenNumber: appt.tokenNumber,
          doctorName: c.doctor?.name ?? "Attending Doctor",
          diagnosis: c.diagnosis,
          labs: inv?.labs ?? null,
          imaging: inv?.imaging ?? null,
          other: inv?.other ?? null,
        };
      });
  }, [appointments]);

  const totalInvCount =
    allLabResults.length + labOrders.length + clinicalInvestigations.length;

  return (
    <div className="border-y border-border bg-card">
      <Tabs defaultValue="information" className="gap-0">
        <div className="border-b border-border px-3 py-2 md:px-4">
          <TabsList
            variant="line"
            className="h-auto w-full justify-start gap-1 sm:w-fit"
          >
            <TabsTrigger
              value="information"
              className="min-h-10 flex-1 px-3 sm:flex-none"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="min-h-10 flex-1 px-3 sm:flex-none"
            >
              Visits
              {appointments.length > 0 ? (
                <span className="text-muted-foreground">
                  ({appointments.length})
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger
              value="prescriptions"
              className="min-h-10 flex-1 px-3 sm:flex-none"
            >
              Prescriptions
              {prescriptions.length > 0 ? (
                <span className="text-muted-foreground">
                  ({prescriptions.length})
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger
              value="investigations"
              className="min-h-10 flex-1 px-3 sm:flex-none"
            >
              Investigations & Labs
              {totalInvCount > 0 ? (
                <span className="text-muted-foreground">
                  ({totalInvCount})
                </span>
              ) : null}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Profile Tab */}
        <TabsContent value="information" className="mt-0">
          <div className="max-h-[min(70vh,40rem)] overflow-y-auto px-5 py-5">
            <PatientProfile patient={patient} />
          </div>
        </TabsContent>

        {/* Visits History Tab */}
        <TabsContent value="history" className="mt-0">
          <div className="max-h-[min(70vh,40rem)] overflow-y-auto px-5 py-5">
            {appointments.length === 0 ? (
              <EmptyState
                icon={faCalendarXmark}
                title="No visits recorded yet"
                description="Queue or schedule a visit to start their history."
                compact
              />
            ) : (
              <ol className="flex flex-col gap-4">
                {appointments.map((appt) => (
                  <li
                    key={appt.id}
                    className="border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-ink">
                        Token #{appt.tokenNumber} ·{" "}
                        {new Date(appt.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <StatusBadge status={appt.status} />
                    </div>
                    {appt.consultation ? (
                      <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
                        {appt.consultation.diagnosis ? (
                          <p>
                            Diagnosis:{" "}
                            <span className="font-medium text-ink">
                              {appt.consultation.diagnosis}
                            </span>
                          </p>
                        ) : null}
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          {appt.consultation.prescription ? (
                            <Link
                              href={`/consultations/${appt.consultation.id}`}
                              className="text-primary underline-offset-4 transition-[color,opacity] duration-150 hover:underline active:opacity-70"
                            >
                              View prescription
                            </Link>
                          ) : null}
                          {appt.consultation.invoice ? (
                            <Link
                              href={`/billing/${appt.consultation.id}`}
                              className="text-primary underline-offset-4 transition-[color,opacity] duration-150 hover:underline active:opacity-70"
                            >
                              View bill
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </TabsContent>

        {/* Prescriptions Tab */}
        <TabsContent value="prescriptions" className="mt-0">
          <div className="max-h-[min(70vh,40rem)] overflow-y-auto px-5 py-5">
            {prescriptions.length === 0 ? (
              <EmptyState
                icon={faFilePrescription}
                title="No prescriptions recorded"
                description="Prescriptions issued during consultations will be archived here."
                compact
              />
            ) : (
              <div className="space-y-4">
                {prescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    className="rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-ink">
                            {new Date(rx.date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            (Token #{rx.tokenNumber})
                          </span>
                          <span className="text-xs text-muted-foreground">
                            · Dr. {rx.doctorName}
                          </span>
                        </div>
                        {rx.diagnosis && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Diagnosis:{" "}
                            <span className="font-medium text-ink">
                              {rx.diagnosis}
                            </span>
                          </p>
                        )}
                      </div>

                      <Link
                        href={`/consultations/${rx.consultationId}`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-ink hover:border-primary hover:text-primary transition-colors"
                      >
                        <Icon icon={faPrint} className="size-3" />
                        <span>View / Print PDF</span>
                      </Link>
                    </div>

                    {/* Medicines List */}
                    <div className="mt-3">
                      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Prescribed Medicines ({rx.medicines.length}):
                      </h4>
                      <ul className="mt-2 divide-y divide-border/50 rounded-md border border-border/60 bg-muted/20">
                        {rx.medicines.map((med, mIdx) => (
                          <li
                            key={mIdx}
                            className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2 text-xs"
                          >
                            <div>
                              <span className="font-medium text-ink">
                                {med.name}
                              </span>
                              {med.dosage && (
                                <span className="ml-1.5 rounded-sm bg-primary/10 px-1.5 py-0.2 font-medium text-primary">
                                  {med.dosage}
                                </span>
                              )}
                              {med.route && (
                                <span className="ml-1 text-muted-foreground">
                                  ({med.route})
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
                              {med.frequency && <span>Freq: {med.frequency}</span>}
                              {med.duration && <span>· Duration: {med.duration}</span>}
                              {med.instructions && (
                                <span className="italic">· {med.instructions}</span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Advice and follow-up */}
                    {(rx.advice || rx.followUp) && (
                      <div className="mt-3 rounded-md bg-muted/30 p-2.5 text-xs text-muted-foreground">
                        {rx.advice && (
                          <div className="flex items-start gap-1.5">
                            <Icon icon={faNotesMedical} className="mt-0.5 size-3 shrink-0 text-primary" />
                            <div>
                              <span className="font-medium text-ink">Advice: </span>
                              <span>{rx.advice}</span>
                            </div>
                          </div>
                        )}
                        {rx.followUp && (
                          <p className="mt-1 pl-4.5">
                            <span className="font-medium text-ink">Follow-up: </span>
                            <span>{rx.followUp}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Investigations & Labs History Tab */}
        <TabsContent value="investigations" className="mt-0">
          <div className="max-h-[min(70vh,40rem)] overflow-y-auto px-5 py-5 space-y-6">
            {/* Lab Results section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Icon icon={faFlaskVial} className="size-4 text-sky-600" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-ink">
                  Laboratory Test Results ({allLabResults.length})
                </h3>
              </div>
              {allLabResults.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  No laboratory results reported yet for this patient.
                </div>
              ) : (
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {allLabResults.map((res) => (
                    <div
                      key={res.id}
                      className="rounded-lg border border-border bg-card p-3 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-ink line-clamp-1">
                          {res.testName}
                        </span>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-semibold capitalize",
                            res.status === "resulted"
                              ? "bg-emerald-500/10 text-emerald-700"
                              : "bg-sky-500/10 text-sky-700"
                          )}
                        >
                          {res.status}
                        </span>
                      </div>
                      <div className="my-2 rounded bg-muted/40 px-2 py-1">
                        <span className="text-base font-bold text-ink">
                          {res.resultValue ?? "—"}
                        </span>
                        {res.resultUnit && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            {res.resultUnit}
                          </span>
                        )}
                        {res.resultNotes && (
                          <p className="text-[11px] text-muted-foreground italic mt-0.5">
                            {res.resultNotes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/60 pt-1.5">
                        <span>
                          {new Date(res.resultedAt ?? res.orderedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span>Dr. {res.doctorName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Advised Investigations & Orders section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Icon icon={faFlaskVial} className="size-4 text-violet-600" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-ink">
                  Advised Investigation Orders ({labOrders.length})
                </h3>
              </div>
              {labOrders.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  No investigation orders placed for this patient.
                </div>
              ) : (
                <div className="space-y-3">
                  {labOrders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-lg border border-border bg-card p-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between border-b border-border/60 pb-2 text-xs">
                        <div>
                          <strong className="text-ink">
                            {new Date(order.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </strong>
                          {order.consultation?.appointment?.tokenNumber && (
                            <span className="ml-1.5 text-muted-foreground">
                              · Token #{order.consultation.appointment.tokenNumber}
                            </span>
                          )}
                          <span className="ml-1.5 text-muted-foreground">
                            · Ordered by {order.orderedBy?.name ?? order.consultation?.doctor?.name ?? "Attending Doctor"}
                          </span>
                        </div>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold capitalize text-primary">
                          {order.status}
                        </span>
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {order.items.map((item) => (
                          <span
                            key={item.id}
                            className="inline-flex items-center gap-1 rounded border border-border bg-muted/30 px-2 py-1 text-xs"
                          >
                            <span className="font-medium text-ink">{item.labTest.name}</span>
                            {item.resultValue ? (
                              <span className="font-semibold text-emerald-600">
                                ({item.resultValue} {item.resultUnit ?? ""})
                              </span>
                            ) : (
                              <span className="text-[10px] capitalize text-muted-foreground">
                                [{item.status}]
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clinical Investigation Findings section */}
            {clinicalInvestigations.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Icon icon={faXRay} className="size-4 text-teal-600" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-ink">
                    Clinical Investigation Notes from Past Visits ({clinicalInvestigations.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {clinicalInvestigations.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border bg-card p-3 shadow-xs text-xs"
                    >
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <strong className="text-ink">
                          Visit on {new Date(item.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </strong>
                        <span className="text-muted-foreground">
                          Dr. {item.doctorName} {item.diagnosis ? `· ${item.diagnosis}` : ""}
                        </span>
                      </div>
                      <div className="mt-2.5 space-y-2">
                        {item.labs && (
                          <div className="rounded bg-sky-500/10 p-2 text-sky-900 dark:text-sky-200">
                            <strong>Lab findings:</strong> {item.labs}
                          </div>
                        )}
                        {item.imaging && (
                          <div className="rounded bg-violet-500/10 p-2 text-violet-900 dark:text-violet-200">
                            <strong>Imaging:</strong> {item.imaging}
                          </div>
                        )}
                        {item.other && (
                          <div className="rounded bg-teal-500/10 p-2 text-teal-900 dark:text-teal-200">
                            <strong>Other findings:</strong> {item.other}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Patient } from "@prisma/client";
import {
  faCalendarXmark,
  faFilePrescription,
  faPrint,
  faNotesMedical,
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
  } | null;
};

type PatientDetailTabsProps = {
  patient: Patient;
  appointments: VisitAppointment[];
};

export function PatientDetailTabs({
  patient,
  appointments,
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
      </Tabs>
    </div>
  );
}

"use client";

import Link from "next/link";
import type { Patient } from "@prisma/client";
import { faCalendarXmark } from "@fortawesome/free-solid-svg-icons";
import { PatientProfile } from "@/components/patients/PatientProfile";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type VisitAppointment = {
  id: string;
  tokenNumber: number;
  createdAt: Date;
  status: string;
  consultation: {
    id: string;
    diagnosis: string | null;
    prescription: { id: string } | null;
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
          </TabsList>
        </div>

        <TabsContent value="information" className="mt-0">
          <div className="max-h-[min(70vh,40rem)] overflow-y-auto px-5 py-5">
            <PatientProfile patient={patient} />
          </div>
        </TabsContent>

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
                      <span className="font-medium">
                        Token #{appt.tokenNumber} ·{" "}
                        {new Date(appt.createdAt).toLocaleDateString("en-IN")}
                      </span>
                      <StatusBadge status={appt.status} />
                    </div>
                    {appt.consultation ? (
                      <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
                        {appt.consultation.diagnosis ? (
                          <p>Diagnosis: {appt.consultation.diagnosis}</p>
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
      </Tabs>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarOffIcon } from "lucide-react";
import { getPatientHistory } from "@/actions/patients";
import { isPatientInActiveQueue } from "@/actions/appointments";
import { PatientProfile } from "@/components/patients/PatientProfile";
import { PatientDetailActions } from "@/components/patients/PatientDetailActions";
import { PatientSafetyBanner } from "@/components/patients/PatientSafetyBanner";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import { PageHeader, PageShell } from "@/components/ui/PageShell";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PatientDetailPage({ params }: Props) {
  const { id } = await params;
  const [history, alreadyInQueue] = await Promise.all([
    getPatientHistory(id),
    isPatientInActiveQueue(id),
  ]);

  if (!history) notFound();

  const { patient, appointments } = history;

  return (
    <PageShell>
      <PageHeader
        title={patient.name}
        description={`${patient.mrn} · ${patient.phone}`}
        backHref="/patients"
        backLabel="Back to patients"
      >
        <PatientDetailActions
          patientId={patient.id}
          alreadyInQueue={alreadyInQueue}
        />
        <PatientSafetyBanner
          allergies={patient.allergies}
          chronicConditions={patient.chronicConditions}
        />
      </PageHeader>

      <div className="grid border-y border-border lg:grid-cols-2 lg:divide-x lg:divide-border">
        <Card title="Patient information" flush>
          <div className="px-5 py-5">
            <PatientProfile patient={patient} />
          </div>
        </Card>

        <Card title="Visit history" flush className="border-t border-border lg:border-t-0">
          <div className="px-5 py-5">
            {appointments.length === 0 ? (
              <EmptyState
                icon={CalendarOffIcon}
                title="No visits recorded yet"
                description="Queue or schedule a visit to start their history."
                compact
              />
            ) : (
              <ol className="space-y-4">
                {appointments.map((appt) => (
                  <li
                    key={appt.id}
                    className="border-b border-border pb-4 last:border-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        Token #{appt.tokenNumber} ·{" "}
                        {new Date(appt.createdAt).toLocaleDateString("en-IN")}
                      </span>
                      <StatusBadge status={appt.status} />
                    </div>
                    {appt.consultation && (
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {appt.consultation.diagnosis && (
                          <p>Diagnosis: {appt.consultation.diagnosis}</p>
                        )}
                        {appt.consultation.prescription && (
                          <Link
                            href={`/consultations/${appt.consultation.id}`}
                            className="text-primary hover:underline"
                          >
                            View prescription
                          </Link>
                        )}
                        {appt.consultation.invoice && (
                          <Link
                            href={`/billing/${appt.consultation.id}`}
                            className="ml-3 text-primary hover:underline"
                          >
                            View bill
                          </Link>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

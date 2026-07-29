import { notFound } from "next/navigation";
import { getPatientHistory } from "@/actions/patients";
import {
  isPatientInActiveQueue,
  listClinicDoctors,
} from "@/actions/appointments";
import { PatientDetailHeader } from "@/components/patients/PatientDetailHeader";
import { PatientDetailTabs } from "@/components/patients/PatientDetailTabs";
import { PageShell } from "@/components/ui/PageShell";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PatientDetailPage({ params }: Props) {
  const { id } = await params;
  const [history, alreadyInQueue, doctors] = await Promise.all([
    getPatientHistory(id),
    isPatientInActiveQueue(id),
    listClinicDoctors(),
  ]);

  if (!history) notFound();

  const { patient, appointments } = history;

  return (
    <PageShell>
      <PatientDetailHeader
        patientId={patient.id}
        patientName={patient.name}
        alreadyInQueue={alreadyInQueue}
        doctors={doctors}
      />

      <PatientDetailTabs patient={patient} appointments={appointments} />
    </PageShell>
  );
}

import { getInitialPatients } from "@/lib/patients-data";
import { getActiveQueuePatientIds } from "@/actions/appointments";
import { PatientTable } from "@/components/patients/PatientTable";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import Link from "next/link";

export default async function PatientsPage() {
  const [{ patients, total }, queuedPatientIds] = await Promise.all([
    getInitialPatients(),
    getActiveQueuePatientIds(),
  ]);

  return (
    <PageShell>
      <PageHeader
        title="Patients"
        description="Search and manage patients for your clinic"
        actions={
          <Link href="/patients/new">
            <Button>Register patient</Button>
          </Link>
        }
      />

      <Card
        title="All patients"
        flush
        className="min-h-0 flex-1 border-y border-border"
      >
        <PatientTable
          initialPatients={patients}
          initialTotal={total}
          initialQueuedPatientIds={queuedPatientIds}
        />
      </Card>
    </PageShell>
  );
}

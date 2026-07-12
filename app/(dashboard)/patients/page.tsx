import { getInitialPatients } from "@/lib/patients-data";
import { getActiveQueuePatientIds } from "@/actions/appointments";
import { PatientTable } from "@/components/patients/PatientTable";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageShell } from "@/components/ui/PageShell";
import { UserPlusIcon } from "lucide-react";
import Link from "next/link";

export default async function PatientsPage() {
  const [{ patients, total }, queuedPatientIds] = await Promise.all([
    getInitialPatients(),
    getActiveQueuePatientIds(),
  ]);

  return (
    <PageShell>
      <Card
        title="All patients"
        flush
        headerBorder={false}
        className="min-h-0 flex-1 border-y border-border"
        actions={
          <Link href="/patients/new">
            <Button>
              <UserPlusIcon data-icon="inline-start" />
              Register patient
            </Button>
          </Link>
        }
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

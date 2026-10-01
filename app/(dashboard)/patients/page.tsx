import { faPlus, faUsers, faUserPlus, faListOl } from "@fortawesome/free-solid-svg-icons";
import { getInitialPatients } from "@/lib/patients-data";
import { getActiveQueuePatientIds } from "@/actions/appointments";
import { PatientTable } from "@/components/patients/PatientTable";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
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
        title="Patient Directory"
        description="Master registry of all registered patients, clinical profiles, and active queue check-ins"
        actions={
          <Link href="/patients/new">
            <Button>
              <Icon icon={faUserPlus} data-icon="inline-start" />
              Register new patient
            </Button>
          </Link>
        }
      />

      {/* QUICK SUMMARY METRIC STRIP */}
      <section
        aria-label="Patient metrics"
        className="border-b border-border bg-card px-4 py-4 sm:px-6 md:px-8"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 max-w-2xl">
          <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800">
              Total Registered
            </span>
            <div className="mt-1 font-display text-2xl font-bold text-ink">
              {total}
            </div>
            <span className="text-[11px] text-muted-foreground">in clinic database</span>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Active in Queue Today
            </span>
            <div className="mt-1 font-display text-2xl font-bold text-ink">
              {queuedPatientIds.length}
            </div>
            <span className="text-[11px] text-emerald-700 font-medium">waiting / in consult</span>
          </div>
        </div>
      </section>

      <div className="border-b border-border bg-card min-h-0 flex-1">
        <PatientTable
          initialPatients={patients}
          initialTotal={total}
          initialQueuedPatientIds={queuedPatientIds}
        />
      </div>
    </PageShell>
  );
}

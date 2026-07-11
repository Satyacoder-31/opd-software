"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import type { Patient } from "@prisma/client";
import { PatientForm } from "@/components/patients/PatientForm";
import { Card } from "@/components/ui/Card";
import { PageShell } from "@/components/ui/PageShell";

type EditPatientPageClientProps = {
  patient: Patient;
};

export function EditPatientPageClient({ patient }: EditPatientPageClientProps) {
  const router = useRouter();

  return (
    <PageShell>
      <Card flush className="min-h-full border-y border-border">
        <div className="border-b border-border px-5 py-4">
          <Link
            href={`/patients/${patient.id}`}
            aria-label="Back to patient"
            className="inline-flex items-center gap-1 text-ink hover:text-primary"
          >
            <ChevronLeftIcon className="size-5 shrink-0" aria-hidden />
            <h1 className="font-display text-lg font-semibold">Edit patient</h1>
          </Link>
          <p className="mt-1 pl-6 text-sm text-muted-foreground">
            {patient.name} · {patient.mrn}
          </p>
        </div>
        <div className="px-5 py-5">
          <PatientForm
            patient={patient}
            cancelHref={`/patients/${patient.id}`}
            onSuccess={() => router.push(`/patients/${patient.id}`)}
          />
        </div>
      </Card>
    </PageShell>
  );
}

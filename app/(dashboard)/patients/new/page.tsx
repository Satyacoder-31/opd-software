"use client";

import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { PatientForm } from "@/components/patients/PatientForm";
import { Card } from "@/components/ui/Card";
import { PageShell } from "@/components/ui/PageShell";

export default function NewPatientPage() {
  const router = useRouter();

  return (
    <PageShell>
      <Card flush className="min-h-full border-y border-border">
        <div className="border-b border-border px-5 py-4">
          <Link
            href="/patients"
            aria-label="Back to patients"
            className="inline-flex items-center gap-1 text-ink hover:text-primary"
          >
            <ChevronLeftIcon className="size-5 shrink-0" aria-hidden />
            <h1 className="font-display text-lg font-semibold">
              Register new patient
            </h1>
          </Link>
        </div>
        <div className="px-5 py-5">
          <PatientForm
            showQueueOption
            cancelHref="/patients"
            onSuccess={(patientId) => router.push(`/patients/${patientId}`)}
          />
        </div>
      </Card>
    </PageShell>
  );
}

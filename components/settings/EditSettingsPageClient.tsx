"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import type { Clinic } from "@prisma/client";
import { ClinicProfileForm } from "@/components/settings/ClinicProfileForm";
import { Card } from "@/components/ui/Card";
import { PageShell } from "@/components/ui/PageShell";

type EditSettingsPageClientProps = {
  clinic: Clinic;
};

export function EditSettingsPageClient({ clinic }: EditSettingsPageClientProps) {
  const router = useRouter();

  return (
    <PageShell>
      <Card flush className="min-h-full border-y border-border">
        <div className="border-b border-border px-5 py-4">
          <Link
            href="/settings"
            aria-label="Back to settings"
            className="inline-flex items-center gap-1 text-ink hover:text-primary"
          >
            <ChevronLeftIcon className="size-5 shrink-0" aria-hidden />
            <h1 className="font-display text-lg font-semibold">
              Edit clinic profile
            </h1>
          </Link>
          <p className="mt-1 pl-6 text-sm text-muted-foreground">{clinic.name}</p>
        </div>
        <div className="px-5 py-5">
          <ClinicProfileForm
            clinic={clinic}
            cancelHref="/settings"
            onSuccess={() => router.push("/settings")}
          />
        </div>
      </Card>
    </PageShell>
  );
}

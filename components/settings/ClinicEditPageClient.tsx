"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import type { Clinic } from "@prisma/client";
import { ClinicProfileForm } from "@/components/settings/ClinicProfileForm";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PageShell } from "@/components/ui/PageShell";

type ClinicEditPageClientProps = {
  clinic: Clinic;
};

export function ClinicEditPageClient({ clinic }: ClinicEditPageClientProps) {
  const router = useRouter();

  return (
    <PageShell>
      <div className="px-6 py-4 md:px-8">
        <Link
          href="/settings/clinic"
          aria-label="Back to clinic profile"
          className="inline-flex min-h-11 w-fit items-center gap-1 text-sm font-medium text-muted-foreground underline-offset-4 transition-[color,opacity,transform] duration-150 hover:text-primary hover:underline active:scale-[0.98] active:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Icon icon={faChevronLeft} className="size-4 shrink-0" aria-hidden />
          <span>Back to clinic profile</span>
        </Link>
      </div>
      <Card title="Edit Clinic Details" flush className="border-y border-border">
        <div className="px-5 py-5">
          <ClinicProfileForm
            clinic={clinic}
            cancelHref="/settings/clinic"
            onSuccess={() => {
              router.push("/settings/clinic");
              router.refresh();
            }}
          />
        </div>
      </Card>
    </PageShell>
  );
}

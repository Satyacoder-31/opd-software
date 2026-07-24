import Link from "next/link";
import { faChevronLeft, faPen } from "@fortawesome/free-solid-svg-icons";
import type { Clinic } from "@prisma/client";
import { ClinicProfile } from "@/components/settings/ClinicProfile";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PageShell } from "@/components/ui/PageShell";

type ClinicSettingsPageClientProps = {
  clinic: Clinic;
};

export function ClinicSettingsPageClient({
  clinic,
}: ClinicSettingsPageClientProps) {
  return (
    <PageShell>
      <div className="px-6 py-4 md:px-8">
        <Link
          href="/settings"
          aria-label="Back to settings"
          className="inline-flex min-h-11 w-fit items-center gap-1 text-sm font-medium text-muted-foreground underline-offset-4 transition-[color,opacity,transform] duration-150 hover:text-primary hover:underline active:scale-[0.98] active:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Icon icon={faChevronLeft} className="size-4 shrink-0" aria-hidden />
          <span>Back to settings</span>
        </Link>
      </div>
      <Card
        title="Clinic details"
        flush
        className="border-y border-border"
        actions={
          <Button
            nativeButton={false}
            render={<Link href="/settings/clinic/edit" />}
            size="sm"
          >
            <Icon icon={faPen} data-icon="inline-start" />
            Edit
          </Button>
        }
      >
        <div className="px-5 py-5">
          <ClinicProfile clinic={clinic} />
        </div>
      </Card>
    </PageShell>
  );
}

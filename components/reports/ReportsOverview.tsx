import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { REPORTS_SECTIONS } from "@/components/reports/reports-nav";
import { Icon } from "@/components/ui/Icon";
import { PageHeader, PageShell } from "@/components/ui/PageShell";

export function ReportsOverview() {
  return (
    <PageShell>
      <PageHeader
        title="Reports"
        description="Close the day, or pull records for accounting — pick one job below."
      />

      <div className="flex flex-col gap-3 px-6 pb-8 md:px-8">
        <ul className="grid gap-3 sm:grid-cols-2">
          {REPORTS_SECTIONS.map((section) => {
            return (
              <li key={section.href}>
                <Link
                  href={section.href}
                  className="group flex h-full min-h-11 flex-col gap-4 rounded-xl border border-border bg-card px-5 py-5 transition-[border-color,background-color,box-shadow,transform] duration-150 hover:border-primary/40 hover:bg-white hover:shadow-sm active:scale-[0.99] active:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon icon={section.icon} className="size-5" aria-hidden />
                    </span>
                    <span className="rounded-md bg-surface-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                      {section.when}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className="font-display text-lg font-semibold text-balance text-ink">
                        {section.label}
                      </span>
                      <Icon
                        icon={faChevronRight}
                        aria-hidden
                        className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary"
                      />
                    </span>
                    <span className="mt-1.5 block text-sm text-muted-foreground">
                      {section.description}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </PageShell>
  );
}

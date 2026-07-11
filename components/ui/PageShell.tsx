import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
};

/** Full-bleed dashboard page root — no outer max-width or padding. */
export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn("flex min-h-full flex-col", className)}>{children}</div>
  );
}

type PageHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** When set, title row becomes a back link with chevron. */
  backHref?: string;
  /** Accessible label for the back control. Defaults to "Back". */
  backLabel?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  backHref,
  backLabel = "Back",
  actions,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-end sm:justify-between md:px-8 md:py-8",
        className
      )}
    >
      <div className="min-w-0 space-y-3">
        <div>
          {backHref ? (
            <Link
              href={backHref}
              aria-label={backLabel}
              className="inline-flex items-center gap-1 text-ink hover:text-primary"
            >
              <ChevronLeftIcon className="size-5 shrink-0" aria-hidden />
              <h1 className="font-display text-lg font-semibold sm:text-2xl">
                {title}
              </h1>
            </Link>
          ) : (
            <h1 className="font-display text-2xl font-semibold text-ink">
              {title}
            </h1>
          )}
          {description ? (
            <p
              className={cn(
                "text-sm text-muted-foreground",
                backHref ? "mt-1 pl-6" : "mt-1"
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
        {children}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

type PageBodyProps = {
  children: React.ReactNode;
  className?: string;
};

/** Padded content area under the header when not using flush sections. */
export function PageBody({ children, className }: PageBodyProps) {
  return (
    <div className={cn("space-y-6 px-6 pb-6 md:px-8 md:pb-8", className)}>
      {children}
    </div>
  );
}

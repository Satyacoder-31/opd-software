import Link from "next/link";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
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
  /** When set, shows a separate back link above the title. */
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
  const trimmedBackLabel = backLabel.trim();
  const ariaBackLabel = trimmedBackLabel || "Back";
  const inlineTitleWithBack = Boolean(backHref && !trimmedBackLabel);

  return (
    <div
      className={cn(
        "flex flex-col gap-4 px-6 py-6 sm:flex-row sm:justify-between md:px-8 md:py-8",
        inlineTitleWithBack ? "sm:items-center" : "sm:items-end",
        className
      )}
    >
      <div className="min-w-0 flex flex-1 flex-col gap-3">
        <div className="flex flex-col gap-2">
          {backHref && inlineTitleWithBack ? (
            <div className="flex min-w-0 items-center gap-2">
              <Link
                href={backHref}
                aria-label={ariaBackLabel}
                className="inline-flex size-11 shrink-0 items-center justify-center text-muted-foreground transition-[color,opacity,transform] duration-150 hover:text-primary active:scale-[0.98] active:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Icon icon={faChevronLeft} className="size-4" aria-hidden />
              </Link>
              <h1 className="min-w-0 font-display text-2xl font-semibold text-balance text-ink">
                {title}
              </h1>
            </div>
          ) : (
            <>
              {backHref ? (
                <Link
                  href={backHref}
                  aria-label={ariaBackLabel}
                  className="inline-flex min-h-11 w-fit items-center gap-1 text-sm font-medium text-muted-foreground underline-offset-4 transition-[color,opacity,transform] duration-150 hover:text-primary hover:underline active:scale-[0.98] active:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Icon icon={faChevronLeft} className="size-4" aria-hidden />
                  {trimmedBackLabel ? <span>{backLabel}</span> : null}
                </Link>
              ) : null}
              <h1 className="font-display text-2xl font-semibold text-balance text-ink">
                {title}
              </h1>
            </>
          )}
          {description ? (
            <p
              className={cn(
                "text-sm text-muted-foreground",
                inlineTitleWithBack && "pl-11"
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
    <div className={cn("flex flex-col gap-6 px-6 pb-6 md:px-8 md:pb-8", className)}>
      {children}
    </div>
  );
}

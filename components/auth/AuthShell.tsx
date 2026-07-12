import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
  className?: string;
};

/** Full-bleed auth page — matches dashboard PageShell spacing. */
export function AuthShell({
  title,
  description,
  backHref,
  backLabel = "Back",
  children,
  className,
}: AuthShellProps) {
  return (
    <main className="flex min-h-screen flex-col tint-soft">
      <div
        className={cn(
          "flex min-h-screen flex-col border-y border-border bg-card",
          className
        )}
      >
        <div className="border-b border-border px-6 py-6 md:px-8 md:py-8">
          <Link href="/" aria-label="Medyx home" className="inline-block">
            <BrandLogo size="sm" priority />
          </Link>
          {backHref ? (
            <Link
              href={backHref}
              aria-label={backLabel}
              className="mt-3 inline-flex items-center gap-1 text-ink hover:text-primary"
            >
              <ChevronLeftIcon className="size-5 shrink-0" aria-hidden />
              <h1 className="font-display text-lg font-semibold sm:text-2xl">
                {title}
              </h1>
            </Link>
          ) : (
            <h1 className="font-display mt-3 text-2xl font-semibold text-ink">
              {title}
            </h1>
          )}
          {description ? (
            <p
              className={cn(
                "mt-1 text-sm text-muted-foreground",
                backHref && "pl-6"
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex-1 px-6 py-6 md:px-8 md:py-8">
          <div className="w-full max-w-lg">{children}</div>
        </div>
      </div>
    </main>
  );
}

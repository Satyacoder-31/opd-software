import Link from "next/link";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Icon } from "@/components/ui/Icon";
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
    <main id="main-content" className="flex min-h-screen flex-col tint-soft">
      <div
        className={cn(
          "flex min-h-screen flex-col border-y border-border bg-card",
          className
        )}
      >
        <div className="flex flex-col gap-3 border-b border-border px-6 py-6 md:px-8 md:py-8">
          <Link href="/" aria-label="Medyx home" className="w-fit">
            <BrandLogo size="sm" priority />
          </Link>
          <div className="flex flex-col gap-1">
            {backHref ? (
              <Link
                href={backHref}
                aria-label={backLabel}
                className="flex w-fit items-center gap-1 text-ink hover:text-primary"
              >
                <Icon icon={faChevronLeft} className="size-5" aria-hidden />
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
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        <div className="flex-1 px-6 py-6 md:px-8 md:py-8">
          <div className="w-full max-w-lg">{children}</div>
        </div>
      </div>
    </main>
  );
}

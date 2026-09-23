import Image from "next/image";
import Link from "next/link";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type AuthShellPanel = {
  src: string;
  alt: string;
  headline: string;
  subhead?: string;
};

type AuthShellProps = {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
  className?: string;
  /** Large-screen visual panel (SaaS split layout). */
  panel?: AuthShellPanel;
};

/** Full-bleed auth page — matches dashboard PageShell spacing. */
export function AuthShell({
  title,
  description,
  backHref,
  backLabel = "Back",
  children,
  className,
  panel,
}: AuthShellProps) {
  return (
    <main id="main-content" className="flex min-h-screen flex-col tint-soft">
      <div
        className={cn(
          "flex min-h-screen flex-col border-y border-border bg-card lg:flex-row",
          className
        )}
      >
        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col",
            panel && "lg:max-w-xl xl:max-w-2xl"
          )}
        >
          <div className="flex flex-col gap-3 border-b border-border px-6 py-6 md:px-8 md:py-8">
            <Link href="/" aria-label="Dr Orthos home" className="w-fit">
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
            <div className="w-full max-w-xl">{children}</div>
          </div>
        </div>

        {panel ? (
          <aside
            className="relative sticky top-0 hidden h-dvh max-h-dvh flex-1 overflow-hidden border-l border-border lg:block"
            aria-hidden
          >
            <Image
              src={panel.src}
              alt={panel.alt}
              fill
              priority
              sizes="(min-width: 1024px) 55vw, 0px"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-deep/85 via-surface-deep/35 to-surface-deep/10" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-10 xl:p-12">
              <p className="font-display text-3xl font-semibold leading-tight tracking-tight text-white xl:text-4xl">
                {panel.headline}
              </p>
              {panel.subhead ? (
                <p className="max-w-md text-sm leading-relaxed text-white/80 xl:text-base">
                  {panel.subhead}
                </p>
              ) : null}
            </div>
          </aside>
        ) : null}
      </div>
    </main>
  );
}

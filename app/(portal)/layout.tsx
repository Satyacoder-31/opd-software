import Link from "next/link";
import { getPortalSessionAccount } from "@/actions/portal";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { PortalSignOutButton } from "@/components/portal/PortalSignOutButton";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const account = await getPortalSessionAccount();

  return (
    <div className="portal-shell min-h-screen text-ink">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_#d4eaf8_0%,_#f7fafd_42%,_#ecf3f9_100%)]"
      />
      <div
        aria-hidden
        className="landing-grain pointer-events-none fixed inset-0 -z-10 opacity-60"
      />

      <header className="border-b border-border/70 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link href="/clinics" className="min-w-0 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <BrandLogo size="sm" />
            <span className="sr-only">Medyx clinics</span>
          </Link>
          <nav
            aria-label="Patient"
            className="flex flex-wrap items-center justify-end gap-1 text-sm font-medium sm:gap-2"
          >
            <Link
              href="/portal"
              className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-surface-muted hover:text-ink"
            >
              My visits
            </Link>
            {account ? (
              <div className="flex items-center gap-2 pl-1">
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {account.name || account.phone}
                </span>
                <PortalSignOutButton />
              </div>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}

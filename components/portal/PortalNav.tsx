"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PortalSignOutButton } from "@/components/portal/PortalSignOutButton";

export function PortalNav({
  accountLabel,
}: {
  accountLabel: string | null;
}) {
  const pathname = usePathname();
  const onVisits = pathname === "/portal" || pathname.startsWith("/portal/");

  const linkClass = (active: boolean) =>
    cn(
      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
      active
        ? "bg-surface-muted text-ink"
        : "text-muted-foreground hover:bg-surface-muted/70 hover:text-ink",
    );

  return (
    <nav
      aria-label="Patient"
      className="flex flex-wrap items-center justify-end gap-1 sm:gap-2"
    >
      <Link href="/portal" className={linkClass(onVisits)} aria-current={onVisits ? "page" : undefined}>
        My visits
      </Link>
      {accountLabel ? (
        <div className="flex items-center gap-2 border-l border-border/70 pl-2 sm:pl-3">
          <span className="hidden max-w-36 truncate text-xs text-muted-foreground sm:inline">
            {accountLabel}
          </span>
          <PortalSignOutButton />
        </div>
      ) : (
        <Link
          href="/portal"
          className="rounded-md bg-surface-deep px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary"
        >
          Sign in
        </Link>
      )}
    </nav>
  );
}

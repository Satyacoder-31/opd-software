"use client";

import { useEffect, useState } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { logout } from "@/actions/auth";
import type { SessionUser } from "@/lib/types";
import { can, ROLE_LABELS, type Permission } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

const navItems: {
  href: string;
  label: string;
  permission: Permission;
}[] = [
  { href: "/queue", label: "Queue", permission: "queue.read" },
  { href: "/appointments", label: "Appointments", permission: "appointments.schedule" },
  { href: "/patients", label: "Patients", permission: "patients.read" },
  { href: "/billing", label: "Billing", permission: "billing.read" },
  { href: "/reports", label: "Reports", permission: "reports.read" },
  { href: "/settings", label: "Settings", permission: "settings.access" },
];

function MobileNavItem({
  href,
  label,
  active,
  disabled,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  disabled: boolean;
  onNavigate: () => void;
}) {
  const { pending } = useLinkStatus();
  const isDisabled = disabled || pending;

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      aria-disabled={isDisabled || undefined}
      tabIndex={isDisabled ? -1 : undefined}
      onClick={(event) => {
        if (isDisabled) {
          event.preventDefault();
          return;
        }
        if (!active) onNavigate();
      }}
      className={cn(
        "relative flex shrink-0 items-center justify-center whitespace-nowrap px-4 py-3.5 text-[0.9375rem] font-medium tracking-tight transition-[color,opacity,transform] duration-150",
        "active:scale-[0.97] active:opacity-70",
        active
          ? "border-b-2 border-primary text-primary"
          : "text-muted-foreground hover:text-ink",
        isDisabled && "pointer-events-none opacity-60"
      )}
    >
      {pending && (
        <span
          className="absolute top-1.5 inline-block size-2.5 animate-spin rounded-full border-2 border-current/30 border-t-current"
          aria-hidden
        />
      )}
      {label}
    </Link>
  );
}

type MobileNavProps = {
  session: SessionUser;
  clinicName: string;
  clinicLogoUrl?: string | null;
};

export function MobileNav({ session, clinicName, clinicLogoUrl }: MobileNavProps) {
  const pathname = usePathname();
  const [navigating, setNavigating] = useState(false);
  const filtered = navItems.filter((item) => can(session, item.permission));

  useEffect(() => {
    setNavigating(false);
  }, [pathname]);

  return (
    <div className="border-b border-border">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-surface-deep px-4 py-3 md:px-6">
        <div className="min-w-0">
          <BrandLogo size="sm" inverted />
          <div className="mt-1 flex min-w-0 items-center gap-2.5">
            {clinicLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={clinicLogoUrl}
                alt=""
                className="size-9 shrink-0 rounded-lg border border-white/20 bg-white object-contain p-0.5"
              />
            ) : null}
            <div className="min-w-0">
              <p className="truncate text-xs text-white/70">{clinicName}</p>
              <p className="truncate text-xs text-white/60">
                {session.name} · {ROLE_LABELS[session.role]}
              </p>
            </div>
          </div>
        </div>
        <form action={logout} className="shrink-0">
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <Icon icon={faRightFromBracket} data-icon="inline-start" />
            Sign out
          </Button>
        </form>
      </div>

      <nav
        className="flex gap-0.5 overflow-x-auto bg-white px-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Main"
        aria-busy={navigating || undefined}
      >
        {filtered.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <MobileNavItem
              key={item.href}
              href={item.href}
              label={item.label}
              active={active}
              disabled={navigating}
              onNavigate={() => setNavigating(true)}
            />
          );
        })}
      </nav>
    </div>
  );
}

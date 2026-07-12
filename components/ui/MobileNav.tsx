"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { logout } from "@/actions/auth";
import type { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/Button";

const navItems = [
  {
    href: "/queue",
    label: "Queue",
    roles: ["admin", "doctor", "receptionist"],
  },
  {
    href: "/patients",
    label: "Patients",
    roles: ["admin", "doctor", "receptionist"],
  },
  {
    href: "/reports",
    label: "Reports",
    roles: ["admin", "receptionist"],
  },
  {
    href: "/settings",
    label: "Settings",
    roles: ["admin"],
  },
];

function MobileNavItem({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  const { pending } = useLinkStatus();

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex flex-1 items-center justify-center py-3 text-sm font-medium transition-opacity duration-150",
        "active:opacity-70",
        active
          ? "border-b-2 border-primary text-primary"
          : "text-muted-foreground",
        pending && "opacity-60"
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
};

export function MobileNav({ session, clinicName }: MobileNavProps) {
  const pathname = usePathname();
  const filtered = navItems.filter((item) =>
    item.roles.includes(session.role)
  );

  return (
    <div className="border-b border-border bg-surface-tint md:hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <BrandLogo size="sm" />
          <p className="mt-1 truncate text-xs text-muted-foreground">{clinicName}</p>
          <p className="truncate text-xs text-muted-foreground capitalize">
            {session.name} · {session.role}
          </p>
        </div>
        <form action={logout} className="shrink-0">
          <Button type="submit" variant="ghost" size="sm">
            <LogOutIcon data-icon="inline-start" />
            Sign out
          </Button>
        </form>
      </div>

      <nav className="flex" aria-label="Mobile">
        {filtered.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <MobileNavItem
              key={item.href}
              href={item.href}
              label={item.label}
              active={active}
            />
          );
        })}
      </nav>
    </div>
  );
}

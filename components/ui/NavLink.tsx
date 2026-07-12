"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavLinkProps = {
  href: string;
  label: string;
  icon?: LucideIcon;
};

function NavLinkLabel({
  label,
  icon: Icon,
}: {
  label: string;
  icon?: LucideIcon;
}) {
  const { pending } = useLinkStatus();

  return (
    <>
      {Icon ? (
        <Icon
          aria-hidden
          className={cn(
            "size-4 shrink-0 transition-opacity duration-150",
            pending && "opacity-70"
          )}
        />
      ) : null}
      <span className={cn(pending && "opacity-70")}>{label}</span>
      {pending ? (
        <span
          aria-hidden
          className="ml-auto inline-block size-3 shrink-0 animate-spin rounded-full border-2 border-current/30 border-t-current"
        />
      ) : null}
    </>
  );
}

export function NavLink({ href, label, icon }: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-[color,background-color,opacity,transform] duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        "active:scale-[0.98]",
        active
          ? "bg-primary/10 text-primary"
          : "text-ink hover:bg-surface-muted"
      )}
    >
      <NavLinkLabel label={label} icon={icon} />
    </Link>
  );
}

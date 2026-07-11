"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavLinkProps = {
  href: string;
  label: string;
};

function NavLinkLabel({ label }: { label: string }) {
  const { pending } = useLinkStatus();

  return (
    <>
      <span
        aria-hidden
        className={cn(
          "inline-block size-3 shrink-0 rounded-full border-2 border-current/30 border-t-current transition-opacity duration-150",
          pending ? "animate-spin opacity-100" : "opacity-0"
        )}
      />
      <span className={cn(pending && "opacity-70")}>{label}</span>
    </>
  );
}

export function NavLink({ href, label }: NavLinkProps) {
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
      <NavLinkLabel label={label} />
    </Link>
  );
}

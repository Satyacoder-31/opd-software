"use client";

import Link, { useLinkStatus } from "next/link";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type SettingsOverviewLinkProps = {
  href: string;
  title: string;
  icon: IconDefinition;
  className?: string;
};

function LinkTrail() {
  const { pending } = useLinkStatus();

  if (pending) {
    return (
      <span
        className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
        aria-hidden
      />
    );
  }

  return (
    <Icon
      icon={faChevronRight}
      aria-hidden
      className="size-3.5 shrink-0 text-muted-foreground/70 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary group-active:translate-x-0.5 group-active:text-primary"
    />
  );
}

export function SettingsOverviewLink({
  href,
  title,
  icon,
  className,
}: SettingsOverviewLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "font-nav group flex min-h-11 items-center gap-3 px-1 py-2.5 text-sm font-medium text-ink",
        "transition-[color,background-color,opacity,transform] duration-150",
        "hover:bg-surface-muted/60 hover:text-primary",
        "active:scale-[0.99] active:bg-surface-muted active:opacity-80 active:text-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className
      )}
    >
      <Icon
        icon={icon}
        aria-hidden
        className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary group-active:text-primary"
      />
      <span className="min-w-0 flex-1 truncate">{title}</span>
      <LinkTrail />
    </Link>
  );
}

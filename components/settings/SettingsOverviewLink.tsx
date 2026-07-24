import Link from "next/link";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type SettingsOverviewLinkProps = {
  href: string;
  title: string;
  description: string;
  icon: IconDefinition;
  className?: string;
};

export function SettingsOverviewLink({
  href,
  title,
  description,
  icon,
  className,
}: SettingsOverviewLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex min-h-11 items-start gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-[border-color,background-color,box-shadow,transform] duration-150",
        "hover:border-primary/40 hover:bg-white hover:shadow-sm",
        "active:scale-[0.99] active:bg-muted/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon icon={icon} aria-hidden className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className="font-display text-base font-semibold text-balance text-ink">
            {title}
          </span>
          <Icon
            icon={faChevronRight}
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary"
          />
        </span>
        <span className="mt-1 block text-sm text-muted-foreground">
          {description}
        </span>
      </span>
    </Link>
  );
}

"use client";

import { useId, useState } from "react";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { faCheck, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/shadcn/collapsible";
import { cn } from "@/lib/utils";

type CollapsibleSectionProps = {
  title: string;
  summary?: string;
  filled?: boolean;
  badgeText?: string;
  icon?: IconDefinition;
  iconColor?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  flush?: boolean;
  contentClassName?: string;
  /** Compact headers for dense clinical/Rx workspaces. */
  density?: "default" | "compact";
  /** Header actions outside the toggle (e.g. Remove). */
  actions?: React.ReactNode;
};

export function CollapsibleSection({
  title,
  summary,
  filled = false,
  badgeText,
  icon,
  iconColor,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  children,
  className,
  flush,
  contentClassName,
  density = "default",
  actions,
}: CollapsibleSectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const panelId = useId();
  const compact = density === "compact";

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  function handleOpenChange(next: boolean) {
    if (!isControlled) setInternalOpen(next);
    setControlledOpen?.(next);
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={handleOpenChange}
      className={cn(
        "bg-card transition-all duration-150",
        isOpen ? "overflow-visible" : "overflow-hidden",
        flush
          ? "border-b border-border/80 last:border-b-0"
          : cn(
              "rounded-xl border border-border/80 shadow-2xs mb-2.5",
              isOpen && "ring-1 ring-primary/25 border-primary/40",
            ),
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center",
          compact ? "min-h-11 gap-1 pr-2 md:pr-3" : "gap-1 pr-3",
        )}
      >
        <CollapsibleTrigger
          className={cn(
            "flex min-w-0 flex-1 items-center text-left transition-colors duration-150 hover:bg-muted/40 active:bg-muted/60",
            compact ? "min-h-11 gap-2.5 px-3 py-2 md:px-3.5" : "gap-3 px-4 py-3",
            actions && (compact ? "pr-1" : "pr-2"),
          )}
          aria-controls={panelId}
        >
          <Icon
            icon={faChevronRight}
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-90 text-primary",
            )}
            data-icon="inline-start"
          />

          {icon ? (
            <div
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-transform",
                iconColor ?? "bg-primary/10 text-primary",
              )}
            >
              <Icon icon={icon} className="size-3.5" />
            </div>
          ) : null}

          <span className="min-w-0 flex-1">
            <span
              className={cn(
                "block font-semibold text-ink tracking-tight",
                compact ? "text-xs sm:text-sm leading-tight" : "text-sm",
              )}
            >
              {title}
            </span>
            {summary && (
              <span className="block truncate text-xs text-muted-foreground mt-0.5 font-normal">
                {summary}
              </span>
            )}
          </span>

          <div className="shrink-0">
            {filled ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                <Icon icon={faCheck} className="size-2.5" />
                <span>{badgeText ?? "Complete"}</span>
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                <span>{badgeText ?? "Optional"}</span>
              </span>
            )}
          </div>
        </CollapsibleTrigger>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <CollapsibleContent
        id={panelId}
        className={cn(
          "border-t border-border/60 overflow-visible",
          flush ? "p-0" : compact ? "px-3 py-3 md:px-4" : "px-4 py-4",
          contentClassName,
        )}
      >
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

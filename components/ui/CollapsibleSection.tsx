"use client";

import { useId, useState } from "react";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/shadcn/collapsible";
import { Badge } from "@/components/ui/shadcn/badge";
import { cn } from "@/lib/utils";

type CollapsibleSectionProps = {
  title: string;
  summary?: string;
  filled?: boolean;
  defaultOpen?: boolean;
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
  defaultOpen = false,
  children,
  className,
  flush,
  contentClassName,
  density = "default",
  actions,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const compact = density === "compact";

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn(
        "bg-card",
        // Clip while collapsed; allow combobox menus to escape when open.
        open ? "overflow-visible" : "overflow-hidden",
        flush
          ? "border-b border-border last:border-b-0"
          : "rounded-lg border border-border",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center",
          compact ? "min-h-10 gap-1 pr-2 md:pr-3" : "gap-1 pr-3",
        )}
      >
        <CollapsibleTrigger
          className={cn(
            "flex min-w-0 flex-1 items-center text-left transition-[background-color,transform] duration-150 hover:bg-muted/60 active:scale-[0.995] active:bg-muted/80",
            compact ? "min-h-10 gap-2 px-3 py-2 md:px-4" : "gap-3 px-4 py-3",
            actions && (compact ? "pr-1" : "pr-2"),
          )}
          aria-controls={panelId}
        >
          <Icon
            icon={faChevronRight}
            className={cn(
              "shrink-0 text-muted-foreground transition-transform",
              compact ? "size-4" : null,
              open && "rotate-90",
            )}
            data-icon="inline-start"
          />
          <span className="min-w-0 flex-1">
            <span
              className={cn(
                "block font-medium",
                compact ? "text-sm leading-tight" : "text-sm",
              )}
            >
              {title}
            </span>
            {summary && (
              <span className="block truncate text-xs text-muted-foreground">
                {summary}
              </span>
            )}
          </span>
          <Badge
            variant={filled ? "default" : "secondary"}
            className={cn("shrink-0", compact && "px-1.5 text-[10px]")}
          >
            {filled ? "Filled" : "Empty"}
          </Badge>
        </CollapsibleTrigger>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <CollapsibleContent
        id={panelId}
        className={cn(
          "border-t border-border overflow-visible",
          flush ? "p-0" : compact ? "px-3 py-3 md:px-4" : "px-4 py-4",
          contentClassName,
        )}
      >
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

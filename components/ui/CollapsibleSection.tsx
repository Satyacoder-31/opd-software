"use client";

import { useId, useState } from "react";
import { ChevronRightIcon } from "lucide-react";
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
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn(
        "overflow-hidden bg-card",
        flush
          ? "border-b border-border last:border-b-0"
          : "rounded-lg border border-border",
        className
      )}
    >
      <CollapsibleTrigger
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60"
        aria-controls={panelId}
      >
        <ChevronRightIcon
          className={cn(
            "shrink-0 text-muted-foreground transition-transform",
            open && "rotate-90"
          )}
          data-icon="inline-start"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{title}</span>
          {summary && (
            <span className="block truncate text-xs text-muted-foreground">
              {summary}
            </span>
          )}
        </span>
        <Badge
          variant={filled ? "default" : "secondary"}
          className="shrink-0"
        >
          {filled ? "Filled" : "Empty"}
        </Badge>
      </CollapsibleTrigger>
      <CollapsibleContent
        id={panelId}
        className={cn(
          "border-t border-border",
          flush ? "p-0" : "px-4 py-4",
          contentClassName
        )}
      >
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

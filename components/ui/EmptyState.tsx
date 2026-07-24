import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { isValidElement, type ReactNode } from "react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  /** Font Awesome icon definition, or a custom icon node. */
  icon: IconDefinition | ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
};

function EmptyIcon({ icon }: { icon: IconDefinition | ReactNode }) {
  if (isValidElement(icon)) return icon;
  return <Icon icon={icon as IconDefinition} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <Empty
      className={cn(
        "border-0",
        compact ? "gap-3 p-4" : "p-8",
        className
      )}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <EmptyIcon icon={icon} />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description ? (
          <EmptyDescription>{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}

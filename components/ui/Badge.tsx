import { Badge } from "@/components/ui/shadcn/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  waiting: "border-accent/30 bg-accent/15 text-accent-foreground",
  in_progress: "border-primary/30 bg-primary/10 text-primary",
  done: "border-border bg-muted text-muted-foreground",
  cancelled: "border-destructive/30 bg-destructive/10 text-destructive",
  no_show: "border-border bg-muted text-muted-foreground",
  draft: "border-border bg-muted text-muted-foreground",
  paid: "border-primary/30 bg-primary/10 text-primary",
  void: "border-destructive/30 bg-destructive/10 text-destructive",
  unbilled: "border-accent/30 bg-accent/15 text-accent-foreground",
};

type BadgeProps = {
  status: string;
  className?: string;
};

export function StatusBadge({ status, className }: BadgeProps) {
  const label = status.replaceAll("_", " ");

  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize",
        statusStyles[status] ?? "border-border bg-muted text-muted-foreground",
        className
      )}
    >
      {label}
    </Badge>
  );
}

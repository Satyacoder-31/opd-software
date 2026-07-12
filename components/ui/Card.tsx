import {
  Card as ShadcnCard,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { cn } from "@/lib/utils";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  actions?: React.ReactNode;
  flush?: boolean;
  /** Show a bottom border under the header. Defaults to true when flush. */
  headerBorder?: boolean;
};

export function Card({
  children,
  className,
  title,
  actions,
  flush,
  headerBorder,
}: CardProps) {
  const showHeaderBorder = headerBorder ?? !!flush;

  return (
    <ShadcnCard
      className={cn(
        flush && "gap-0 rounded-none py-0 ring-0",
        !flush && "shadow-sm",
        className
      )}
    >
      {title && (
        <CardHeader
          className={cn(
            "font-display",
            flush && "px-5 py-4",
            showHeaderBorder && "border-b border-border"
          )}
        >
          <CardTitle className="font-display text-lg font-semibold">
            {title}
          </CardTitle>
          {actions ? <CardAction>{actions}</CardAction> : null}
        </CardHeader>
      )}
      <CardContent
        className={cn(flush ? "px-0! py-0!" : !title && "pt-0")}
      >
        {children}
      </CardContent>
    </ShadcnCard>
  );
}

import {
  Card as ShadcnCard,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { cn } from "@/lib/utils";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  flush?: boolean;
};

export function Card({ children, className, title, flush }: CardProps) {
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
            flush && "border-b border-border px-5 py-4"
          )}
        >
          <CardTitle className="font-display text-lg font-semibold">
            {title}
          </CardTitle>
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

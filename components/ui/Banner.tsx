import { Alert, AlertDescription } from "@/components/ui/shadcn/alert";
import { cn } from "@/lib/utils";

type BannerProps = {
  variant?: "success" | "error" | "info";
  children: React.ReactNode;
  className?: string;
};

const variants = {
  success: "border-success/30 bg-success/10 text-success [&_[data-slot=alert-description]]:text-success",
  error: "",
  info: "border-primary/30 bg-primary/10 text-primary [&_[data-slot=alert-description]]:text-primary",
};

export function Banner({
  variant = "info",
  children,
  className,
}: BannerProps) {
  if (variant === "error") {
    return (
      <Alert variant="destructive" className={className}>
        <AlertDescription>{children}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert
      role="status"
      className={cn(variants[variant], className)}
    >
      <AlertDescription className="text-inherit">{children}</AlertDescription>
    </Alert>
  );
}

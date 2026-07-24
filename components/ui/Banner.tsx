import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import { Alert, AlertDescription } from "@/components/ui/shadcn/alert";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type BannerProps = {
  variant?: "success" | "error" | "info";
  children: React.ReactNode;
  className?: string;
};

const variants = {
  success:
    "border-success/30 bg-success/10 text-success [&_[data-slot=alert-description]]:text-success",
  error: "",
  info: "border-primary/30 bg-primary/10 text-primary [&_[data-slot=alert-description]]:text-primary",
};

const icons = {
  success: faCircleCheck,
  error: faCircleExclamation,
  info: faCircleInfo,
} as const satisfies Record<NonNullable<BannerProps["variant"]>, IconDefinition>;

export function Banner({
  variant = "info",
  children,
  className,
}: BannerProps) {
  const icon = icons[variant];

  if (variant === "error") {
    return (
      <Alert variant="destructive" className={className} aria-live="assertive">
        <Icon icon={icon} />
        <AlertDescription>{children}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert
      role="status"
      aria-live="polite"
      className={cn(variants[variant], className)}
    >
      <Icon icon={icon} />
      <AlertDescription className="text-inherit">{children}</AlertDescription>
    </Alert>
  );
}

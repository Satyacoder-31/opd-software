import {
  Button as ShadcnButton,
  buttonVariants,
} from "@/components/ui/shadcn/button";
import { Spinner } from "@/components/ui/shadcn/spinner";
import { cn } from "@/lib/utils";

type ButtonProps = Omit<
  React.ComponentProps<typeof ShadcnButton>,
  "variant" | "size"
> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

const variantMap = {
  primary: "default",
  secondary: "outline",
  ghost: "ghost",
  danger: "destructive",
} as const;

const sizeMap = {
  sm: "sm",
  md: "default",
  lg: "lg",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  loading,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <ShadcnButton
      variant={variantMap[variant]}
      size={sizeMap[size]}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn("min-h-11", className)}
      {...props}
    >
      {loading && <Spinner data-icon="inline-start" />}
      {children}
    </ShadcnButton>
  );
}

export { buttonVariants };

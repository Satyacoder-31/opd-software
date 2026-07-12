import Image from "next/image";
import { cn } from "@/lib/utils";

const sizes = {
  sm: {
    width: 80,
    height: 59,
    imageClassName: "h-7 w-auto",
    textClassName: "text-base",
  },
  md: {
    width: 100,
    height: 74,
    imageClassName: "h-9 w-auto",
    textClassName: "text-lg",
  },
  lg: {
    width: 128,
    height: 95,
    imageClassName: "h-11 w-auto",
    textClassName: "text-xl",
  },
} as const;

type BrandLogoProps = {
  size?: keyof typeof sizes;
  className?: string;
  /** Use on dark backgrounds (e.g. footer). */
  inverted?: boolean;
  priority?: boolean;
};

export function BrandLogo({
  size = "md",
  className,
  inverted = false,
  priority = false,
}: BrandLogoProps) {
  const { width, height, imageClassName, textClassName } = sizes[size];

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/logo.png"
        alt=""
        width={width}
        height={height}
        priority={priority}
        aria-hidden
        className={cn(imageClassName, "object-contain object-left")}
      />
      <span
        className={cn(
          "font-display font-semibold tracking-tight",
          textClassName,
          inverted ? "text-white" : "text-primary"
        )}
      >
        Medyx
      </span>
    </span>
  );
}

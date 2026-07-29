import { cn } from "@/lib/utils";

const sizeClass = {
  xs: "size-8",
  sm: "size-10",
  md: "size-12",
  lg: "size-16",
} as const;

type ClinicLogoProps = {
  src: string | null | undefined;
  alt?: string;
  size?: keyof typeof sizeClass;
  className?: string;
};

/** Renders a clinic logo when a URL is present; otherwise nothing. */
export function ClinicLogo({
  src,
  alt = "",
  size = "md",
  className,
}: ClinicLogoProps) {
  if (!src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- arbitrary https logo URLs from clinic settings
    <img
      src={src}
      alt={alt}
      className={cn(
        sizeClass[size],
        "shrink-0 rounded-lg border border-border bg-white object-contain p-1",
        className,
      )}
    />
  );
}

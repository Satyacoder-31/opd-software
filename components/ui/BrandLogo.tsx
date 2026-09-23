import React from "react";
import { cn } from "@/lib/utils";

const sizes = {
  sm: {
    iconSize: 28,
    textClassName: "text-base font-bold tracking-tight",
    subClassName: "text-[9px] tracking-wider font-semibold",
    gap: "gap-2",
  },
  md: {
    iconSize: 36,
    textClassName: "text-lg font-bold tracking-tight",
    subClassName: "text-[10px] tracking-wider font-semibold",
    gap: "gap-2.5",
  },
  lg: {
    iconSize: 44,
    textClassName: "text-xl font-bold tracking-tight",
    subClassName: "text-[11px] tracking-widest font-semibold",
    gap: "gap-3",
  },
  xl: {
    iconSize: 56,
    textClassName: "text-2xl font-extrabold tracking-tight",
    subClassName: "text-[12px] tracking-widest font-bold",
    gap: "gap-3.5",
  },
} as const;

type BrandLogoProps = {
  size?: keyof typeof sizes;
  className?: string;
  /** Use on dark backgrounds (e.g. hero/footer). */
  inverted?: boolean;
  priority?: boolean;
  showSubtitle?: boolean;
};

export function OrthoIcon({
  size = 36,
  inverted = false,
  className,
}: {
  size?: number;
  inverted?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 transition-transform duration-200 group-hover:scale-105", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ortho-grad-primary" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor={inverted ? "#38BDF8" : "#0284C7"} />
          <stop stopColor={inverted ? "#0284C7" : "#0F2E4A"} />
        </linearGradient>
        <linearGradient id="ortho-grad-accent" x1="12" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop stopColor="#0EA5E9" />
        </linearGradient>
      </defs>

      {/* Rounded Hexagon / Shield Backdrop */}
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="12"
        fill={inverted ? "rgba(255, 255, 255, 0.1)" : "#F0F7FD"}
        stroke={inverted ? "rgba(56, 189, 248, 0.4)" : "#BAE6FD"}
        strokeWidth="1.5"
      />

      {/* Clinical Orthopedic Joint / Cross Symmetry */}
      {/* Central Medical Cross with subtle bone articulation curves */}
      <path
        d="M24 10V38M10 24H38"
        stroke="url(#ortho-grad-primary)"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Inner Articulated Joint Arc (Precision Biomechanics Motif) */}
      <circle
        cx="24"
        cy="24"
        r="9"
        stroke="url(#ortho-grad-accent)"
        strokeWidth="2.5"
        strokeDasharray="4 3"
        strokeLinecap="round"
      />

      {/* Center Biomechanical Pivot Dot */}
      <circle cx="24" cy="24" r="3.5" fill={inverted ? "#38BDF8" : "#0284C7"} />
    </svg>
  );
}

export function BrandLogo({
  size = "md",
  className,
  inverted = false,
  showSubtitle = true,
}: BrandLogoProps) {
  const { iconSize, textClassName, subClassName, gap } = sizes[size];

  return (
    <span className={cn("group inline-flex items-center select-none", gap, className)}>
      <OrthoIcon size={iconSize} inverted={inverted} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "tracking-tight transition-colors",
            textClassName,
            inverted ? "text-white" : "text-[#0B1E33]"
          )}
        >
          Dr Orthos
        </span>
        {showSubtitle && (
          <span
            className={cn(
              "uppercase tracking-widest mt-0.5",
              subClassName,
              inverted ? "text-sky-300/80" : "text-sky-700"
            )}
          >
            Orthopedic Care
          </span>
        )}
      </span>
    </span>
  );
}

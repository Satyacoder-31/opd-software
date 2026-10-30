import React from "react";
import { cn } from "@/lib/utils";

const sizes = {
  sm: {
    iconSize: 28,
    textClassName: "text-base font-bold tracking-tight",
    subClassName: "text-[9.5px] tracking-wider font-semibold",
    gap: "gap-2",
  },
  md: {
    iconSize: 38,
    textClassName: "text-[19px] font-bold tracking-tight",
    subClassName: "text-[10.5px] tracking-wider font-semibold",
    gap: "gap-2.5",
  },
  lg: {
    iconSize: 46,
    textClassName: "text-[22px] font-bold tracking-tight",
    subClassName: "text-[11.5px] tracking-widest font-semibold",
    gap: "gap-3",
  },
  xl: {
    iconSize: 58,
    textClassName: "text-2xl sm:text-[26px] font-extrabold tracking-tight",
    subClassName: "text-[12.5px] tracking-widest font-bold",
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
          <stop stopColor={inverted ? "#C084FC" : "#7C3AED"} />
          <stop stopColor={inverted ? "#818CF8" : "#4338CA"} />
        </linearGradient>
        <linearGradient id="ortho-grad-accent" x1="12" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E879F9" />
          <stop stopColor="#6366F1" />
        </linearGradient>
      </defs>

      {/* Rounded Hexagon / Shield Backdrop */}
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="12"
        fill={inverted ? "rgba(255, 255, 255, 0.1)" : "#FAF5FF"}
        stroke={inverted ? "rgba(192, 132, 252, 0.4)" : "#DDD6FE"}
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
      <circle cx="24" cy="24" r="3.5" fill={inverted ? "#C084FC" : "#7C3AED"} />
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
            "tracking-tight transition-colors font-extrabold",
            textClassName,
            inverted
              ? "text-white"
              : "bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 bg-clip-text text-transparent"
          )}
        >
          Dr Orthos
        </span>
        {showSubtitle && (
          <span
            className={cn(
              "uppercase tracking-widest mt-0.5 font-bold",
              subClassName,
              inverted ? "text-purple-300/80" : "text-purple-600"
            )}
          >
            Hospital OPD System
          </span>
        )}
      </span>
    </span>
  );
}

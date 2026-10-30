"use client";

import { useEffect, useState } from "react";
import { faSun, faMoon, faPalette } from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "drorthos_theme";

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try {
    const val = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (val === "dark" || val === "light") return val;
  } catch {
    // ignore
  }
  return "light";
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
  }
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent("drorthos:theme-change", { detail: { theme } }));
}

interface ThemeSwitcherProps {
  className?: string;
  variant?: "header" | "pill" | "sidebar";
}

export function ThemeSwitcher({ className, variant = "header" }: ThemeSwitcherProps) {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initial = getStoredTheme();
    setTheme(initial);
    applyTheme(initial);

    function handleExternalChange(e: Event) {
      const customEvent = e as CustomEvent<{ theme: ThemeMode }>;
      if (customEvent.detail?.theme) {
        setTheme(customEvent.detail.theme);
      }
    }

    window.addEventListener("drorthos:theme-change", handleExternalChange);
    return () => window.removeEventListener("drorthos:theme-change", handleExternalChange);
  }, []);

  function handleSelect(newTheme: ThemeMode) {
    setTheme(newTheme);
    applyTheme(newTheme);
  }

  // Prevent layout jump before mount
  if (!mounted) {
    return (
      <div
        className={cn(
          "h-8 w-[140px] rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse",
          className
        )}
        aria-hidden
      />
    );
  }

  if (variant === "sidebar") {
    return (
      <div className={cn("flex flex-col gap-1.5 p-2 rounded-xl bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800", className)}>
        <div className="flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Icon icon={faPalette} className="size-3 text-purple-600 dark:text-purple-400" />
          <span>Background Theme</span>
        </div>
        <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-white/80 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-800">
          <button
            type="button"
            onClick={() => handleSelect("light")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-bold transition-all cursor-pointer",
              theme === "light"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
            title="White Background (Vivid Light Mode)"
          >
            <Icon icon={faSun} className={cn("size-3", theme === "light" ? "text-amber-300" : "text-amber-500")} />
            <span>White BG</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelect("dark")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-bold transition-all cursor-pointer",
              theme === "dark"
                ? "bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-purple-200 border border-purple-500/50 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
            title="Dark Background (Midnight Nebula Mode)"
          >
            <Icon icon={faMoon} className={cn("size-3", theme === "dark" ? "text-purple-300" : "text-indigo-400")} />
            <span>Dark BG</span>
          </button>
        </div>
      </div>
    );
  }

  // Default "header" segmented toggle
  return (
    <div
      role="group"
      aria-label="Background Theme Selector"
      className={cn(
        "inline-flex items-center rounded-xl p-0.5 border shadow-2xs transition-colors",
        "bg-slate-100/90 border-slate-200/80 dark:bg-slate-900/90 dark:border-slate-800",
        className
      )}
    >
      {/* Option 1: White Background */}
      <button
        type="button"
        onClick={() => handleSelect("light")}
        aria-pressed={theme === "light"}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all select-none cursor-pointer",
          theme === "light"
            ? "bg-white text-purple-950 shadow-xs ring-1 ring-slate-200/80 dark:ring-transparent"
            : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        )}
        title="White Background (Light Theme with vivid purple-indigo ambient gradients)"
      >
        <Icon
          icon={faSun}
          className={cn(
            "size-3 transition-transform",
            theme === "light" ? "text-amber-500 rotate-12 scale-110" : "text-slate-400"
          )}
        />
        <span className="text-[11px] font-bold tracking-tight">White BG</span>
      </button>

      {/* Option 2: Dark Background */}
      <button
        type="button"
        onClick={() => handleSelect("dark")}
        aria-pressed={theme === "dark"}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all select-none cursor-pointer",
          theme === "dark"
            ? "bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-purple-200 shadow-xs border border-purple-500/40 ring-1 ring-purple-500/30"
            : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        )}
        title="Dark Background (Midnight Theme with cosmic violet-cyan nebula gradients)"
      >
        <Icon
          icon={faMoon}
          className={cn(
            "size-3 transition-transform",
            theme === "dark" ? "text-purple-300 -rotate-12 scale-110" : "text-slate-400"
          )}
        />
        <span className="text-[11px] font-bold tracking-tight">Dark BG</span>
      </button>
    </div>
  );
}


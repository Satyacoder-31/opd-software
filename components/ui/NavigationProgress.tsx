"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavigationProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const showTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (showTimeoutRef.current != null) {
      window.clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    setActive(false);
    setVisible(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element).closest("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("mailto:")
      ) {
        return;
      }

      const targetPath = href.split(/[?#]/)[0];
      if (targetPath && targetPath !== pathname) {
        setActive(true);
        if (showTimeoutRef.current != null) {
          window.clearTimeout(showTimeoutRef.current);
        }
        showTimeoutRef.current = window.setTimeout(() => {
          setVisible(true);
          showTimeoutRef.current = null;
        }, 120);
      }
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (showTimeoutRef.current != null) {
        window.clearTimeout(showTimeoutRef.current);
      }
    };
  }, [pathname]);

  if (!active) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-primary/15 transition-opacity duration-150",
        visible ? "opacity-100" : "opacity-0"
      )}
      role="progressbar"
      aria-label="Loading page"
      aria-busy="true"
    >
      <div className="navigation-progress-bar h-full w-1/3 bg-primary" />
    </div>
  );
}

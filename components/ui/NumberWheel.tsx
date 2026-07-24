"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

const ITEM_HEIGHT = 40;
const VISIBLE_COUNT = 5;

type NumberWheelProps = {
  min: number;
  max: number;
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  suffix?: string;
};

export function NumberWheel({
  min,
  max,
  value,
  onChange,
  disabled,
  className,
  suffix,
}: NumberWheelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const suppressScrollRef = useRef(true);
  const userInteractedRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const items = useRef(
    Array.from({ length: max - min + 1 }, (_, index) => min + index)
  ).current;
  const defaultIndex = Math.min(
    items.length - 1,
    Math.max(0, Math.round(items.length / 2) - 1)
  );

  const [activeIndex, setActiveIndex] = useState(() =>
    value == null ? defaultIndex : value - min
  );

  const wheelHeight = ITEM_HEIGHT * VISIBLE_COUNT;
  const edgePad = (wheelHeight - ITEM_HEIGHT) / 2;

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "auto") => {
      const el = containerRef.current;
      if (!el) return;
      el.scrollTo({ top: index * ITEM_HEIGHT, behavior });
    },
    []
  );

  const commitIndex = useCallback(
    (index: number, fromUser = true) => {
      const clamped = Math.min(items.length - 1, Math.max(0, index));
      setActiveIndex(clamped);
      scrollToIndex(clamped, "smooth");
      if (fromUser) {
        userInteractedRef.current = true;
        onChange(items[clamped]);
      }
    },
    [items, onChange, scrollToIndex]
  );

  useEffect(() => {
    const index =
      value == null
        ? defaultIndex
        : Math.min(items.length - 1, Math.max(0, value - min));

    suppressScrollRef.current = true;
    setActiveIndex(index);
    scrollToIndex(index);

    const frame = requestAnimationFrame(() => {
      suppressScrollRef.current = false;
    });

    return () => cancelAnimationFrame(frame);
  }, [defaultIndex, items.length, min, scrollToIndex, value]);

  function handleScroll() {
    if (suppressScrollRef.current || disabled) return;

    const el = containerRef.current;
    if (!el) return;

    const index = Math.round(el.scrollTop / ITEM_HEIGHT);
    const clamped = Math.min(items.length - 1, Math.max(0, index));
    setActiveIndex(clamped);

    clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      if (clamped !== index) {
        suppressScrollRef.current = true;
        scrollToIndex(clamped, "smooth");
        requestAnimationFrame(() => {
          suppressScrollRef.current = false;
        });
      }
      if (userInteractedRef.current) {
        onChange(items[clamped]);
      }
    }, 100);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;

    if (event.key === "ArrowUp") {
      event.preventDefault();
      commitIndex(activeIndex - 1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      commitIndex(activeIndex + 1);
    }
  }

  return (
    <div
      className={cn("relative select-none", className)}
      style={{ height: wheelHeight }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-2 top-1/2 z-10 -translate-y-1/2 rounded-lg border border-primary/25 bg-primary/5"
        style={{ height: ITEM_HEIGHT }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-14 bg-linear-to-b from-background via-background/80 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-14 bg-linear-to-t from-background via-background/80 to-transparent"
      />

      <div
        ref={containerRef}
        role="listbox"
        aria-label="Select a number"
        aria-activedescendant={`number-wheel-option-${items[activeIndex]}`}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={() => {
          userInteractedRef.current = true;
        }}
        onWheel={() => {
          userInteractedRef.current = true;
        }}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        className={cn(
          "scrollbar-hide h-full overflow-y-auto scroll-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          disabled && "pointer-events-none opacity-50"
        )}
        style={{
          scrollSnapType: "y mandatory",
          paddingTop: edgePad,
          paddingBottom: edgePad,
        }}
      >
        {items.map((num, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={num}
              id={`number-wheel-option-${num}`}
              role="option"
              aria-selected={isActive}
              className={cn(
                "flex snap-center items-center justify-center text-base tabular-nums transition-[color,font-size]",
                isActive
                  ? "font-semibold text-ink"
                  : "text-muted-foreground/70"
              )}
              style={{ height: ITEM_HEIGHT }}
            >
              {num}
              {suffix && isActive ? (
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  {suffix}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

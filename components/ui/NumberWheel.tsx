"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";

const ITEM_WIDTH = 44;

type NumberWheelProps = {
  min: number;
  max: number;
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  suffix?: string;
  "aria-label"?: string;
};

export function NumberWheel({
  min,
  max,
  value,
  onChange,
  disabled,
  className,
  suffix,
  "aria-label": ariaLabel = "Select a number",
}: NumberWheelProps) {
  const rootRef = useRef<HTMLDivElement>(null);
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
  const [edgePad, setEdgePad] = useState(ITEM_WIDTH * 2);

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "auto") => {
      const el = containerRef.current;
      if (!el) return;
      el.scrollTo({ left: index * ITEM_WIDTH, behavior });
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

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const updatePad = () => {
      setEdgePad(Math.max(0, (root.clientWidth - ITEM_WIDTH) / 2));
    };

    updatePad();
    const observer = new ResizeObserver(updatePad);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

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
  }, [defaultIndex, edgePad, items.length, min, scrollToIndex, value]);

  function handleScroll() {
    if (suppressScrollRef.current || disabled) return;

    const el = containerRef.current;
    if (!el) return;

    const index = Math.round(el.scrollLeft / ITEM_WIDTH);
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

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      commitIndex(activeIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      commitIndex(activeIndex + 1);
    }
  }

  return (
    <div
      ref={rootRef}
      className={cn("relative h-11 w-full select-none", className)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-11 -translate-x-1/2 rounded-sm border border-primary/25 bg-primary/5"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-linear-to-r from-background via-background/85 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-linear-to-l from-background via-background/85 to-transparent"
      />

      <div
        ref={containerRef}
        role="listbox"
        aria-label={ariaLabel}
        aria-activedescendant={`number-wheel-option-${items[activeIndex]}`}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={() => {
          userInteractedRef.current = true;
        }}
        onWheel={(event) => {
          userInteractedRef.current = true;
          if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
            event.currentTarget.scrollLeft += event.deltaY;
          }
        }}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        className={cn(
          "scrollbar-hide h-full overflow-x-auto overflow-y-hidden scroll-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          disabled && "pointer-events-none opacity-50"
        )}
        style={{
          scrollSnapType: "x mandatory",
          paddingLeft: edgePad,
          paddingRight: edgePad,
        }}
      >
        <div className="flex h-full">
          {items.map((num, index) => {
            const isActive = index === activeIndex;
            return (
              <div
                key={num}
                id={`number-wheel-option-${num}`}
                role="option"
                aria-selected={isActive}
                className={cn(
                  "flex shrink-0 snap-center items-center justify-center text-base tabular-nums transition-[color,font-weight]",
                  isActive
                    ? "font-semibold text-ink"
                    : "text-muted-foreground/70"
                )}
                style={{ width: ITEM_WIDTH }}
              >
                {num}
                {suffix && isActive ? (
                  <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                    {suffix}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

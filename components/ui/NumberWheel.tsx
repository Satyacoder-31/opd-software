"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
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
  
  // Mouse drag support for PC users
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

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

  // Non-passive wheel event listener for PC mouse scrolling
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Prevent parent document vertical scroll when hovering over the wheel
      e.preventDefault();
      e.stopPropagation();
      userInteractedRef.current = true;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      el.scrollLeft += delta;
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

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

  // Mouse Drag to Scroll on PC
  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (disabled || !containerRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - containerRef.current.offsetLeft;
    scrollLeftRef.current = containerRef.current.scrollLeft;
    userInteractedRef.current = true;
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isDraggingRef.current || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    containerRef.current.scrollLeft = scrollLeftRef.current - walk;
  }

  function handleMouseUpOrLeave() {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      handleScroll();
    }
  }

  return (
    <div
      ref={rootRef}
      className={cn("group relative h-11 w-full select-none", className)}
    >
      {/* Center active indicator highlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-11 -translate-x-1/2 rounded-lg border border-primary/40 bg-primary/10 shadow-xs"
      />

      {/* Fade edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-background via-background/80 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-background via-background/80 to-transparent"
      />

      {/* Left scroll button for PC click navigation */}
      <button
        type="button"
        aria-label="Previous number"
        tabIndex={-1}
        disabled={disabled || activeIndex <= 0}
        onClick={(e) => {
          e.preventDefault();
          commitIndex(activeIndex - 1);
        }}
        className={cn(
          "absolute left-1 top-1/2 -translate-y-1/2 z-20 flex size-7 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-sm transition-all hover:bg-muted active:scale-95 cursor-pointer",
          (disabled || activeIndex <= 0) && "opacity-20 pointer-events-none"
        )}
        title="Scroll left (-1)"
      >
        <Icon icon={faChevronLeft} className="size-3 text-slate-700 dark:text-slate-200" />
      </button>

      {/* Right scroll button for PC click navigation */}
      <button
        type="button"
        aria-label="Next number"
        tabIndex={-1}
        disabled={disabled || activeIndex >= items.length - 1}
        onClick={(e) => {
          e.preventDefault();
          commitIndex(activeIndex + 1);
        }}
        className={cn(
          "absolute right-1 top-1/2 -translate-y-1/2 z-20 flex size-7 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-sm transition-all hover:bg-muted active:scale-95 cursor-pointer",
          (disabled || activeIndex >= items.length - 1) && "opacity-20 pointer-events-none"
        )}
        title="Scroll right (+1)"
      >
        <Icon icon={faChevronRight} className="size-3 text-slate-700 dark:text-slate-200" />
      </button>

      <div
        ref={containerRef}
        role="listbox"
        aria-label={ariaLabel}
        aria-activedescendant={`number-wheel-option-${items[activeIndex]}`}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={() => {
          userInteractedRef.current = true;
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        className={cn(
          "scrollbar-hide h-full overflow-x-auto overflow-y-hidden scroll-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 cursor-grab active:cursor-grabbing",
          disabled && "pointer-events-none opacity-50"
        )}
        style={{
          scrollSnapType: isDraggingRef.current ? "none" : "x mandatory",
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
                onClick={() => commitIndex(index)}
                className={cn(
                  "flex shrink-0 snap-center items-center justify-center text-base tabular-nums transition-all cursor-pointer",
                  isActive
                    ? "font-extrabold text-primary text-lg scale-105"
                    : "text-muted-foreground/70 hover:text-foreground hover:scale-105"
                )}
                style={{ width: ITEM_WIDTH }}
              >
                {num}
                {suffix && isActive ? (
                  <span className="ml-0.5 text-xs font-semibold text-primary/80">
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

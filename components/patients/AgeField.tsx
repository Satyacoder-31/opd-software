"use client";

import { NumberWheel } from "@/components/ui/NumberWheel";
import { Field, FieldError, FieldLabel } from "@/components/ui/shadcn/field";
import { cn } from "@/lib/utils";

const MIN_AGE = 0;
const MAX_AGE = 150;
const DEFAULT_AGE = 35;
const PRESET_AGES = [18, 25, 30, 35, 40, 45, 50, 60, 70];

type AgeFieldProps = {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
};

export function AgeField({
  name = "age",
  value,
  onChange,
  error,
  disabled,
}: AgeFieldProps) {
  const hasValue = value.trim() !== "";
  const numericValue = hasValue
    ? Math.min(MAX_AGE, Math.max(MIN_AGE, Number(value) || DEFAULT_AGE))
    : DEFAULT_AGE;

  function handleDirectChange(val: string) {
    if (val === "") {
      onChange("");
      return;
    }
    const n = parseInt(val, 10);
    if (!isNaN(n)) {
      const clamped = Math.min(MAX_AGE, Math.max(MIN_AGE, n));
      onChange(String(clamped));
    }
  }

  function handleStep(delta: number) {
    const cur = hasValue ? Number(value) || DEFAULT_AGE : DEFAULT_AGE;
    const next = Math.min(MAX_AGE, Math.max(MIN_AGE, cur + delta));
    onChange(String(next));
  }

  return (
    <Field
      data-invalid={!!error || undefined}
      data-disabled={disabled || undefined}
      className={cn(disabled && "opacity-60")}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
        <FieldLabel className="mb-0">Age (if DOB unknown)</FieldLabel>
        
        {/* Direct typing stepper for PC keyboard users */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">Type age:</span>
          <div className="inline-flex items-center rounded-lg border border-input bg-card shadow-2xs">
            <button
              type="button"
              disabled={disabled || (hasValue && Number(value) <= MIN_AGE)}
              onClick={() => handleStep(-1)}
              className="flex size-7 items-center justify-center rounded-l-lg text-slate-600 dark:text-slate-300 hover:bg-muted active:scale-95 cursor-pointer font-bold select-none"
              title="Decrease age (-1 yr)"
            >
              −
            </button>
            <input
              type="number"
              min={MIN_AGE}
              max={MAX_AGE}
              value={value}
              disabled={disabled}
              onChange={(e) => handleDirectChange(e.target.value)}
              placeholder="e.g. 36"
              className="h-7 w-16 text-center text-xs font-bold bg-transparent text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              disabled={disabled || (hasValue && Number(value) >= MAX_AGE)}
              onClick={() => handleStep(1)}
              className="flex size-7 items-center justify-center rounded-r-lg text-slate-600 dark:text-slate-300 hover:bg-muted active:scale-95 cursor-pointer font-bold select-none"
              title="Increase age (+1 yr)"
            >
              +
            </button>
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Yrs</span>
        </div>
      </div>

      {/* Quick preset chips */}
      <div className="flex flex-wrap items-center gap-1 pt-0.5 pb-1.5">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Quick:</span>
        {PRESET_AGES.map((preset) => {
          const isSelected = hasValue && Number(value) === preset;
          return (
            <button
              key={preset}
              type="button"
              disabled={disabled}
              onClick={() => onChange(String(preset))}
              className={cn(
                "rounded-md px-2 py-0.5 text-[11px] font-semibold transition-all cursor-pointer",
                isSelected
                  ? "bg-primary text-white shadow-xs font-bold ring-1 ring-primary"
                  : "bg-surface-muted dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-primary/10 hover:text-primary border border-border"
              )}
            >
              {preset}y
            </button>
          );
        })}
      </div>

      {/* Interactive Horizontal Wheel with PC arrow buttons & wheel scroll */}
      <NumberWheel
        min={MIN_AGE}
        max={MAX_AGE}
        value={numericValue}
        onChange={(next) => onChange(String(next))}
        disabled={disabled}
        suffix="y"
        aria-label="Age in years"
      />

      <input type="hidden" name={name} value={value} disabled={disabled} />
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}

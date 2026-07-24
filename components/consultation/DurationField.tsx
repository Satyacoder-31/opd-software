"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Field, FieldLabel } from "@/components/ui/shadcn/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import {
  DURATION_UNITS,
  durationUnitNeedsAmount,
  formatDuration,
  parseDuration,
  type DurationParts,
} from "@/lib/prescription-utils";
import { cn } from "@/lib/utils";

type DurationFieldProps = {
  name: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  label?: string;
};

const UNIT_ITEMS = DURATION_UNITS.map((unit) => ({
  value: unit.value,
  label: unit.label,
}));

/** Common OPD duration counts — pick instead of typing to avoid typos. */
const DURATION_AMOUNT_OPTIONS = Array.from({ length: 30 }, (_, i) =>
  String(i + 1)
);

export function DurationField({
  name,
  value,
  onChange,
  className,
  label = "Duration",
}: DurationFieldProps) {
  const amountId = useId();
  const unitId = useId();
  const [parts, setParts] = useState<DurationParts>(() => parseDuration(value));
  const showAmount =
    Boolean(parts.unit) && durationUnitNeedsAmount(parts.unit);

  const amountItems = useMemo(() => {
    const amount = parts.amount.trim();
    const extras =
      amount &&
      /^\d+(?:\.\d+)?$/.test(amount) &&
      !DURATION_AMOUNT_OPTIONS.includes(amount)
        ? [amount]
        : [];
    return [...DURATION_AMOUNT_OPTIONS, ...extras].map((n) => ({
      value: n,
      label: n,
    }));
  }, [parts.amount]);

  useEffect(() => {
    // Keep in-progress unit selection when amount is still empty (formats to "").
    if (value === formatDuration(parts)) return;
    setParts(parseDuration(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync only when parent value changes
  }, [value]);

  function commit(next: DurationParts) {
    setParts(next);
    onChange(formatDuration(next));
  }

  function handleAmountChange(nextValue: string | null) {
    commit({ ...parts, amount: nextValue ?? "" });
  }

  function handleUnitChange(nextValue: string | null) {
    const unit = (nextValue ?? "") as DurationParts["unit"];
    const next: DurationParts = { amount: parts.amount, unit };

    if (!durationUnitNeedsAmount(unit)) {
      next.amount = "";
    } else if (!/^\d+(?:\.\d+)?$/.test(parts.amount.trim())) {
      // Drop free-form leftovers when switching onto a countable unit.
      next.amount = "";
    }

    commit(next);
  }

  return (
    <Field className={className}>
      <FieldLabel htmlFor={showAmount ? amountId : unitId}>{label}</FieldLabel>
      {/* Keeps native form posts (e.g. dictionary) in sync with the composed value. */}
      <input type="hidden" name={name} value={formatDuration(parts)} />
      <div className="flex gap-2">
        {showAmount ? (
          <Select
            name={`${name}-amount`}
            value={parts.amount.trim() || null}
            items={amountItems}
            onValueChange={handleAmountChange}
          >
            <SelectTrigger
              id={amountId}
              className={cn(
                "h-11 min-h-11 w-19 shrink-0 py-2.5 data-[size=default]:h-11"
              )}
              aria-label="Duration amount"
            >
              <SelectValue placeholder="#" />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectGroup>
                {amountItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        ) : null}

        <Select
          name={`${name}-unit`}
          value={parts.unit || null}
          items={UNIT_ITEMS}
          onValueChange={handleUnitChange}
        >
          <SelectTrigger
            id={unitId}
            className={cn(
              "h-11 min-h-11 py-2.5 data-[size=default]:h-11",
              showAmount ? "min-w-38 flex-1" : "w-full"
            )}
            aria-label="Duration unit"
          >
            <SelectValue placeholder="Unit" />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectGroup>
              {DURATION_UNITS.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </Field>
  );
}

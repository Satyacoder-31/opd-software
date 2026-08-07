"use client";

import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export function checkboxOptionClass(selected: boolean) {
  return cn(
    "flex min-h-11 cursor-pointer items-center gap-3 rounded-sm border px-3 py-2.5 font-sans text-sm shadow-sm transition-[color,background-color,border-color,box-shadow] duration-150",
    selected
      ? "border-primary/55 bg-primary/15 text-ink shadow-[0_1px_3px_rgba(27,73,101,0.14)]"
      : "border-border bg-surface-tint text-ink shadow-[0_1px_2px_rgba(27,73,101,0.07)] hover:border-primary/40 hover:bg-surface-muted",
  );
}

export function CheckboxMark({
  checked,
  className,
}: {
  checked: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-sm border transition-[color,background-color,border-color] duration-150",
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card",
        className,
      )}
      aria-hidden
    >
      {checked ? (
        <Icon icon={faCheck} className="size-2.5 text-primary-foreground" />
      ) : null}
    </span>
  );
}

type CheckboxOptionProps = {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
  className?: string;
};

export function CheckboxOption({
  name,
  value,
  checked,
  onChange,
  children,
  className,
}: CheckboxOptionProps) {
  return (
    <label className={cn(checkboxOptionClass(checked), className)}>
      <input
        type="checkbox"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <CheckboxMark checked={checked} />
      {children}
    </label>
  );
}

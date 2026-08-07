"use client";

import { useState } from "react";
import { Input as ShadcnInput } from "@/components/ui/shadcn/input";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/shadcn/field";
import { cn } from "@/lib/utils";

type InputProps = React.ComponentProps<typeof ShadcnInput> & {
  label?: string;
  error?: string;
};

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M2.062 12.348a1 1 0 0 1 0-.696A10.75 10.75 0 0 1 21.938 12a1 1 0 0 1 0 .696A10.75 10.75 0 0 1 2.062 12.348Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499A10.75 10.75 0 0 1 2.062 12.348a1 1 0 0 1 0-.696A10.75 10.75 0 0 1 6.53 6.54" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

export function Input({
  label,
  error,
  className,
  id,
  type,
  ...props
}: InputProps) {
  const [visible, setVisible] = useState(false);
  const inputId =
    id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const isPassword = type === "password";
  const resolvedType = isPassword ? (visible ? "text" : "password") : type;

  return (
    <Field data-invalid={!!error || undefined}>
      {label ? <FieldLabel htmlFor={inputId}>{label}</FieldLabel> : null}
      {isPassword ? (
        <div className="relative">
          <ShadcnInput
            id={inputId}
            type={resolvedType}
            className={cn("h-11 pr-11", className)}
            aria-invalid={!!error || undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className={cn(
              "absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-sm",
              "text-muted-foreground transition-colors duration-150",
              "hover:text-ink focus-visible:text-ink",
              "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              "disabled:pointer-events-none disabled:opacity-50"
            )}
            disabled={props.disabled}
          >
            {visible ? (
              <EyeOffIcon className="size-[1.15rem]" />
            ) : (
              <EyeIcon className="size-[1.15rem]" />
            )}
          </button>
        </div>
      ) : (
        <ShadcnInput
          id={inputId}
          type={type}
          className={cn("h-11", className)}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
      )}
      {error ? (
        <FieldError id={`${inputId}-error`}>{error}</FieldError>
      ) : null}
    </Field>
  );
}

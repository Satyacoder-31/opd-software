"use client";

import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import { Input as ShadcnInput } from "@/components/ui/shadcn/input";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/shadcn/field";
import { cn } from "@/lib/utils";

type SearchFieldProps = Omit<React.ComponentProps<"input">, "type"> & {
  label?: string;
  error?: string;
};

export function SearchField({
  label,
  error,
  className,
  id,
  ...props
}: SearchFieldProps) {
  const inputId =
    id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <Field data-invalid={!!error || undefined} className="gap-2">
      {label ? <FieldLabel htmlFor={inputId}>{label}</FieldLabel> : null}
      <div className="group/search relative">
        <Icon
          icon={faMagnifyingGlass}
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 origin-center -translate-y-1/2 text-muted-foreground transition-[color,transform] duration-200 ease-out group-focus-within/search:scale-125 group-focus-within/search:text-primary"
        />
        <ShadcnInput
          id={inputId}
          type="search"
          enterKeyHint="search"
          className={cn(
            "h-11 rounded-full border-border/70 bg-white pl-11 pr-4 shadow-none md:text-sm",
            "placeholder:text-muted-foreground/65",
            "transition-[border-color,box-shadow,background-color,color] duration-200 ease-out",
            "hover:border-primary/25",
            "focus-visible:border-transparent focus-visible:ring-[3px] focus-visible:ring-primary/18",
            "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
            className
          )}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
      </div>
      {error ? <FieldError id={`${inputId}-error`}>{error}</FieldError> : null}
    </Field>
  );
}

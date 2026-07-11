import { Input as ShadcnInput } from "@/components/ui/shadcn/input";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/shadcn/field";
import { cn } from "@/lib/utils";

type InputProps = React.ComponentProps<typeof ShadcnInput> & {
  label: string;
  error?: string;
};

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <Field data-invalid={!!error || undefined}>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <ShadcnInput
        id={inputId}
        className={cn("h-11", className)}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <FieldError id={`${inputId}-error`}>{error}</FieldError>
      )}
    </Field>
  );
}

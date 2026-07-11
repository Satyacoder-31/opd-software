import { Textarea as ShadcnTextarea } from "@/components/ui/shadcn/textarea";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/shadcn/field";
import { cn } from "@/lib/utils";

type TextareaProps = React.ComponentProps<typeof ShadcnTextarea> & {
  label: string;
  error?: string;
};

export function Textarea({
  label,
  error,
  className,
  id,
  ...props
}: TextareaProps) {
  const textareaId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <Field data-invalid={!!error || undefined}>
      <FieldLabel htmlFor={textareaId}>{label}</FieldLabel>
      <ShadcnTextarea
        id={textareaId}
        className={cn("min-h-24", className)}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${textareaId}-error` : undefined}
        {...props}
      />
      {error && (
        <FieldError id={`${textareaId}-error`}>{error}</FieldError>
      )}
    </Field>
  );
}

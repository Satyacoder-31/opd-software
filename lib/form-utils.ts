import type { z } from "zod";

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const flattened = error.flatten().fieldErrors;
  const result: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flattened)) {
    const first = messages?.[0];
    if (first) result[key] = first;
  }
  return result;
}

export function formDataToRecord(formData: FormData): Record<string, string> {
  const record: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") record[key] = value;
  });
  return record;
}

export function firstFieldError(
  fieldErrors: Record<string, string>
): string | undefined {
  const keys = Object.keys(fieldErrors);
  return keys.length > 0 ? fieldErrors[keys[0]] : undefined;
}

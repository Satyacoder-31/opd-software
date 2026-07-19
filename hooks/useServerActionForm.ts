"use client";

import { useState, type FormEvent } from "react";
import { usePendingAction } from "@/hooks/usePendingAction";
import { formDataToRecord } from "@/lib/form-utils";
import type { ActionResult, VoidActionResult } from "@/lib/types";

type ActionResponse<T> = ActionResult<T> | VoidActionResult;

export function useServerActionForm<T = void>(
  action: (formData: FormData) => Promise<ActionResponse<T>>,
  options?: {
    initialValues?: Record<string, string>;
    onSuccess?: (
      data: T extends void ? undefined : T
    ) => void | Promise<void>;
  }
) {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, string>>(
    options?.initialValues ?? {}
  );
  const { pending, run } = usePendingAction();

  function setValue(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const captured = formDataToRecord(formData);
    setValues((prev) => ({ ...prev, ...captured }));
    setError(null);
    setFieldErrors({});

    void run(async () => {
      const result = await action(formData);
      if (!result.success) {
        setError(result.error);
        if ("fieldErrors" in result && result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      const data = "data" in result ? result.data : undefined;
      await options?.onSuccess?.(data as T extends void ? undefined : T);
    });
  }

  function fieldError(name: string): string | undefined {
    return fieldErrors[name];
  }

  return {
    handleSubmit,
    error,
    fieldErrors,
    fieldError,
    pending,
    values,
    setValue,
    setValues,
    setError,
  };
}

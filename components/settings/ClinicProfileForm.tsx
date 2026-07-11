"use client";

import Link from "next/link";
import { useState } from "react";
import { updateClinicProfile } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Banner } from "@/components/ui/Banner";
import type { Clinic } from "@prisma/client";
import { usePendingAction } from "@/hooks/usePendingAction";

type ClinicProfileFormProps = {
  clinic: Clinic;
  cancelHref?: string;
  onSuccess?: () => void;
};

export function ClinicProfileForm({
  clinic,
  cancelHref,
  onSuccess,
}: ClinicProfileFormProps) {
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const { pending, run } = usePendingAction();

  function handleSubmit(formData: FormData) {
    setMessage(null);
    void run(async () => {
      const result = await updateClinicProfile(formData);
      if (result.success) {
        onSuccess?.();
        return;
      }
      setMessage({ type: "error", text: result.error });
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(new FormData(e.currentTarget));
      }}
      className="flex flex-col gap-4"
    >
      <Input label="Clinic name" name="name" defaultValue={clinic.name} required />
      <Input label="Phone" name="phone" defaultValue={clinic.phone} required />
      <Input label="Address" name="address" defaultValue={clinic.address} required />
      <Input
        label="GSTIN (optional)"
        name="gstin"
        defaultValue={clinic.gstin ?? ""}
        placeholder="15-character GSTIN"
        maxLength={15}
      />
      {message && <Banner variant="error">{message.text}</Banner>}
      <div className="flex flex-wrap gap-3">
        {cancelHref && (
          <Link
            href={cancelHref}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-white px-4 text-sm font-medium text-ink hover:bg-surface-muted"
          >
            Cancel
          </Link>
        )}
        <Button type="submit" loading={pending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

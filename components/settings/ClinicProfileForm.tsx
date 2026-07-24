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
      <Input
        label="Clinic name"
        name="name"
        autoComplete="organization"
        defaultValue={clinic.name}
        required
      />
      <Input
        label="Phone"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        defaultValue={clinic.phone}
        required
      />
      <Input
        label="Address"
        name="address"
        autoComplete="street-address"
        defaultValue={clinic.address}
        required
      />
      <Input
        label="GSTIN (optional)"
        name="gstin"
        autoComplete="off"
        spellCheck={false}
        defaultValue={clinic.gstin ?? ""}
        placeholder="15-character GSTIN…"
        maxLength={15}
      />
      {message && <Banner variant="error">{message.text}</Banner>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap">
        {cancelHref && (
          <Button
            nativeButton={false}
            render={<Link href={cancelHref} />}
            variant="secondary"
          >
            Cancel
          </Button>
        )}
        <Button type="submit" loading={pending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

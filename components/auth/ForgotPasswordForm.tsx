"use client";

import Link from "next/link";
import { useState } from "react";
import { requestPasswordReset } from "@/actions/auth";
import { useServerActionForm } from "@/hooks/useServerActionForm";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Banner } from "@/components/ui/Banner";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const { handleSubmit, error, fieldError, pending, values, setValue } =
    useServerActionForm(requestPasswordReset, {
      onSuccess: () => setSent(true),
    });

  if (sent) {
    return (
      <div className="space-y-4">
        <Banner variant="success">
          If an account exists for that email, we sent a reset link. Check your
          inbox and spam folder.
        </Banner>
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="text-primary underline-offset-4 transition-[color,opacity] duration-150 hover:underline active:opacity-70">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={values.email ?? ""}
        onChange={(e) => setValue("email", e.target.value)}
        error={fieldError("email")}
        required
      />
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" loading={pending}>
        Send reset link
      </Button>
      <p className="text-sm text-muted-foreground">
        <Link href="/login" className="text-primary underline-offset-4 transition-[color,opacity] duration-150 hover:underline active:opacity-70">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

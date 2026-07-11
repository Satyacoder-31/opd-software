"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/actions/auth";
import { useServerActionForm } from "@/hooks/useServerActionForm";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Banner } from "@/components/ui/Banner";

export function ResetPasswordForm() {
  const router = useRouter();
  const { handleSubmit, error, fieldError, pending, values, setValue } =
    useServerActionForm(updatePassword, {
      onSuccess: () => {
        router.refresh();
        router.push("/queue");
      },
    });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Banner variant="info">
        Choose a new password below.
      </Banner>
      <Input
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        value={values.password ?? ""}
        onChange={(e) => setValue("password", e.target.value)}
        error={fieldError("password")}
        required
      />
      <Input
        label="Confirm password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        value={values.confirmPassword ?? ""}
        onChange={(e) => setValue("confirmPassword", e.target.value)}
        error={fieldError("confirmPassword")}
        required
      />
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" loading={pending}>
        Update password
      </Button>
      <p className="text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

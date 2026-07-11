"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signup } from "@/actions/auth";
import { useServerActionForm } from "@/hooks/useServerActionForm";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function SignupForm() {
  const router = useRouter();
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const { handleSubmit, error, fieldError, pending, values, setValue } =
    useServerActionForm(signup, {
      onSuccess: () => router.push("/login?registered=1"),
    });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    setConfirmError(null);
    const form = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;
    const confirm = (
      form.elements.namedItem("confirmPassword") as HTMLInputElement
    ).value;
    if (password !== confirm) {
      e.preventDefault();
      setConfirmError("Passwords do not match.");
      return;
    }
    handleSubmit(e);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input
        label="Clinic name"
        name="clinicName"
        value={values.clinicName ?? ""}
        onChange={(e) => setValue("clinicName", e.target.value)}
        error={fieldError("clinicName")}
        required
      />
      <Input
        label="Clinic phone"
        name="clinicPhone"
        type="tel"
        value={values.clinicPhone ?? ""}
        onChange={(e) => setValue("clinicPhone", e.target.value)}
        error={fieldError("clinicPhone")}
        required
      />
      <Input
        label="Clinic address"
        name="clinicAddress"
        value={values.clinicAddress ?? ""}
        onChange={(e) => setValue("clinicAddress", e.target.value)}
        error={fieldError("clinicAddress")}
        required
      />
      <Input
        label="Your name"
        name="adminName"
        value={values.adminName ?? ""}
        onChange={(e) => setValue("adminName", e.target.value)}
        error={fieldError("adminName")}
        required
      />
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
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
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
        minLength={8}
        value={values.confirmPassword ?? ""}
        onChange={(e) => setValue("confirmPassword", e.target.value)}
        error={confirmError ?? undefined}
        required
      />
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" loading={pending}>
        Create clinic account
      </Button>
      <p className="text-sm text-muted-foreground">
        Already registered?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

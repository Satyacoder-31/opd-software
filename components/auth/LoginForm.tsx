"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/actions/auth";
import { useServerActionForm } from "@/hooks/useServerActionForm";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function LoginForm() {
  const router = useRouter();
  const { handleSubmit, error, fieldError, pending, values, setValue } =
    useServerActionForm(login, {
      onSuccess: () => {
        router.refresh();
        router.push("/queue");
      },
    });

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
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        value={values.password ?? ""}
        onChange={(e) => setValue("password", e.target.value)}
        error={fieldError("password")}
        required
      />
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" loading={pending}>
        Sign in
      </Button>
      <p className="text-sm text-muted-foreground">
        <Link
          href="/login/forgot-password"
          className="text-primary underline-offset-4 transition-[color,opacity] duration-150 hover:underline active:opacity-70"
        >
          Forgot password?
        </Link>
      </p>
      <p className="text-sm text-muted-foreground">
        New clinic?{" "}
        <Link href="/signup" className="text-primary underline-offset-4 transition-[color,opacity] duration-150 hover:underline active:opacity-70">
          Register your clinic
        </Link>
      </p>
    </form>
  );
}

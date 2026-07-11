import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoginBanner } from "@/components/auth/LoginBanner";
import { AuthShell } from "@/components/auth/AuthShell";

export default function LoginPage() {
  return (
    <AuthShell title="Sign in" description="Access your clinic workspace">
      <Suspense fallback={null}>
        <LoginBanner />
      </Suspense>
      <LoginForm />
    </AuthShell>
  );
}

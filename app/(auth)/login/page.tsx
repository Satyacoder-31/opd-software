import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoginBanner } from "@/components/auth/LoginBanner";
import { AuthShell } from "@/components/auth/AuthShell";
import { AUTH_VISUAL_PANEL } from "@/components/auth/auth-visual-panel";

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in"
      description="Access your clinic workspace"
      panel={AUTH_VISUAL_PANEL}
    >
      <Suspense fallback={null}>
        <LoginBanner />
      </Suspense>
      <LoginForm />
    </AuthShell>
  );
}

import { SignupForm } from "@/components/auth/SignupForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { AUTH_VISUAL_PANEL } from "@/components/auth/auth-visual-panel";

export default function SignupPage() {
  return (
    <AuthShell
      title="Register your clinic"
      description="Create your account — clinic address and billing come next in setup"
      backHref="/login"
      backLabel="Back to sign in"
      panel={AUTH_VISUAL_PANEL}
    >
      <SignupForm />
    </AuthShell>
  );
}

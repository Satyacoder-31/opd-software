import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { AuthShell } from "@/components/auth/AuthShell";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Set a new password"
      description="Choose a password for your Dr Orthos account"
      backHref="/login"
      backLabel="Back to sign in"
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}

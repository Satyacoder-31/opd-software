import { SignupForm } from "@/components/auth/SignupForm";
import { AuthShell } from "@/components/auth/AuthShell";

export default function SignupPage() {
  return (
    <AuthShell
      title="Register your clinic"
      description="Set up your OPD EMR in under two minutes"
      backHref="/login"
      backLabel="Back to sign in"
    >
      <SignupForm />
    </AuthShell>
  );
}

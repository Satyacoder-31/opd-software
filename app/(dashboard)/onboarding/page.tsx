import { redirect } from "next/navigation";
import { getOnboardingState } from "@/actions/onboarding";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { requireSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";

export default async function OnboardingPage() {
  const session = await requireSessionUser();
  if (!can(session, "clinic.manage")) {
    redirect("/queue");
  }

  const state = await getOnboardingState();
  if (!state) {
    redirect("/queue");
  }

  if (state.clinic.onboardingCompletedAt) {
    redirect("/queue");
  }

  return <OnboardingWizard state={state} />;
}

import { unstable_cache } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { MobileNav } from "@/components/ui/MobileNav";
import { NavigationProgress } from "@/components/ui/NavigationProgress";
import { OnboardingSetupBanner } from "@/components/onboarding/OnboardingSetupBanner";

const getClinicDashboardMeta = unstable_cache(
  async (clinicId: string) => {
    const clinic = await prisma.clinic.findUniqueOrThrow({
      where: { id: clinicId },
      select: {
        name: true,
        logoUrl: true,
        onboardingCompletedAt: true,
        onboardingSkippedAt: true,
      },
    });
    return clinic;
  },
  ["clinic-dashboard"],
  { revalidate: 60, tags: ["clinic-dashboard", "clinic-name"] }
);

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSessionUser();
  const clinic = await getClinicDashboardMeta(session.clinicId);
  const pathname = (await headers()).get("x-pathname") ?? "";
  const onOnboarding = pathname === "/onboarding" || pathname.startsWith("/onboarding/");

  if (
    pathname &&
    can(session, "clinic.manage") &&
    !clinic.onboardingCompletedAt &&
    !clinic.onboardingSkippedAt &&
    !onOnboarding
  ) {
    redirect("/onboarding");
  }

  const showSetupBanner =
    can(session, "clinic.manage") && !clinic.onboardingCompletedAt;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <NavigationProgress />
      <OfflineBanner />
      <MobileNav
        session={session}
        clinicName={clinic.name}
        clinicLogoUrl={clinic.logoUrl}
      />
      {showSetupBanner && !onOnboarding ? (
        <OnboardingSetupBanner skipped={Boolean(clinic.onboardingSkippedAt)} />
      ) : null}
      <main id="main-content" className="flex-1 overflow-auto tint-soft">
        {children}
      </main>
    </div>
  );
}

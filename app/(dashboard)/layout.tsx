import { unstable_cache } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { listClinicAlerts } from "@/actions/clinic-alerts";
import { requireSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { AppShell } from "@/components/nav/AppShell";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
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
  const pathname = (await headers()).get("x-pathname") ?? "";
  const onOnboarding =
    pathname === "/onboarding" || pathname.startsWith("/onboarding/");

  const clinic = await getClinicDashboardMeta(session.clinicId);

  if (
    pathname &&
    can(session, "clinic.manage") &&
    !clinic.onboardingCompletedAt &&
    !clinic.onboardingSkippedAt &&
    !onOnboarding
  ) {
    redirect("/onboarding");
  }

  // Focused full-page setup — no sidebar, search, or clinic chrome until ready.
  // fixed inset-0 pulls setup out of document flow so the page itself cannot scroll.
  if (onOnboarding) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col overflow-hidden overscroll-none bg-background text-foreground">
        <NavigationProgress />
        <OfflineBanner />
        <main
          id="main-content"
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          {children}
        </main>
      </div>
    );
  }

  const alerts = await listClinicAlerts();

  const showSetupBanner =
    can(session, "clinic.manage") && !clinic.onboardingCompletedAt;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <NavigationProgress />
      <OfflineBanner />
      <AppShell
        session={session}
        clinicName={clinic.name}
        clinicLogoUrl={clinic.logoUrl}
        alerts={alerts}
      >
        {showSetupBanner ? (
          <OnboardingSetupBanner skipped={Boolean(clinic.onboardingSkippedAt)} />
        ) : null}
        <main
          id="main-content"
          className="flex-1 overflow-auto tint-soft pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0"
        >
          {children}
        </main>
      </AppShell>
    </div>
  );
}

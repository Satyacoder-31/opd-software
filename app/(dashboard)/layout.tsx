import { unstable_cache } from "next/cache";
import { requireSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { MobileNav } from "@/components/ui/MobileNav";
import { NavigationProgress } from "@/components/ui/NavigationProgress";

const getClinicName = unstable_cache(
  async (clinicId: string) => {
    const clinic = await prisma.clinic.findUniqueOrThrow({
      where: { id: clinicId },
      select: { name: true },
    });
    return clinic.name;
  },
  ["clinic-name"],
  { revalidate: 300, tags: ["clinic-name"] }
);

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSessionUser();
  const clinicName = await getClinicName(session.clinicId);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <NavigationProgress />
      <OfflineBanner />
      <MobileNav session={session} clinicName={clinicName} />
      <main id="main-content" className="flex-1 overflow-auto tint-soft">
        {children}
      </main>
    </div>
  );
}

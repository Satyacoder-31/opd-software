import { requireSessionUser, requirePermission } from "@/lib/auth";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSessionUser();
  requirePermission(session, "settings.access");

  return children;
}

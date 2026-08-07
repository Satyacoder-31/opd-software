import { requireSessionUser } from "@/lib/auth";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSessionUser();
  return children;
}

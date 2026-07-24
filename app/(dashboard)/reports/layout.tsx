import { redirect } from "next/navigation";
import { requireSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";

export default async function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSessionUser();
  if (!can(session, "reports.read")) {
    redirect("/queue");
  }

  return children;
}

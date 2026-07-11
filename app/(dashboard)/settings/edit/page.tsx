import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireSessionUser } from "@/lib/auth";
import { getClinicProfile } from "@/actions/auth";
import { EditSettingsPageClient } from "@/components/settings/EditSettingsPageClient";

export default async function EditSettingsPage() {
  const session = await requireSessionUser();
  if (session.role !== Role.admin) redirect("/queue");

  const clinic = await getClinicProfile();

  return <EditSettingsPageClient clinic={clinic} />;
}

import { notFound } from "next/navigation";
import { getStaffMember } from "@/actions/auth";
import { StaffEditPageClient } from "@/components/settings/StaffEditPageClient";

type StaffEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StaffEditPage({ params }: StaffEditPageProps) {
  const { id } = await params;
  const member = await getStaffMember(id);

  if (!member) notFound();

  return <StaffEditPageClient member={member} />;
}

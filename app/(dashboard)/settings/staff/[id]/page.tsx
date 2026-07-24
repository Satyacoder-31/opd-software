import { notFound } from "next/navigation";
import { getStaffMember } from "@/actions/auth";
import { StaffDetailPageClient } from "@/components/settings/StaffDetailPageClient";
import { requireSessionUser } from "@/lib/auth";

type StaffDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StaffDetailPage({ params }: StaffDetailPageProps) {
  const session = await requireSessionUser();
  const { id } = await params;
  const member = await getStaffMember(id);

  if (!member) notFound();

  return (
    <StaffDetailPageClient member={member} currentUserId={session.userId} />
  );
}

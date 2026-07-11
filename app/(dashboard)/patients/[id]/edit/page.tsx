import { notFound } from "next/navigation";
import { getPatientById } from "@/actions/patients";
import { EditPatientPageClient } from "@/components/patients/EditPatientPageClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditPatientPage({ params }: Props) {
  const { id } = await params;
  const patient = await getPatientById(id);

  if (!patient) notFound();

  return <EditPatientPageClient patient={patient} />;
}

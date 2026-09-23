import { notFound } from "next/navigation";
import { getPublicClinicBySlug } from "@/actions/clinics-public";
import { getPortalSessionAccount } from "@/actions/portal";
import { ClinicProfileView } from "@/components/portal/ClinicProfileView";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const clinic = await getPublicClinicBySlug(slug);
  if (!clinic) return { title: "Clinic · Dr Orthos" };
  return {
    title: `${clinic.name} · Dr Orthos`,
    description: clinic.description || `Book an appointment at ${clinic.name}`,
  };
}

export default async function ClinicPublicProfilePage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const [clinic, account] = await Promise.all([
    getPublicClinicBySlug(slug),
    getPortalSessionAccount(),
  ]);
  if (!clinic || !clinic.slug) notFound();

  return (
    <ClinicProfileView
      clinic={{ ...clinic, slug: clinic.slug }}
      signedIn={Boolean(account)}
      accountName={account?.name ?? null}
    />
  );
}

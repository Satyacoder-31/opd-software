import { Banner } from "@/components/ui/Banner";

type PatientSafetyBannerProps = {
  allergies?: string | null;
  chronicConditions?: string | null;
};

export function PatientSafetyBanner({
  allergies,
  chronicConditions,
}: PatientSafetyBannerProps) {
  const allergyText = allergies?.trim();
  const chronicText = chronicConditions?.trim();

  if (!allergyText && !chronicText) return null;

  return (
    <Banner variant="error">
      <span className="font-medium">Patient safety alerts</span>
      {allergyText ? (
        <span className="mt-1 block">Allergies: {allergyText}</span>
      ) : null}
      {chronicText ? (
        <span className="mt-1 block">Chronic conditions: {chronicText}</span>
      ) : null}
    </Banner>
  );
}

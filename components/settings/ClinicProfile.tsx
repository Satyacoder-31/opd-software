import type { Clinic } from "@prisma/client";
import { DetailRow } from "@/components/ui/DetailRow";
import { formatPhone } from "@/lib/utils";

type ClinicProfileProps = {
  clinic: Clinic;
};

export function ClinicProfile({ clinic }: ClinicProfileProps) {
  return (
    <dl>
      <DetailRow label="Clinic name" value={clinic.name} />
      <DetailRow label="Phone" value={formatPhone(clinic.phone)} />
      <DetailRow label="Address" value={clinic.address || "—"} />
      <DetailRow label="GSTIN" value={clinic.gstin || "—"} />
    </dl>
  );
}

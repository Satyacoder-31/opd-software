import type { Clinic } from "@prisma/client";
import { ClinicLogo } from "@/components/ui/ClinicLogo";
import { DetailRow } from "@/components/ui/DetailRow";
import {
  BUSINESS_ENTITY_OPTIONS,
  CLINIC_TYPE_OPTIONS,
} from "@/lib/clinic-onboarding";
import { formatPhone } from "@/lib/utils";

type ClinicProfileProps = {
  clinic: Pick<
    Clinic,
    | "name"
    | "phone"
    | "address"
    | "email"
    | "whatsapp"
    | "gstin"
    | "clinicType"
    | "timezone"
    | "logoUrl"
    | "website"
    | "mapsUrl"
    | "landmark"
    | "addressLine1"
    | "addressLine2"
    | "area"
    | "state"
    | "pincode"
    | "pan"
    | "businessEntity"
    | "phoneVerifiedAt"
    | "city"
  >;
};

export function ClinicProfile({ clinic }: ClinicProfileProps) {
  const typeLabel =
    CLINIC_TYPE_OPTIONS.find((o) => o.value === clinic.clinicType)?.label ??
    clinic.clinicType;
  const entityLabel =
    BUSINESS_ENTITY_OPTIONS.find((o) => o.value === clinic.businessEntity)
      ?.label ??
    clinic.businessEntity ??
    "—";

  return (
    <dl>
      <DetailRow label="Clinic name" value={clinic.name} />
      <DetailRow label="Type" value={typeLabel} />
      <DetailRow label="Timezone" value={clinic.timezone} />
      <DetailRow label="Phone" value={formatPhone(clinic.phone)} />
      <DetailRow
        label="Phone verified"
        value={clinic.phoneVerifiedAt ? "Yes" : "No"}
      />
      <DetailRow label="Email" value={clinic.email || "—"} />
      <DetailRow
        label="WhatsApp"
        value={clinic.whatsapp ? formatPhone(clinic.whatsapp) : "—"}
      />
      <DetailRow
        label="Address line 1"
        value={clinic.addressLine1 || clinic.address || "—"}
      />
      <DetailRow label="Address line 2" value={clinic.addressLine2 || "—"} />
      <DetailRow label="Area" value={clinic.area || "—"} />
      <DetailRow label="City" value={clinic.city || "—"} />
      <DetailRow label="State" value={clinic.state || "—"} />
      <DetailRow label="PIN" value={clinic.pincode || "—"} />
      <DetailRow label="Landmark" value={clinic.landmark || "—"} />
      <DetailRow label="Display address" value={clinic.address || "—"} />
      <DetailRow label="Business entity" value={entityLabel} />
      <DetailRow label="PAN" value={clinic.pan || "—"} />
      <DetailRow label="Website" value={clinic.website || "—"} />
      <DetailRow label="Maps" value={clinic.mapsUrl || "—"} />
      <DetailRow
        label="Logo"
        value={
          clinic.logoUrl ? (
            <ClinicLogo src={clinic.logoUrl} alt={`${clinic.name} logo`} size="md" />
          ) : (
            "—"
          )
        }
      />
      <DetailRow label="GSTIN" value={clinic.gstin || "—"} />
    </dl>
  );
}

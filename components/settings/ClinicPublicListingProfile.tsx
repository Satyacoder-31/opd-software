import Link from "next/link";
import { DetailRow } from "@/components/ui/DetailRow";
import type { Plan } from "@prisma/client";

type ClinicPublicListingProfileProps = {
  clinic: {
    name: string;
    phone?: string;
    slug: string | null;
    isPublicListed: boolean;
    bookingEnabled: boolean;
    description: string | null;
    city: string | null;
    state: string | null;
    specialties: string[];
    cancelCutoffHours: number;
    plan: Plan;
    phoneVerifiedAt?: Date | string | null;
  };
};

export function ClinicPublicListingProfile({
  clinic,
}: ClinicPublicListingProfileProps) {
  const phoneVerified = Boolean(clinic.phoneVerifiedAt);
  const publicHref =
    clinic.slug && clinic.isPublicListed ? `/clinics/${clinic.slug}` : null;

  return (
    <dl>
      <DetailRow
        label="Phone verified"
        value={phoneVerified ? `Yes${clinic.phone ? ` (${clinic.phone})` : ""}` : "No"}
      />
      <DetailRow
        label="Listed publicly"
        value={clinic.isPublicListed ? "Yes" : "No"}
      />
      <DetailRow
        label="Online booking"
        value={clinic.bookingEnabled ? "Enabled" : "Disabled"}
      />
      <DetailRow label="Public URL slug" value={clinic.slug || "—"} />
      <DetailRow
        label="Public page"
        value={
          publicHref ? (
            <Link
              href={publicHref}
              className="font-medium text-primary hover:underline"
            >
              {publicHref}
            </Link>
          ) : (
            "—"
          )
        }
      />
      <DetailRow label="City" value={clinic.city || "—"} />
      <DetailRow
        label="Specialties"
        value={
          clinic.specialties.length ? clinic.specialties.join(", ") : "—"
        }
      />
      <DetailRow
        label="Public description"
        value={clinic.description?.trim() || "—"}
      />
      <DetailRow
        label="Cancel / reschedule cutoff"
        value={`${clinic.cancelCutoffHours} hour${clinic.cancelCutoffHours === 1 ? "" : "s"}`}
      />
    </dl>
  );
}

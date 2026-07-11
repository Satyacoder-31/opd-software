import type { Patient } from "@prisma/client";
import { DetailRow } from "@/components/ui/DetailRow";
import { formatPatientAge, toDateInputValue } from "@/lib/date-utils";
import { formatPhone } from "@/lib/utils";

type PatientProfileProps = {
  patient: Patient;
};

function formatGender(gender: Patient["gender"]) {
  if (!gender) return "—";
  return gender.charAt(0).toUpperCase() + gender.slice(1);
}

export function PatientProfile({ patient }: PatientProfileProps) {
  return (
    <dl>
      <DetailRow label="Full name" value={patient.name} />
      <DetailRow label="MRN" value={patient.mrn} />
      <DetailRow label="Phone" value={formatPhone(patient.phone)} />
      <DetailRow
        label="Date of birth"
        value={
          patient.dateOfBirth ? toDateInputValue(patient.dateOfBirth) : "—"
        }
      />
      <DetailRow label="Age" value={formatPatientAge(patient) ?? "—"} />
      <DetailRow label="Gender" value={formatGender(patient.gender)} />
      <DetailRow label="Address" value={patient.address || "—"} />
      <DetailRow label="Allergies" value={patient.allergies || "—"} />
      <DetailRow
        label="Chronic conditions"
        value={patient.chronicConditions || "—"}
      />
      <DetailRow
        label="Registered"
        value={new Date(patient.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      />
    </dl>
  );
}

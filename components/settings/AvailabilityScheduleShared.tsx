import { DetailRow } from "@/components/ui/DetailRow";
import { Select } from "@/components/ui/Select";

export const DAYS = [
  { value: "1", label: "Monday", short: "Mon" },
  { value: "2", label: "Tuesday", short: "Tue" },
  { value: "3", label: "Wednesday", short: "Wed" },
  { value: "4", label: "Thursday", short: "Thu" },
  { value: "5", label: "Friday", short: "Fri" },
  { value: "6", label: "Saturday", short: "Sat" },
  { value: "0", label: "Sunday", short: "Sun" },
];

export const SLOT_PRESETS = ["5", "10", "15", "20", "30", "45", "60"] as const;
export const SLOT_CUSTOM = "custom";

export const SLOT_OPTIONS = [
  ...SLOT_PRESETS.map((mins) => ({ value: mins, label: `${mins} min` })),
  { value: SLOT_CUSTOM, label: "Custom…" },
];

export type DoctorOption = {
  id: string;
  name: string;
  specialty: string | null;
  consultationFee: string | null;
};

export type AvailabilityRow = {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  maxPerSlot: number;
};

export type LeaveRow = {
  id: string;
  doctorId: string;
  date: string;
  reason: string | null;
};

export function formatFee(fee: string | null) {
  if (fee == null || fee === "") return "Not set";
  return `₹${Number(fee).toLocaleString("en-IN")}`;
}

export function dayLabel(dayOfWeek: number) {
  return DAYS.find((d) => d.value === String(dayOfWeek))?.label ?? "—";
}

export function DoctorPicker({
  doctors,
  doctorId,
  onChange,
}: {
  doctors: DoctorOption[];
  doctorId: string;
  onChange: (id: string) => void;
}) {
  if (doctors.length > 1) {
    return (
      <Select
        label="Doctor"
        options={doctors.map((d) => ({ value: d.id, label: d.name }))}
        value={doctorId}
        onChange={(e) => onChange(e.target.value)}
        allowClear={false}
      />
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">Doctor</p>
      <p className="mt-1 text-sm text-ink">{doctors[0]?.name}</p>
    </div>
  );
}

export function DoctorSummary({ doctor }: { doctor: DoctorOption }) {
  return (
    <dl>
      <DetailRow label="Specialty" value={doctor.specialty || "Not set"} />
      <DetailRow label="Consultation fee" value={formatFee(doctor.consultationFee)} />
    </dl>
  );
}

export function EmptyList({ children }: { children: React.ReactNode }) {
  return (
    <li className="px-4 py-6 text-center text-sm text-muted-foreground">{children}</li>
  );
}

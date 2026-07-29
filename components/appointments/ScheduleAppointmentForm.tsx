"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppointmentType } from "@prisma/client";
import { createAppointment } from "@/actions/appointments";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { usePendingAction } from "@/hooks/usePendingAction";

type DoctorOption = { id: string; name: string };

type ScheduleAppointmentFormProps = {
  patientId: string;
  doctors: DoctorOption[];
  onSuccess?: () => void;
};

export function ScheduleAppointmentForm({
  patientId,
  doctors,
  onSuccess,
}: ScheduleAppointmentFormProps) {
  const router = useRouter();
  const { pending, run } = usePendingAction();
  const [scheduledAt, setScheduledAt] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    void run(async () => {
      const result = await createAppointment({
        patientId,
        type: AppointmentType.scheduled,
        scheduledAt,
        doctorId: doctorId || null,
      });
      if (!result.success) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMessage({
        type: "success",
        text: `Scheduled as token #${result.data.tokenNumber}.`,
      });
      setScheduledAt("");
      onSuccess?.();
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {message ? (
        <Banner variant={message.type === "success" ? "success" : "error"}>
          {message.text}
        </Banner>
      ) : null}
      <Input
        label="Date & time"
        name="scheduledAt"
        type="datetime-local"
        value={scheduledAt}
        onChange={(e) => setScheduledAt(e.target.value)}
        required
      />
      <Select
        label="Doctor (optional)"
        name="doctorId"
        value={doctorId}
        onChange={(e) => setDoctorId(e.target.value)}
        allowClear
        clearLabel="Any doctor"
        options={doctors.map((d) => ({ value: d.id, label: d.name }))}
      />
      <Button type="submit" loading={pending}>
        Book appointment
      </Button>
    </form>
  );
}

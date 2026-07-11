"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppointmentType } from "@prisma/client";
import { createAppointment } from "@/actions/appointments";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { usePendingAction } from "@/hooks/usePendingAction";

type PatientDetailActionsProps = {
  patientId: string;
  alreadyInQueue?: boolean;
};

export function PatientDetailActions({
  patientId,
  alreadyInQueue = false,
}: PatientDetailActionsProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"walkin" | "scheduled">(
    alreadyInQueue ? "scheduled" : "walkin"
  );
  const [scheduledAt, setScheduledAt] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const { pending, run } = usePendingAction();

  function handleAddToQueue() {
    setMessage(null);
    void run(async () => {
      const result = await createAppointment({
        patientId,
        type:
          mode === "scheduled"
            ? AppointmentType.scheduled
            : AppointmentType.walkin,
        scheduledAt: mode === "scheduled" ? scheduledAt : undefined,
      });
      if (!result.success) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMessage({
        type: "success",
        text:
          mode === "scheduled"
            ? `Scheduled as token #${result.data.tokenNumber}.`
            : `Added to queue as token #${result.data.tokenNumber}.`,
      });
      router.refresh();
    });
  }

  const showWalkinAdd = mode === "walkin" && !alreadyInQueue;
  const showScheduleAdd = mode === "scheduled";

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Visit type"
          name="visitType"
          value={mode}
          onChange={(e) => setMode(e.target.value as "walkin" | "scheduled")}
          options={[
            {
              value: "walkin",
              label: alreadyInQueue
                ? "Walk-in (already in queue)"
                : "Walk-in (today)",
            },
            { value: "scheduled", label: "Scheduled appointment" },
          ]}
        />
        {mode === "scheduled" && (
          <Input
            label="Date & time"
            name="scheduledAt"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            required
          />
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href={`/patients/${patientId}/edit`}>
          <Button variant="secondary">Edit details</Button>
        </Link>
        {showWalkinAdd && (
          <Button onClick={handleAddToQueue} loading={pending}>
            Add to queue
          </Button>
        )}
        {showScheduleAdd && (
          <Button onClick={handleAddToQueue} loading={pending}>
            Schedule visit
          </Button>
        )}
        {mode === "walkin" && alreadyInQueue && (
          <Link href="/queue">
            <Button variant="secondary">View queue</Button>
          </Link>
        )}
      </div>
      {mode === "walkin" && alreadyInQueue && (
        <Banner variant="info">This patient is already in today&apos;s queue.</Banner>
      )}
      {message && (
        <Banner variant={message.type === "success" ? "success" : "error"}>
          {message.text}
        </Banner>
      )}
    </div>
  );
}

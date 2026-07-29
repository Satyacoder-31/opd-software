"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { faBars, faCalendarPlus, faListOl, faPen } from "@fortawesome/free-solid-svg-icons";
import { createAppointment } from "@/actions/appointments";
import { ScheduleAppointmentForm } from "@/components/appointments/ScheduleAppointmentForm";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageShell";
import { usePendingAction } from "@/hooks/usePendingAction";

type DoctorOption = { id: string; name: string };

type PatientDetailHeaderProps = {
  patientId: string;
  patientName: string;
  alreadyInQueue?: boolean;
  doctors?: DoctorOption[];
};

export function PatientDetailHeader({
  patientId,
  patientName,
  alreadyInQueue = false,
  doctors = [],
}: PatientDetailHeaderProps) {
  const router = useRouter();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const { pending, run } = usePendingAction();

  function handleAddToQueue() {
    setMessage(null);
    void run(async () => {
      const result = await createAppointment(patientId);
      if (!result.success) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMessage({
        type: "success",
        text: `Added to queue as token #${result.data.tokenNumber}.`,
      });
      router.refresh();
    });
  }

  const showNotices = alreadyInQueue || message;

  return (
    <>
      <PageHeader
        className="py-4 md:py-5"
        title={patientName}
        backHref="/patients"
        backLabel=""
        actions={
          <>
            {!alreadyInQueue ? (
              <Button onClick={handleAddToQueue} loading={pending} size="sm">
                <Icon icon={faListOl} data-icon="inline-start" />
                Add to queue
              </Button>
            ) : (
              <Button
                nativeButton={false}
                render={<Link href="/queue" />}
                variant="secondary"
                size="sm"
              >
                <Icon icon={faBars} data-icon="inline-start" />
                View queue
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowSchedule((v) => !v)}
            >
              <Icon icon={faCalendarPlus} data-icon="inline-start" />
              Schedule
            </Button>
            <Button
              nativeButton={false}
              render={<Link href={`/patients/${patientId}/edit`} />}
              variant="secondary"
              size="sm"
            >
              <Icon icon={faPen} data-icon="inline-start" />
              Edit details
            </Button>
          </>
        }
      />

      {showNotices ? (
        <div className="flex flex-col gap-2 border-b border-border px-6 py-3 md:px-8">
          {alreadyInQueue ? (
            <Banner variant="info">
              This patient is already in today&apos;s queue.
            </Banner>
          ) : null}
          {message ? (
            <Banner variant={message.type === "success" ? "success" : "error"}>
              {message.text}
            </Banner>
          ) : null}
        </div>
      ) : null}

      {showSchedule ? (
        <div className="border-b border-border px-6 py-4 md:px-8">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Book appointment
          </h2>
          <div className="max-w-md">
            <ScheduleAppointmentForm
              patientId={patientId}
              doctors={doctors}
              onSuccess={() => setShowSchedule(false)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

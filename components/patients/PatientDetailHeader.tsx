"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { faBars, faListOl, faPen } from "@fortawesome/free-solid-svg-icons";
import { createAppointment } from "@/actions/appointments";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageShell";
import { usePendingAction } from "@/hooks/usePendingAction";

type PatientDetailHeaderProps = {
  patientId: string;
  patientName: string;
  alreadyInQueue?: boolean;
};

export function PatientDetailHeader({
  patientId,
  patientName,
  alreadyInQueue = false,
}: PatientDetailHeaderProps) {
  const router = useRouter();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
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
    </>
  );
}

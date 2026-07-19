"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppointmentStatus } from "@prisma/client";
import {
  CheckCircle2Icon,
  ClipboardListIcon,
  EyeIcon,
  UsersIcon,
} from "lucide-react";
import {
  getCompletedQueue,
  getQueue,
  updateAppointmentStatus,
} from "@/actions/appointments";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Banner } from "@/components/ui/Banner";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import { Select } from "@/components/ui/Select";
import { cn, formatPhone } from "@/lib/utils";
import { formatClinicTime, formatPatientAge } from "@/lib/date-utils";
import { usePendingAction } from "@/hooks/usePendingAction";
import {
  useAppointmentRealtime,
  type RealtimeConnectionStatus,
} from "@/hooks/useAppointmentRealtime";

type QueueItem = Awaited<ReturnType<typeof getQueue>>[number];
type CompletedItem = Awaited<ReturnType<typeof getCompletedQueue>>[number];
type DoctorOption = { id: string; name: string };

type QueueBoardProps = {
  clinicId: string;
  initialQueue: QueueItem[];
  initialCompleted: CompletedItem[];
  canStartConsultation: boolean;
  canPickDoctor: boolean;
  doctors: DoctorOption[];
  defaultDoctorId?: string;
};

export function QueueBoard({
  clinicId,
  initialQueue,
  initialCompleted,
  canStartConsultation,
  canPickDoctor,
  doctors,
  defaultDoctorId,
}: QueueBoardProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"waiting" | "in_progress" | "completed">(
    "waiting"
  );
  const [queue, setQueue] = useState(initialQueue);
  const [completed, setCompleted] = useState(initialCompleted);
  const [selectedDoctorId, setSelectedDoctorId] = useState(
    defaultDoctorId ?? doctors[0]?.id ?? ""
  );
  const { isPending, run } = usePendingAction<string>();
  const [connectionStatus, setConnectionStatus] =
    useState<RealtimeConnectionStatus>("disconnected");
  const [actionError, setActionError] = useState<string | null>(null);

  const refreshQueue = useCallback(async () => {
    try {
      const [fresh, done] = await Promise.all([getQueue(), getCompletedQueue()]);
      setQueue(fresh);
      setCompleted(done);
    } catch {
      // Refresh failure should not break the board
    }
  }, []);

  useAppointmentRealtime(clinicId, refreshQueue, setConnectionStatus);

  useEffect(() => {
    setQueue(initialQueue);
  }, [initialQueue]);

  useEffect(() => {
    setCompleted(initialCompleted);
  }, [initialCompleted]);

  function handleStatus(id: string, status: AppointmentStatus) {
    setActionError(null);
    void run(async () => {
      const result = await updateAppointmentStatus(
        id,
        status,
        status === AppointmentStatus.in_progress && canPickDoctor
          ? selectedDoctorId || undefined
          : undefined
      );
      if (!result.success) {
        setActionError(result.error);
        return;
      }
      if (result.data.consultationId) {
        router.push(`/consultations/${result.data.consultationId}`);
        return;
      }
      await refreshQueue();
    }, id);
  }

  const inProgress = queue.filter((q) => q.status === "in_progress");
  const waiting = queue.filter((q) => q.status === "waiting");

  const statusLabel =
    connectionStatus === "connected"
      ? "Live updates"
      : connectionStatus === "error"
        ? "Reconnecting…"
        : connectionStatus === "disconnected"
          ? "Disconnected"
          : "Connecting…";

  return (
    <PageShell>
      <PageHeader
        title="Today's queue"
        description={`${statusLabel} · ${queue.length} active · ${completed.length} done`}
        actions={
          <>
            <Button
              type="button"
              size="sm"
              variant={tab === "waiting" ? "primary" : "secondary"}
              onClick={() => setTab("waiting")}
            >
              Waiting ({waiting.length})
            </Button>
            <Button
              type="button"
              size="sm"
              variant={tab === "in_progress" ? "primary" : "secondary"}
              onClick={() => setTab("in_progress")}
            >
              In consultation ({inProgress.length})
            </Button>
            <Button
              type="button"
              size="sm"
              variant={tab === "completed" ? "primary" : "secondary"}
              onClick={() => setTab("completed")}
            >
              Completed ({completed.length})
            </Button>
          </>
        }
      />

      {actionError && (
        <div className="px-5 pb-2 md:px-8">
          <Banner variant="error">{actionError}</Banner>
        </div>
      )}

      {tab === "waiting" && canStartConsultation && canPickDoctor && doctors.length > 0 && (
        <Card title="Assign doctor when starting" flush className="border-y border-border">
          <div className="px-6 py-5 md:px-8">
            <Select
              label="Doctor"
              name="doctorId"
              value={selectedDoctorId}
              className="px-4 py-6"
              optionClassName="py-3"
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              options={doctors.map((doctor) => ({
                value: doctor.id,
                label: `Dr. ${doctor.name}`,
              }))}
            />
          </div>
        </Card>
      )}

      {tab === "waiting" && (
        <section aria-label="Waiting" className="border-b border-border">
          {waiting.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title="No patients waiting"
              description={
                <>
                  Add someone from{" "}
                  <Link href="/patients">Patients</Link> to get the queue
                  moving.
                </>
              }
              className="bg-card"
            />
          ) : (
            <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-3">
              {waiting.map((item) => (
                <QueueCard
                  key={item.id}
                  item={item}
                  onStatus={handleStatus}
                  canStart={canStartConsultation}
                  isPending={isPending}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "in_progress" && (
        <section aria-label="In consultation" className="border-b border-border">
          {inProgress.length === 0 ? (
            <EmptyState
              icon={ClipboardListIcon}
              title="No consultations in progress"
              description="Start a consultation from the Waiting tab to see it here."
              className="bg-card"
            />
          ) : (
            <div className="grid gap-px bg-border md:grid-cols-2">
              {inProgress.map((item) => (
                <QueueCard
                  key={item.id}
                  item={item}
                  onStatus={handleStatus}
                  canStart={canStartConsultation}
                  isPending={isPending}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "completed" && (
        <section aria-label="Completed" className="border-b border-border">
          {completed.length === 0 ? (
            <EmptyState
              icon={CheckCircle2Icon}
              title="No completed visits yet"
              description="Finished consultations will show up here for today."
              className="bg-card"
            />
          ) : (
            <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-3">
              {completed.map((item) => (
                <CompletedCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      )}
    </PageShell>
  );
}

function QueueCard({
  item,
  onStatus,
  canStart,
  isPending,
}: {
  item: QueueItem;
  onStatus: (id: string, status: AppointmentStatus) => void;
  canStart: boolean;
  isPending: (id: string) => boolean;
}) {
  const loading = isPending(item.id);
  const ageLabel = formatPatientAge(item.patient);

  return (
    <Card flush className="relative overflow-hidden bg-card">
      <div className="relative px-5 py-5">
        <div
          className={cn(
            "absolute -right-4 -top-4 flex h-20 w-20 items-center justify-center rounded-full",
            "border-4 border-accent/40 bg-accent/10 font-display text-3xl font-bold text-accent-foreground"
          )}
          aria-label={`Token number ${item.tokenNumber}`}
        >
          {item.tokenNumber}
        </div>

        <div className="pr-16">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-ink">{item.patient.name}</p>
              <p className="text-sm text-muted-foreground">{item.patient.mrn}</p>
            </div>
            <StatusBadge status={item.status} />
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            {formatPhone(item.patient.phone)}
            {ageLabel ? ` · ${ageLabel}` : ""}
          </p>
          {item.type === "scheduled" && item.scheduledAt && (
            <p className="mt-1 text-xs text-primary">
              Scheduled {formatClinicTime(item.scheduledAt)}
            </p>
          )}
          {item.consultation?.doctor && (
            <p className="mt-1 text-xs text-muted-foreground">
              Dr. {item.consultation.doctor.name}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {item.status === "waiting" && canStart && (
              <Button
                size="sm"
                onClick={() => onStatus(item.id, AppointmentStatus.in_progress)}
                loading={loading}
              >
                <ClipboardListIcon data-icon="inline-start" />
                Start consultation
              </Button>
            )}
            {item.status === "in_progress" && item.consultation && (
              <>
                <Link href={`/consultations/${item.consultation.id}`}>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="border-primary/45 bg-primary/20 text-primary hover:bg-primary/30 hover:text-primary"
                  >
                    <EyeIcon data-icon="inline-start" />
                    <span className="font-semibold">Open</span>
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-success/50 text-[#0f5132] hover:bg-success/30 hover:text-success"
                  onClick={() => onStatus(item.id, AppointmentStatus.done)}
                  loading={loading}
                >
                  <CheckCircle2Icon data-icon="inline-start" />
                  <span className="font-semibold">Mark done</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function CompletedCard({ item }: { item: CompletedItem }) {
  const ageLabel = formatPatientAge(item.patient);

  return (
    <Card flush className="relative overflow-hidden bg-card">
      <div className="px-5 py-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-ink">{item.patient.name}</p>
            <p className="text-sm text-muted-foreground">
              Token #{item.tokenNumber} · {item.patient.mrn}
            </p>
          </div>
          <StatusBadge status={item.status} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {formatPhone(item.patient.phone)}
          {ageLabel ? ` · ${ageLabel}` : ""}
        </p>
        {item.consultation?.doctor && (
          <p className="mt-1 text-xs text-muted-foreground">
            Dr. {item.consultation.doctor.name}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {item.consultation && (
            <Link
              href={`/consultations/${item.consultation.id}`}
              className="inline-flex h-9 items-center rounded-lg border border-border bg-white px-3 text-sm font-medium text-ink hover:bg-surface-muted"
            >
              View visit
            </Link>
          )}
          {item.consultation?.invoice && (
            <Link
              href={`/billing/${item.consultation.id}`}
              className="inline-flex h-9 items-center rounded-lg border border-border bg-white px-3 text-sm font-medium text-ink hover:bg-surface-muted"
            >
              Billing
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppointmentStatus } from "@prisma/client";
import {
  faCircleCheck,
  faClipboardList,
  faEye,
  faReceipt,
  faUserClock,
} from "@fortawesome/free-solid-svg-icons";
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
import { Icon } from "@/components/ui/Icon";
import { PageHeader, PageShell } from "@/components/ui/PageShell";
import { Select } from "@/components/ui/Select";
import { cn, formatPhone } from "@/lib/utils";
import { formatPatientAge } from "@/lib/date-utils";
import { usePendingAction } from "@/hooks/usePendingAction";
import { useAppointmentRealtime } from "@/hooks/useAppointmentRealtime";

type QueueItem = Awaited<ReturnType<typeof getQueue>>[number];
type CompletedItem = Awaited<ReturnType<typeof getCompletedQueue>>[number];
type DoctorOption = { id: string; name: string };
type QueueTab = "waiting" | "in_progress" | "completed";

type QueueBoardProps = {
  clinicId: string;
  initialQueue: QueueItem[];
  initialCompleted: CompletedItem[];
  canStartConsultation: boolean;
  canPickDoctor: boolean;
  /** Open / View visit links (doctor, admin). */
  canOpenConsultation: boolean;
  /** Billing links (receptionist, admin). */
  canAccessBilling: boolean;
  doctors: DoctorOption[];
  defaultDoctorId?: string;
};

export function QueueBoard({
  clinicId,
  initialQueue,
  initialCompleted,
  canStartConsultation,
  canPickDoctor,
  canOpenConsultation,
  canAccessBilling,
  doctors,
  defaultDoctorId,
}: QueueBoardProps) {
  const router = useRouter();
  const [tab, setTab] = useState<QueueTab>("waiting");
  const [queue, setQueue] = useState(initialQueue);
  const [completed, setCompleted] = useState(initialCompleted);
  const [selectedDoctorId, setSelectedDoctorId] = useState(
    defaultDoctorId ?? doctors[0]?.id ?? ""
  );
  const { isPending, run } = usePendingAction<string>();
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

  useAppointmentRealtime(clinicId, refreshQueue);

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

  const tabs: { id: QueueTab; label: string; count: number }[] = [
    { id: "waiting", label: "Waiting", count: waiting.length },
    { id: "in_progress", label: "In consult", count: inProgress.length },
    { id: "completed", label: "Completed", count: completed.length },
  ];

  return (
    <PageShell>
      <PageHeader
        className="sm:items-center"
        title={
          <span className="flex w-full items-baseline justify-between gap-3">
            <span>Today&apos;s queue</span>
            <Link
              href="/patients/new"
              className="shrink-0 font-sans text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Register patient
            </Link>
          </span>
        }
      />

      {/* LIVE STAT KPI BAR */}
      <div className="border-b border-border bg-card px-4 py-4 sm:px-6 md:px-8">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div
            onClick={() => setTab("waiting")}
            className={cn(
              "cursor-pointer rounded-xl border p-3.5 transition-all",
              tab === "waiting"
                ? "border-sky-300 bg-sky-50/70 shadow-xs"
                : "border-border bg-surface hover:bg-slate-50"
            )}
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800">
                Waiting
              </span>
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <div className="mt-1 font-display text-2xl font-bold text-ink">
              {waiting.length}
            </div>
            <span className="text-[11px] text-muted-foreground">in waiting room</span>
          </div>

          <div
            onClick={() => setTab("in_progress")}
            className={cn(
              "cursor-pointer rounded-xl border p-3.5 transition-all",
              tab === "in_progress"
                ? "border-blue-300 bg-blue-50/70 shadow-xs"
                : "border-border bg-surface hover:bg-slate-50"
            )}
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                In Consult
              </span>
              <span className="size-2 rounded-full bg-blue-600" />
            </div>
            <div className="mt-1 font-display text-2xl font-bold text-ink">
              {inProgress.length}
            </div>
            <span className="text-[11px] text-muted-foreground">with doctor</span>
          </div>

          <div
            onClick={() => setTab("completed")}
            className={cn(
              "cursor-pointer rounded-xl border p-3.5 transition-all",
              tab === "completed"
                ? "border-emerald-300 bg-emerald-50/70 shadow-xs"
                : "border-border bg-surface hover:bg-slate-50"
            )}
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Completed
              </span>
              <span className="size-2 rounded-full bg-emerald-500" />
            </div>
            <div className="mt-1 font-display text-2xl font-bold text-ink">
              {completed.length}
            </div>
            <span className="text-[11px] text-emerald-700 font-medium">ready for billing</span>
          </div>
        </div>
      </div>

      <div className="border-b border-border bg-card">
        <div
          role="tablist"
          aria-label="Queue status"
          className="flex w-full bg-surface-muted/60"
        >
          {tabs.map((item) => {
            const selected = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(item.id)}
                className={cn(
                  "inline-flex min-h-11 flex-1 items-center justify-center gap-2 px-2 text-sm font-semibold transition-[background-color,color] duration-150",
                  "border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
                  selected
                    ? "border-primary bg-white text-primary shadow-xs"
                    : "border-transparent text-muted-foreground hover:bg-white/70 hover:text-ink"
                )}
              >
                <span>{item.label}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
                    selected
                      ? "bg-primary text-white"
                      : "bg-slate-200 text-slate-700"
                  )}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>

        {tab === "waiting" &&
          canStartConsultation &&
          canPickDoctor &&
          doctors.length > 0 && (
            <div className="border-t border-border px-4 py-3 md:px-8">
              <div className="flex max-w-sm flex-col gap-1.5">
                <Select
                  label="Assign doctor when starting"
                  name="doctorId"
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  options={doctors.map((doctor) => ({
                    value: doctor.id,
                    label: `Dr. ${doctor.name}`,
                  }))}
                />
              </div>
            </div>
          )}
      </div>

      {actionError && (
        <div className="px-5 pb-2 pt-3 md:px-8">
          <Banner variant="error">{actionError}</Banner>
        </div>
      )}

      {tab === "waiting" && (
        <section aria-label="Waiting" className="border-b border-border">
          <QueueTabSummary
            count={waiting.length}
            singular="patient waiting"
            plural="patients waiting"
          />
          {waiting.length === 0 ? (
            <EmptyState
              icon={faUserClock}
              title="No patients waiting"
              description="Register a patient from the header, or open Patients to add someone to today’s queue."
              className="bg-card"
            />
          ) : (
            <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {waiting.map((item) => (
                <QueueCard
                  key={item.id}
                  item={item}
                  onStatus={handleStatus}
                  canStart={canStartConsultation}
                  canOpenConsultation={canOpenConsultation}
                  isPending={isPending}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "in_progress" && (
        <section aria-label="In consultation" className="border-b border-border">
          <QueueTabSummary
            count={inProgress.length}
            singular="consultation in progress"
            plural="consultations in progress"
          />
          {inProgress.length === 0 ? (
            <EmptyState
              icon={faClipboardList}
              title="No consultations in progress"
              description={
                canStartConsultation
                  ? "Start a consultation from Waiting to see it here."
                  : "When a doctor starts a visit from Waiting, it appears here. Use Completed for billing after the visit."
              }
              className="bg-card"
            />
          ) : (
            <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {inProgress.map((item) => (
                <QueueCard
                  key={item.id}
                  item={item}
                  onStatus={handleStatus}
                  canStart={canStartConsultation}
                  canOpenConsultation={canOpenConsultation}
                  isPending={isPending}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "completed" && (
        <section aria-label="Completed" className="border-b border-border">
          <QueueTabSummary
            count={completed.length}
            singular="completed visit"
            plural="completed visits"
          />
          {completed.length === 0 ? (
            <EmptyState
              icon={faCircleCheck}
              title="No completed visits yet"
              description="Finished consultations will show up here for today."
              className="bg-card"
            />
          ) : (
            <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {completed.map((item) => (
                <CompletedCard
                  key={item.id}
                  item={item}
                  canOpenConsultation={canOpenConsultation}
                  canAccessBilling={canAccessBilling}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </PageShell>
  );
}

function QueueTabSummary({
  count,
  singular,
  plural,
}: {
  count: number;
  singular: string;
  plural: string;
}) {
  if (count === 0) return null;

  return (
    <div className="border-b border-border bg-card px-4 py-2.5 md:px-8">
      <p className="text-sm text-muted-foreground">
        <span className="font-medium tabular-nums text-ink">{count}</span>
        {" "}
        {count === 1 ? singular : plural}
      </p>
    </div>
  );
}

function QueueCard({
  item,
  onStatus,
  canStart,
  canOpenConsultation,
  isPending,
}: {
  item: QueueItem;
  onStatus: (id: string, status: AppointmentStatus) => void;
  canStart: boolean;
  canOpenConsultation: boolean;
  isPending: (id: string) => boolean;
}) {
  const loading = isPending(item.id);
  const ageLabel = formatPatientAge(item.patient);
  const meta = [
    formatPhone(item.patient.phone),
    ageLabel,
    item.consultation?.doctor ? `Dr. ${item.consultation.doctor.name}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card flush className="bg-card">
            <div className="flex min-h-30">
        <div
          className={cn(
            "flex w-16 shrink-0 flex-col items-center justify-center border-r border-border",
            item.status === "waiting"
              ? "bg-accent/10"
              : "bg-primary/10"
          )}
          aria-label={`Token number ${item.tokenNumber}`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Token
          </span>
          <span className="font-display text-2xl font-semibold tabular-nums text-ink">
            {item.tokenNumber}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 px-4 py-4">
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  href={`/patients/${item.patient.id}`}
                  className="block truncate font-medium text-ink hover:text-primary"
                >
                  {item.patient.name}
                </Link>
                <p className="truncate text-sm text-muted-foreground">
                  {item.patient.mrn}
                </p>
              </div>
              <StatusBadge status={item.status} className="shrink-0" />
            </div>

            {meta ? (
              <p className="mt-1.5 truncate text-sm text-muted-foreground">
                {meta}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {item.status === "waiting" && canStart && (
              <Button
                size="sm"
                onClick={() => onStatus(item.id, AppointmentStatus.in_progress)}
                loading={loading}
              >
                <Icon icon={faClipboardList} data-icon="inline-start" />
                Start consultation
              </Button>
            )}
            {item.status === "waiting" && !canStart && (
              <Button
                nativeButton={false}
                render={<Link href={`/patients/${item.patient.id}`} />}
                size="sm"
                variant="secondary"
              >
                Patient record
              </Button>
            )}
            {item.status === "in_progress" &&
              item.consultation &&
              canOpenConsultation && (
                <Button
                  nativeButton={false}
                  render={
                    <Link href={`/consultations/${item.consultation.id}`} />
                  }
                  size="sm"
                >
                  <Icon icon={faEye} data-icon="inline-start" />
                  Open consultation
                </Button>
              )}
            {item.status === "in_progress" &&
              item.consultation &&
              !canOpenConsultation && (
                <p className="text-sm text-muted-foreground">
                  With Dr. {item.consultation.doctor?.name ?? "doctor"}
                </p>
              )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function CompletedCard({
  item,
  canOpenConsultation,
  canAccessBilling,
}: {
  item: CompletedItem;
  canOpenConsultation: boolean;
  canAccessBilling: boolean;
}) {
  const ageLabel = formatPatientAge(item.patient);
  const showVisit = Boolean(item.consultation && canOpenConsultation);
  const showBilling = Boolean(item.consultation && canAccessBilling);

  return (
    <Card flush className="bg-card">
            <div className="flex min-h-30">
        <div
          className="flex w-16 shrink-0 flex-col items-center justify-center border-r border-border bg-muted/50"
          aria-label={`Token number ${item.tokenNumber}`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Token
          </span>
          <span className="font-display text-2xl font-semibold tabular-nums text-ink">
            {item.tokenNumber}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 px-4 py-4">
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  href={`/patients/${item.patient.id}`}
                  className="block truncate font-medium text-ink hover:text-primary"
                >
                  {item.patient.name}
                </Link>
                <p className="truncate text-sm text-muted-foreground">
                  {item.patient.mrn}
                </p>
              </div>
              <StatusBadge status={item.status} className="shrink-0" />
            </div>
            <p className="mt-1.5 truncate text-sm text-muted-foreground">
              {[
                formatPhone(item.patient.phone),
                ageLabel,
                item.consultation?.doctor
                  ? `Dr. ${item.consultation.doctor.name}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>

          {(showVisit || showBilling) && (
            <div className="flex flex-wrap gap-2">
              {showBilling && item.consultation && (
                <Button
                  nativeButton={false}
                  render={
                    <Link href={`/billing/${item.consultation.id}`} />
                  }
                  size="sm"
                  variant="primary"
                >
                  <Icon icon={faReceipt} data-icon="inline-start" />
                  Bill Patient
                </Button>
              )}
              {showVisit && item.consultation && (
                <Button
                  nativeButton={false}
                  render={
                    <Link href={`/consultations/${item.consultation.id}`} />
                  }
                  size="sm"
                  variant="secondary"
                >
                  <Icon icon={faEye} data-icon="inline-start" />
                  View visit
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

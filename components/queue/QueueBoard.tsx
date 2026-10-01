"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppointmentStatus } from "@prisma/client";
import {
  faCircleCheck,
  faClipboardList,
  faEye,
  faHashtag,
  faPhone,
  faReceipt,
  faStethoscope,
  faUserClock,
  faUserDoctor,
  faVenusMars,
} from "@fortawesome/free-solid-svg-icons";
import {
  getCompletedQueue,
  getQueue,
  updateAppointmentStatus,
} from "@/actions/appointments";
import { Button } from "@/components/ui/Button";
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
            <div className="mx-4 my-4 overflow-hidden rounded-2xl border border-border shadow-sm md:mx-6 md:my-5">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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
            <div className="mx-4 my-4 overflow-hidden rounded-2xl border border-border shadow-sm md:mx-6 md:my-5">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            <div className="mx-4 my-4 overflow-hidden rounded-2xl border border-border shadow-sm md:mx-6 md:my-5">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {completed.map((item) => (
                <CompletedCard
                  key={item.id}
                  item={item}
                  canOpenConsultation={canOpenConsultation}
                  canAccessBilling={canAccessBilling}
                />
              ))}
              </div>
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

function PatientAvatar({ name, status }: { name: string; status: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const gradient =
    status === "waiting"
      ? "from-amber-400 to-orange-500"
      : "from-blue-500 to-indigo-600";
  return (
    <div
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-bold text-sm text-white shadow-sm",
        gradient
      )}
      aria-hidden="true"
    >
      {initials || "P"}
    </div>
  );
}

function MetaPill({ icon, text, color }: { icon: typeof faPhone; text: string; color: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", color)}>
      <Icon icon={icon} className="size-2.5" />
      {text}
    </span>
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
  const phone = formatPhone(item.patient.phone);
  const doctorName = item.consultation?.doctor?.name;
  const isWaiting = item.status === "waiting";
  const isInProgress = item.status === "in_progress";

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-none bg-card transition-all",
        "border-b border-border last:border-b-0",
        isWaiting && "hover:bg-amber-50/40",
        isInProgress && "hover:bg-blue-50/40",
      )}
    >
      {/* Status accent bar on left */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          isWaiting ? "bg-amber-400" : "bg-blue-500"
        )}
      />

      <div className="flex items-start gap-3.5 px-5 pt-4 pb-3 pl-6">
        {/* Token badge */}
        <div
          className={cn(
            "flex min-w-[2.75rem] flex-col items-center justify-center rounded-xl px-2 py-1.5 text-center",
            isWaiting
              ? "bg-amber-100 text-amber-800 border border-amber-200"
              : "bg-blue-100 text-blue-800 border border-blue-200"
          )}
          aria-label={`Token ${item.tokenNumber}`}
        >
          <Icon icon={faHashtag} className="size-2.5 opacity-60" />
          <span className="font-black text-lg leading-none tabular-nums">
            {item.tokenNumber}
          </span>
        </div>

        {/* Patient info */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/patients/${item.patient.id}`}
              className="block truncate font-bold text-[15px] text-ink hover:text-primary transition-colors leading-snug"
            >
              {item.patient.name}
            </Link>
            <span
              className={cn(
                "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                isWaiting
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-blue-200 bg-blue-50 text-blue-700 flex items-center gap-1"
              )}
            >
              {isInProgress && <span className="inline-block size-1.5 rounded-full bg-blue-500 animate-pulse mr-0.5" />}
              {isWaiting ? "Waiting" : "In Consult"}
            </span>
          </div>

          <p className="text-xs text-muted-foreground font-mono">{item.patient.mrn}</p>

          {/* Meta pills */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {phone && (
              <MetaPill
                icon={faPhone}
                text={phone}
                color="border-slate-200 bg-slate-50 text-slate-600"
              />
            )}
            {ageLabel && (
              <MetaPill
                icon={faVenusMars}
                text={ageLabel}
                color="border-violet-200 bg-violet-50 text-violet-700"
              />
            )}
            {doctorName && (
              <MetaPill
                icon={faUserDoctor}
                text={`Dr. ${doctorName}`}
                color="border-teal-200 bg-teal-50 text-teal-700"
              />
            )}
          </div>

          {item.reasonForVisit && (
            <p className="mt-2 text-xs text-muted-foreground italic line-clamp-1">
              &ldquo;{item.reasonForVisit}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* Action footer */}
      <div className={cn(
        "flex items-center gap-2 border-t px-5 py-2.5 pl-6",
        isWaiting ? "border-amber-100 bg-amber-50/30" : "border-blue-100 bg-blue-50/30"
      )}>
        {isWaiting && canStart && (
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 shadow-sm"
            onClick={() => onStatus(item.id, AppointmentStatus.in_progress)}
            loading={loading}
          >
            <Icon icon={faStethoscope} className="size-3" />
            Start Consultation
          </Button>
        )}
        {isWaiting && !canStart && (
          <Button
            nativeButton={false}
            render={<Link href={`/patients/${item.patient.id}`} />}
            size="sm"
            variant="secondary"
            className="h-8 text-xs"
          >
            View Record
          </Button>
        )}
        {isInProgress && item.consultation && canOpenConsultation && (
          <Button
            nativeButton={false}
            render={<Link href={`/consultations/${item.consultation.id}`} />}
            size="sm"
            className="h-8 text-xs gap-1.5 shadow-sm"
          >
            <Icon icon={faClipboardList} className="size-3" />
            Open Consultation
          </Button>
        )}
        {isInProgress && item.consultation && !canOpenConsultation && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Icon icon={faUserDoctor} className="size-3 text-blue-500" />
            With Dr. {item.consultation.doctor?.name ?? "doctor"}
          </p>
        )}
      </div>
    </div>
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
  const phone = formatPhone(item.patient.phone);
  const doctorName = item.consultation?.doctor?.name;
  const showVisit = Boolean(item.consultation && canOpenConsultation);
  const showBilling = Boolean(item.consultation && canAccessBilling);

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-none bg-card border-b border-border last:border-b-0 hover:bg-emerald-50/30 transition-colors"
    >
      {/* Emerald accent bar */}
      <div className="absolute inset-y-0 left-0 w-1 bg-emerald-400" />

      <div className="flex items-start gap-3.5 px-5 pt-4 pb-3 pl-6">
        {/* Token badge */}
        <div
          className="flex min-w-[2.75rem] flex-col items-center justify-center rounded-xl px-2 py-1.5 text-center bg-emerald-100 text-emerald-800 border border-emerald-200"
          aria-label={`Token ${item.tokenNumber}`}
        >
          <Icon icon={faHashtag} className="size-2.5 opacity-60" />
          <span className="font-black text-lg leading-none tabular-nums">
            {item.tokenNumber}
          </span>
        </div>

        {/* Patient info */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/patients/${item.patient.id}`}
              className="block truncate font-bold text-[15px] text-ink hover:text-primary transition-colors leading-snug"
            >
              {item.patient.name}
            </Link>
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              <Icon icon={faCircleCheck} className="size-2.5" />
              Done
            </span>
          </div>

          <p className="text-xs text-muted-foreground font-mono">{item.patient.mrn}</p>

          {/* Meta pills */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {phone && (
              <MetaPill
                icon={faPhone}
                text={phone}
                color="border-slate-200 bg-slate-50 text-slate-600"
              />
            )}
            {ageLabel && (
              <MetaPill
                icon={faVenusMars}
                text={ageLabel}
                color="border-violet-200 bg-violet-50 text-violet-700"
              />
            )}
            {doctorName && (
              <MetaPill
                icon={faUserDoctor}
                text={`Dr. ${doctorName}`}
                color="border-teal-200 bg-teal-50 text-teal-700"
              />
            )}
          </div>
        </div>
      </div>

      {/* Action footer */}
      {(showVisit || showBilling) && (
        <div className="flex items-center gap-2 border-t border-emerald-100 bg-emerald-50/30 px-5 py-2.5 pl-6">
          {showBilling && item.consultation && (
            <Button
              nativeButton={false}
              render={<Link href={`/billing/${item.consultation.id}`} />}
              size="sm"
              className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              <Icon icon={faReceipt} className="size-3" />
              Bill Patient
            </Button>
          )}
          {showVisit && item.consultation && (
            <Button
              nativeButton={false}
              render={<Link href={`/consultations/${item.consultation.id}`} />}
              size="sm"
              variant="secondary"
              className="h-8 text-xs gap-1.5"
            >
              <Icon icon={faEye} className="size-3" />
              View Visit
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

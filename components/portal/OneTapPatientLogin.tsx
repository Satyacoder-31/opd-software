"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  faBolt,
  faCircleNotch,
  faUser,
  faClock,
  faFilePrescription,
  faHeartPulse,
  faPenToSquare,
} from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import { oneTapPatientLogin } from "@/actions/portal";
import {
  DEMO_PATIENT_ACCOUNTS,
  type DemoPatientAccount,
} from "@/lib/demo-accounts";
import { Banner } from "@/components/ui/Banner";

interface OneTapPatientLoginProps {
  onPrefillPhone?: (phone: string) => void;
}

const BADGE_STYLES: Record<string, string> = {
  success: "bg-teal-500/10 text-teal-800 border-teal-300 dark:text-teal-300 dark:border-teal-700",
  warning: "bg-amber-500/10 text-amber-800 border-amber-300 dark:text-amber-300 dark:border-amber-700",
  info: "bg-indigo-500/10 text-indigo-800 border-indigo-300 dark:text-indigo-300 dark:border-indigo-700",
  neutral: "bg-slate-500/10 text-slate-800 border-slate-300 dark:text-slate-300 dark:border-slate-700",
};

const STATUS_ICONS: Record<string, typeof faUser> = {
  success: faFilePrescription,
  warning: faClock,
  info: faClock,
  neutral: faHeartPulse,
};

export function OneTapPatientLogin({ onPrefillPhone }: OneTapPatientLoginProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activePhone, setActivePhone] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePatientLogin = (patient: DemoPatientAccount) => {
    setErrorMsg(null);
    setActivePhone(patient.phone);

    startTransition(async () => {
      try {
        const res = await oneTapPatientLogin(patient.phone);
        if (!res.success) {
          setErrorMsg(res.error ?? "Could not sign into patient portal.");
          setActivePhone(null);
          return;
        }

        router.push(res.data.redirectTo || "/portal");
        router.refresh();
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Patient login error.");
        setActivePhone(null);
      }
    });
  };

  return (
    <div className="space-y-4 rounded-xl border border-border/80 bg-white/90 p-4 sm:p-5 shadow-sm backdrop-blur-xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-400">
            <Icon icon={faBolt} className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">1-Tap Patient Demo Sign In</h2>
            <p className="text-xs text-muted-foreground">
              Skip OTP to explore prescription downloads &amp; live queue tokens
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2.5 py-1 text-[11px] font-medium text-teal-700 dark:text-teal-400">
          <span className="size-1.5 rounded-full bg-teal-500 animate-pulse" />
          Instant Demo
        </span>
      </div>

      {errorMsg ? (
        <Banner variant="error" className="text-xs">
          {errorMsg}
        </Banner>
      ) : null}

      {/* Patient Cards List */}
      <div className="grid gap-2.5 sm:grid-cols-2">
        {DEMO_PATIENT_ACCOUNTS.map((p) => {
          const badgeStyle = BADGE_STYLES[p.statusType] ?? BADGE_STYLES.neutral;
          const statusIcon = STATUS_ICONS[p.statusType] ?? faUser;
          const isLoggingInThis = isPending && activePhone === p.phone;
          const isAnyLoggingIn = isPending;

          return (
            <div
              key={p.id}
              className={`group flex flex-col justify-between rounded-lg border border-border/80 bg-surface/50 p-3.5 transition-all duration-150 hover:border-teal-500/60 hover:shadow-sm ${
                isLoggingInThis ? "ring-2 ring-teal-500 border-transparent bg-teal-50/50" : ""
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${p.avatarColor}`}
                    >
                      {p.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-ink leading-tight">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {p.age} yrs · {p.gender === "male" ? "M" : "F"} · +91 {p.phone}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-medium ${badgeStyle}`}
                  >
                    <Icon icon={statusIcon} className="size-2.5" />
                    {p.statusBadge}
                  </span>
                </div>

                <p className="mt-1 text-[11px] font-medium text-ink/90 truncate">
                  {p.condition}
                </p>
                <p className="text-[11px] leading-snug text-muted-foreground line-clamp-2">
                  {p.summary}
                </p>
              </div>

              {/* Actions */}
              <div className="mt-3 flex items-center gap-2 pt-2 border-t border-border/50">
                <button
                  type="button"
                  disabled={isAnyLoggingIn}
                  onClick={() => handlePatientLogin(p)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-teal-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  aria-label={`1-Tap Sign in as ${p.name}`}
                >
                  {isLoggingInThis ? (
                    <>
                      <Icon icon={faCircleNotch} className="size-3 animate-spin" />
                      <span>Opening Portal...</span>
                    </>
                  ) : (
                    <>
                      <Icon icon={faBolt} className="size-3 text-amber-300" />
                      <span>1-Tap Portal Access</span>
                    </>
                  )}
                </button>

                {onPrefillPhone ? (
                  <button
                    type="button"
                    disabled={isAnyLoggingIn}
                    onClick={() => onPrefillPhone(p.phone)}
                    title="Fill phone number into form"
                    className="inline-flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-surface-muted hover:text-ink disabled:opacity-50"
                    aria-label={`Prefill phone with ${p.phone}`}
                  >
                    <Icon icon={faPenToSquare} className="size-3" />
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

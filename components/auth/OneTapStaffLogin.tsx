"use client";

import { useState, useTransition } from "react";
import {
  faBolt,
  faCircleNotch,
  faUserDoctor,
  faShieldHalved,
  faClipboardList,
  faStethoscope,
  faPenToSquare,
} from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import { oneTapStaffLogin } from "@/actions/auth";
import {
  DEMO_STAFF_ACCOUNTS,
  DEMO_STAFF_PASSWORD,
  type DemoStaffAccount,
} from "@/lib/demo-accounts";
import { Banner } from "@/components/ui/Banner";

interface OneTapStaffLoginProps {
  onPrefill?: (email: string, password: string) => void;
}

const ROLE_ICONS: Record<string, typeof faUserDoctor> = {
  owner: faStethoscope,
  doctor: faUserDoctor,
  admin: faShieldHalved,
  receptionist: faClipboardList,
};

const ROLE_THEMES: Record<
  string,
  {
    pillBg: string;
    pillText: string;
    border: string;
    activeRing: string;
    btnHover: string;
    dotColor: string;
  }
> = {
  owner: {
    pillBg: "bg-amber-500/10 text-amber-800 border-amber-300 dark:text-amber-300 dark:border-amber-700",
    pillText: "text-amber-800 dark:text-amber-300",
    border: "hover:border-amber-400/80 focus-within:border-amber-500",
    activeRing: "focus-visible:ring-amber-500",
    btnHover: "hover:bg-amber-600",
    dotColor: "bg-amber-500",
  },
  doctor: {
    pillBg: "bg-sky-500/10 text-sky-800 border-sky-300 dark:text-sky-300 dark:border-sky-700",
    pillText: "text-sky-800 dark:text-sky-300",
    border: "hover:border-sky-400/80 focus-within:border-sky-500",
    activeRing: "focus-visible:ring-sky-500",
    btnHover: "hover:bg-sky-600",
    dotColor: "bg-sky-500",
  },
  admin: {
    pillBg: "bg-purple-500/10 text-purple-800 border-purple-300 dark:text-purple-300 dark:border-purple-700",
    pillText: "text-purple-800 dark:text-purple-300",
    border: "hover:border-purple-400/80 focus-within:border-purple-500",
    activeRing: "focus-visible:ring-purple-500",
    btnHover: "hover:bg-purple-600",
    dotColor: "bg-purple-500",
  },
  receptionist: {
    pillBg: "bg-emerald-500/10 text-emerald-800 border-emerald-300 dark:text-emerald-300 dark:border-emerald-700",
    pillText: "text-emerald-800 dark:text-emerald-300",
    border: "hover:border-emerald-400/80 focus-within:border-emerald-500",
    activeRing: "focus-visible:ring-emerald-500",
    btnHover: "hover:bg-emerald-600",
    dotColor: "bg-emerald-500",
  },
};

export function OneTapStaffLogin({ onPrefill }: OneTapStaffLoginProps) {
  const [isPending, startTransition] = useTransition();
  const [activeEmail, setActiveEmail] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOneTap = (account: DemoStaffAccount) => {
    setErrorMsg(null);
    setActiveEmail(account.email);

    startTransition(async () => {
      try {
        const result = await oneTapStaffLogin(account.email);
        if (!result.success) {
          setErrorMsg(result.error ?? "Failed to sign in. Please try again.");
          setActiveEmail(null);
          return;
        }

        // Hard redirect so auth cookie is fully sent with the next request.
        // router.push() races against cookie propagation and causes error boundary.
        window.location.href = result.data.redirectTo;
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Unexpected error during login.");
        setActiveEmail(null);
      }
    });
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface-muted/40 p-4 sm:p-5 shadow-xs transition-all">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-sky-500/15 text-sky-700 dark:text-sky-400">
            <Icon icon={faBolt} className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">1-Tap Demo Workspace Sign In</h2>
            <p className="text-xs text-muted-foreground">
              Select any clinical role to instantly test permissions
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live Clinic
        </span>
      </div>

      {errorMsg ? (
        <Banner variant="error" className="text-xs">
          {errorMsg}
        </Banner>
      ) : null}

      {/* Role Cards Grid */}
      <div className="grid gap-2.5 sm:grid-cols-2">
        {DEMO_STAFF_ACCOUNTS.map((account) => {
          const theme = ROLE_THEMES[account.role] ?? ROLE_THEMES.doctor;
          const roleIcon = ROLE_ICONS[account.role] ?? faUserDoctor;
          const isLoggingInThis = isPending && activeEmail === account.email;
          const isAnyLoggingIn = isPending;

          return (
            <div
              key={account.id}
              className={`group relative flex flex-col justify-between rounded-lg border border-border/80 bg-card p-3.5 transition-all duration-150 hover:shadow-sm ${theme.border} ${
                isLoggingInThis ? "ring-2 ring-primary border-transparent bg-primary/5" : ""
              }`}
            >
              {/* Card Top */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${account.avatarColor}`}
                    >
                      <Icon icon={roleIcon} className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-ink leading-tight">
                        {account.name}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground font-mono">
                        {account.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-medium ${theme.pillBg}`}
                  >
                    <span className={`size-1 rounded-full ${theme.dotColor}`} />
                    {account.roleLabel}
                  </span>
                </div>

                <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground line-clamp-2">
                  {account.description}
                </p>
              </div>

              {/* Card Actions */}
              <div className="mt-3 flex items-center gap-2 pt-2 border-t border-border/50">
                <button
                  type="button"
                  disabled={isAnyLoggingIn}
                  onClick={() => handleOneTap(account)}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${theme.activeRing}`}
                  aria-label={`1-Tap Sign in as ${account.name} (${account.roleLabel})`}
                >
                  {isLoggingInThis ? (
                    <>
                      <Icon icon={faCircleNotch} className="size-3 animate-spin" />
                      <span>Entering...</span>
                    </>
                  ) : (
                    <>
                      <Icon icon={faBolt} className="size-3 text-amber-300" />
                      <span>1-Tap Sign In</span>
                    </>
                  )}
                </button>

                {onPrefill ? (
                  <button
                    type="button"
                    disabled={isAnyLoggingIn}
                    onClick={() => onPrefill(account.email, DEMO_STAFF_PASSWORD)}
                    title="Fill email & password into form"
                    className="inline-flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-surface-muted hover:text-ink disabled:opacity-50"
                    aria-label={`Prefill form with ${account.email}`}
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

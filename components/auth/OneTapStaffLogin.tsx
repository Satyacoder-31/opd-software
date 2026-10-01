"use client";

import { useState, useTransition } from "react";
import {
  faBolt,
  faCircleNotch,
  faHospital,
  faPenToSquare,
  faCheck,
  faStethoscope,
  faFilePrescription,
  faListOl,
  faIndianRupeeSign,
  faUsers,
  faFlask,
  faGear,
} from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import { oneTapStaffLogin } from "@/actions/auth";
import {
  UNIFIED_HOSPITAL_ACCOUNT,
  DEMO_STAFF_PASSWORD,
} from "@/lib/demo-accounts-data";
import { Banner } from "@/components/ui/Banner";

interface OneTapStaffLoginProps {
  onPrefill?: (email: string, password: string) => void;
}

const OPD_CAPABILITIES = [
  {
    icon: faStethoscope,
    label: "Doctor Consultations & EMR",
    desc: "Vitals, clinical examination, ICD-10 diagnoses, medical notes & certificates",
  },
  {
    icon: faFilePrescription,
    label: "E-Prescriptions & Rx",
    desc: "Drug catalog, dosages, food instructions, templates & PDF printing",
  },
  {
    icon: faListOl,
    label: "Live Queue & Token Board",
    desc: "Real-time patient waitlist, walk-in check-in, token calling & status",
  },
  {
    icon: faIndianRupeeSign,
    label: "Billing & Invoicing",
    desc: "Consultation fees, cash/UPI/card payment receipts & tariff management",
  },
  {
    icon: faUsers,
    label: "Patient Registry",
    desc: "MRN medical records, patient lookup, demographics & past visits",
  },
  {
    icon: faFlask,
    label: "Lab Desk & Investigations",
    desc: "Order lab tests, sample collection tracking & test result entry",
  },
  {
    icon: faGear,
    label: "Hospital Settings & Reports",
    desc: "Daily OPD revenue reports, doctor schedules, staff & clinic master data",
  },
];

export function OneTapStaffLogin({ onPrefill }: OneTapStaffLoginProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const account = UNIFIED_HOSPITAL_ACCOUNT;

  const handleOneTap = () => {
    setErrorMsg(null);

    startTransition(async () => {
      try {
        const result = await oneTapStaffLogin(account.email);
        if (!result.success) {
          setErrorMsg(result.error ?? "Failed to sign in. Please try again.");
          return;
        }

        // Hard redirect so auth cookie is fully sent with the next request.
        window.location.href = result.data.redirectTo;
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : "Unexpected error during login."
        );
      }
    });
  };

  return (
    <div className="space-y-4 rounded-xl border-2 border-primary/20 bg-primary/5 p-4 sm:p-5 shadow-xs transition-all">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <Icon icon={faHospital} className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-ink tracking-tight">
              Unified Hospital Master Sign In
            </h2>
            <p className="text-xs text-muted-foreground">
              Single login with full authority over doctor, admin, billing &amp; EMR
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live OPD System
        </span>
      </div>

      {errorMsg ? (
        <Banner variant="error" className="text-xs">
          {errorMsg}
        </Banner>
      ) : null}

      {/* Unified Master Account Card */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-700 text-white font-bold text-sm shadow-md shadow-sky-700/20">
              <Icon icon={faStethoscope} className="size-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-ink leading-tight">
                  {account.name}
                </p>
                <span className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  <Icon icon={faCheck} className="size-2.5" />
                  Full OPD Authority
                </span>
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">
                {account.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onPrefill ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => onPrefill(account.email, DEMO_STAFF_PASSWORD)}
                title="Prefill email and password below"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-ink disabled:opacity-50"
              >
                <Icon icon={faPenToSquare} className="size-3.5" />
                <span className="hidden sm:inline">Prefill Form</span>
              </button>
            ) : null}

            <button
              type="button"
              disabled={isPending}
              onClick={handleOneTap}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98] disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Icon icon={faCircleNotch} className="size-3.5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <Icon icon={faBolt} className="size-3.5 text-amber-300" />
                  <span>1-Tap Hospital Sign In</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Breakdown of what this one user manages */}
        <div className="mt-4 pt-3 border-t border-border/60">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            One user manages everything in the OPD:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {OPD_CAPABILITIES.map((cap) => (
              <div
                key={cap.label}
                className="flex items-start gap-2 rounded-md bg-surface-muted/50 p-2 text-xs"
              >
                <Icon
                  icon={cap.icon}
                  className="size-3 text-primary mt-0.5 shrink-0"
                />
                <div>
                  <strong className="font-semibold text-ink">{cap.label}:</strong>{" "}
                  <span className="text-muted-foreground text-[11px]">
                    {cap.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

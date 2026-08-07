"use client";

import { faCheck } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { logout } from "@/actions/auth";
import {
  completeOnboarding,
  saveOnboardingIdentity,
  saveOnboardingPublicProfile,
  skipOnboarding,
  type OnboardingState,
} from "@/actions/onboarding";
import {
  requestClinicPhoneOtp,
  saveOnboardingBillingAddress,
  saveOnboardingDirectoryExtras,
  verifyClinicPhoneOtp,
} from "@/actions/onboarding-medium";
import {
  ClinicAddressFields,
  type ClinicAddressValue,
} from "@/components/settings/ClinicAddressFields";
import { ClinicLogoUpload } from "@/components/settings/ClinicLogoUpload";
import { Banner } from "@/components/ui/Banner";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/Button";
import {
  CheckboxMark,
  CheckboxOption,
  checkboxOptionClass,
} from "@/components/ui/CheckboxOption";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { OtpCodeInput } from "@/components/ui/OtpCodeInput";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/shadcn/badge";
import {
  BUSINESS_ENTITY_OPTIONS,
  CLINIC_FACILITY_OPTIONS,
  CLINIC_LANGUAGE_OPTIONS,
  CLINIC_TYPE_OPTIONS,
  type ClinicHourRow,
} from "@/lib/clinic-onboarding";
import {
  ONBOARDING_LAST_STEP,
  ONBOARDING_STEPS,
  clearStoredOnboardingStep,
  readStoredOnboardingStep,
  resolveResumeStep,
  writeStoredOnboardingStep,
} from "@/lib/onboarding-progress";
import { PLAN_LABELS } from "@/lib/plan-features";
import { cn } from "@/lib/utils";

const DAY_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function StepActions({
  left,
  right,
  className,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3">{left}</div>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
        {right}
      </div>
    </div>
  );
}

function StepBody({ children }: { children: React.ReactNode }) {
  return <div className="pb-2">{children}</div>;
}

export function OnboardingWizard({ state }: { state: OnboardingState }) {
  const router = useRouter();
  const progressInput = useMemo(
    () => ({
      clinic: {
        logoUrl: state.clinic.logoUrl,
        addressLine1: state.clinic.addressLine1,
        city: state.clinic.city,
        pincode: state.clinic.pincode,
        gstin: state.clinic.gstin,
        pan: state.clinic.pan,
        businessEntity: state.clinic.businessEntity,
        feeItemCount: state.clinic.feeItemCount,
        phoneVerifiedAt: state.clinic.phoneVerifiedAt,
        description: state.clinic.description,
        isPublicListed: state.clinic.isPublicListed,
        website: state.clinic.website,
        languages: state.clinic.languages,
        facilities: state.clinic.facilities,
      },
    }),
    [state],
  );

  const initialResume = resolveResumeStep(0, progressInput);
  const [step, setStep] = useState(initialResume);
  const [maxReached, setMaxReached] = useState(initialResume);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [clinicType, setClinicType] = useState(state.clinic.clinicType);
  const [logoUrl, setLogoUrl] = useState(state.clinic.logoUrl ?? "");

  const [address, setAddress] = useState<ClinicAddressValue>({
    addressLine1: state.clinic.addressLine1 ?? "",
    addressLine2: state.clinic.addressLine2 ?? "",
    area: state.clinic.area ?? "",
    city: state.clinic.city ?? "",
    state: state.clinic.state ?? "",
    pincode: state.clinic.pincode ?? "",
    landmark: state.clinic.landmark ?? "",
    mapsUrl: state.clinic.mapsUrl ?? "",
    latitude:
      state.clinic.latitude != null
        ? Number(state.clinic.latitude).toFixed(6)
        : "",
    longitude:
      state.clinic.longitude != null
        ? Number(state.clinic.longitude).toFixed(6)
        : "",
  });
  const [gstin, setGstin] = useState(state.clinic.gstin ?? "");
  const [pan, setPan] = useState(state.clinic.pan ?? "");
  const [businessEntity, setBusinessEntity] = useState(
    state.clinic.businessEntity ?? "",
  );
  const [seedFees, setSeedFees] = useState(state.clinic.feeItemCount === 0);
  const [feeItemCount, setFeeItemCount] = useState(state.clinic.feeItemCount);

  const [slug, setSlug] = useState(state.suggestedSlug);
  const [description, setDescription] = useState(
    state.clinic.description ?? "",
  );
  const [website, setWebsite] = useState(state.clinic.website ?? "");
  const [isPublicListed, setIsPublicListed] = useState(
    state.clinic.isPublicListed,
  );
  const [bookingEnabled, setBookingEnabled] = useState(
    state.clinic.bookingEnabled,
  );
  const [hours, setHours] = useState<ClinicHourRow[]>(state.clinic.clinicHours);
  const [phoneVerified, setPhoneVerified] = useState(
    Boolean(state.clinic.phoneVerifiedAt),
  );
  const [otpCode, setOtpCode] = useState("");
  const [otpHint, setOtpHint] = useState<string | null>(null);

  const [languages, setLanguages] = useState<Set<string>>(
    () => new Set(state.clinic.languages),
  );
  const [facilities, setFacilities] = useState<Set<string>>(
    () => new Set(state.clinic.facilities),
  );

  const clinicId = state.clinic.id;
  const currentMeta = ONBOARDING_STEPS[step];
  const isRevisiting = step < maxReached;
  const progressPct = Math.round((maxReached / ONBOARDING_LAST_STEP) * 100);
  const didHydrateProgress = useRef(false);

  const previewPath = slug ? `/clinics/${slug}` : null;

  useEffect(() => {
    const stored = readStoredOnboardingStep(clinicId);
    const resume = resolveResumeStep(stored, progressInput);
    setMaxReached((prev) => Math.max(prev, resume, stored));
    if (!didHydrateProgress.current) {
      setStep(resume);
      didHydrateProgress.current = true;
    }
  }, [clinicId, progressInput]);

  useEffect(() => {
    const html = document.documentElement;
    const { body } = document;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, []);

  const goForward = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(0, next), ONBOARDING_LAST_STEP);
      setMaxReached((prev) => {
        const updated = Math.max(prev, clamped);
        writeStoredOnboardingStep(clinicId, updated);
        return updated;
      });
      setStep(clamped);
      setMessage(null);
    },
    [clinicId],
  );

  function goToStep(index: number) {
    if (index <= maxReached) {
      setStep(index);
      setMessage(null);
    }
  }

  function toggleLanguage(lang: string) {
    setLanguages((prev) => {
      const next = new Set(prev);
      if (next.has(lang)) next.delete(lang);
      else next.add(lang);
      return next;
    });
  }

  function toggleFacility(facility: string) {
    setFacilities((prev) => {
      const next = new Set(prev);
      if (next.has(facility)) next.delete(facility);
      else next.add(facility);
      return next;
    });
  }

  function updateHour(dayOfWeek: number, patch: Partial<ClinicHourRow>) {
    setHours((prev) =>
      prev.map((row) =>
        row.dayOfWeek === dayOfWeek ? { ...row, ...patch } : row,
      ),
    );
  }

  function saveIdentity(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const detected =
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "";
    fd.set("timezone", detected || "Asia/Kolkata");
    startTransition(async () => {
      const result = await saveOnboardingIdentity(fd);
      if (!result.success) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMessage({ type: "success", text: "Clinic identity saved." });
      goForward(step + 1);
      router.refresh();
    });
  }

  function saveBilling(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await saveOnboardingBillingAddress(fd);
      if (!result.success) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      if (seedFees && feeItemCount === 0) {
        setFeeItemCount(1);
      }
      setMessage({ type: "success", text: "Billing & address saved." });
      goForward(step + 1);
      router.refresh();
    });
  }

  function sendPhoneOtp() {
    startTransition(async () => {
      const result = await requestClinicPhoneOtp();
      if (!result.success) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      if (result.data.dryRunHint === "Already verified.") {
        setPhoneVerified(true);
      }
      setOtpHint(result.data.dryRunHint ?? null);
      setMessage({
        type: "success",
        text: result.data.dryRunHint
          ? `OTP sent. ${result.data.dryRunHint}`
          : "OTP sent to clinic phone.",
      });
    });
  }

  function verifyPhone() {
    const fd = new FormData();
    fd.set("code", otpCode);
    startTransition(async () => {
      const result = await verifyClinicPhoneOtp(fd);
      if (!result.success) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setPhoneVerified(true);
      setOtpCode("");
      setOtpHint(null);
      setMessage({ type: "success", text: "Clinic phone verified." });
      router.refresh();
    });
  }

  function savePublicProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await saveOnboardingPublicProfile(fd);
      if (!result.success) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMessage({ type: "success", text: "Public profile saved." });
      goForward(step + 1);
      router.refresh();
    });
  }

  function saveDirectory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await saveOnboardingDirectoryExtras(fd);
      if (!result.success) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMessage({ type: "success", text: "Directory extras saved." });
      goForward(step + 1);
      router.refresh();
    });
  }

  function finish() {
    startTransition(async () => {
      const result = await completeOnboarding();
      if (!result.success) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      clearStoredOnboardingStep(clinicId);
      router.push("/queue");
      router.refresh();
    });
  }

  function skip() {
    startTransition(async () => {
      const result = await skipOnboarding();
      if (!result.success) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      clearStoredOnboardingStep(clinicId);
      router.push("/queue");
      router.refresh();
    });
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-row overflow-hidden overscroll-none bg-card">
      {/* Left: fixed logo header; form body scrolls */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-6 py-5 md:px-10">
          <BrandLogo size="sm" priority />
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          <div className="mx-auto flex w-full max-w-xl flex-col px-6 py-6 md:px-10 md:py-8">
          <div className="mb-6 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-medium text-primary">Clinic setup</p>
              <Badge
                variant="secondary"
                className="h-6 border border-primary/25 bg-primary/15 px-2.5 text-primary shadow-[0_1px_2px_rgba(27,73,101,0.08)]"
              >
                {PLAN_LABELS[state.clinic.plan] ?? "Free"}
                {state.clinic.subscriptionStatus === "trialing"
                  ? " · Trial"
                  : ""}
              </Badge>
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">
              {state.clinic.name}
            </h1>
          </div>

          <div
            className="mb-5 h-1 overflow-hidden rounded-full bg-surface-muted"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Onboarding progress"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <nav aria-label="Onboarding steps" className="mb-5">
            <ol className="flex flex-wrap gap-2">
              {ONBOARDING_STEPS.map((s, index) => {
                const isCurrent = index === step;
                const isCompleted =
                  index !== step && (index < step || index < maxReached);
                const isClickable = index <= maxReached;

                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => goToStep(index)}
                      disabled={!isClickable}
                      aria-current={isCurrent ? "step" : undefined}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium shadow-sm transition-[color,background-color,border-color,box-shadow] duration-150",
                        isCurrent
                          ? "border-primary bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(95,168,211,0.45)]"
                          : isCompleted
                            ? "border-primary/35 bg-primary/20 text-primary shadow-[0_1px_3px_rgba(27,73,101,0.12)] hover:bg-primary/25"
                            : isClickable
                              ? "border-border bg-surface-muted text-ink shadow-[0_1px_2px_rgba(27,73,101,0.08)] hover:border-primary/35 hover:bg-surface-tint"
                              : "cursor-not-allowed border-transparent bg-surface/70 text-muted-foreground shadow-none",
                      )}
                    >
                      {isCompleted ? (
                        <span
                          className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                          aria-hidden
                        >
                          <Icon
                            icon={faCheck}
                            className="size-3 text-primary-foreground"
                          />
                        </span>
                      ) : (
                        <span
                          className={cn(
                            "flex size-5 items-center justify-center rounded-full text-[11px] font-semibold",
                            isCurrent
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-border/60 text-muted-foreground",
                          )}
                          aria-hidden
                        >
                          {index + 1}
                        </span>
                      )}
                      <span>{s.label}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          {message ? (
            <Banner
              variant={message.type === "error" ? "error" : "success"}
              className="mb-4"
            >
              {message.text}
            </Banner>
          ) : null}

          <div className="flex flex-col">
            {step !== ONBOARDING_LAST_STEP ? (
              <div className="mb-4 flex flex-col gap-1">
                <h2 className="font-display text-xl font-semibold text-ink">
                  {currentMeta.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {currentMeta.description}
                </p>
              </div>
            ) : null}

            {step === 0 ? (
              <form
                onSubmit={saveIdentity}
                className="flex flex-col"
              >
                <StepBody>
                  <div className="flex flex-col gap-5">
                    <Select
                      label="Clinic type"
                      name="clinicType"
                      options={[...CLINIC_TYPE_OPTIONS]}
                      value={clinicType}
                      onChange={(e) =>
                        setClinicType(e.target.value as typeof clinicType)
                      }
                      required
                      allowClear={false}
                    />
                    <ClinicLogoUpload
                      value={logoUrl}
                      onChange={setLogoUrl}
                      onMessage={setMessage}
                      disabled={pending}
                    />
                  </div>
                </StepBody>
                <StepActions
                  left={
                    !isRevisiting ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={skip}
                        disabled={pending}
                      >
                        Skip for now
                      </Button>
                    ) : null
                  }
                  right={
                    isRevisiting ? (
                      <>
                        <Button
                          type="submit"
                          variant="secondary"
                          loading={pending}
                        >
                          Save changes
                        </Button>
                        <Button
                          type="button"
                          onClick={() => goForward(step + 1)}
                          disabled={pending}
                        >
                          Continue
                        </Button>
                      </>
                    ) : (
                      <Button type="submit" loading={pending}>
                        Save and continue
                      </Button>
                    )
                  }
                />
              </form>
            ) : null}

            {step === 1 ? (
              <form
                onSubmit={saveBilling}
                className="flex flex-col"
              >
                <StepBody>
                  <div className="flex flex-col gap-5">
                    <ClinicAddressFields
                      value={address}
                      onChange={setAddress}
                      required={false}
                    />
                    <Select
                      label="Business entity"
                      name="businessEntity"
                      options={[...BUSINESS_ENTITY_OPTIONS]}
                      value={businessEntity}
                      onChange={(e) => setBusinessEntity(e.target.value)}
                      allowClear
                      clearLabel="Select entity type"
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label="GSTIN (optional)"
                        name="gstin"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value.toUpperCase())}
                        placeholder="15-character GSTIN"
                      />
                      <Input
                        label="PAN (optional)"
                        name="pan"
                        value={pan}
                        onChange={(e) => setPan(e.target.value.toUpperCase())}
                        placeholder="ABCDE1234F"
                      />
                    </div>
                    <label
                      className={cn(
                        checkboxOptionClass(seedFees),
                        "items-start",
                      )}
                    >
                      <input
                        type="checkbox"
                        name="seedFees"
                        value="true"
                        checked={seedFees}
                        onChange={(e) => setSeedFees(e.target.checked)}
                        className="sr-only"
                      />
                      <CheckboxMark checked={seedFees} className="mt-0.5" />
                      <span>
                        <span className="font-medium text-ink">
                          Seed default fee items
                        </span>
                        <span className="mt-1 block text-muted-foreground">
                          {feeItemCount > 0
                            ? "You already have fee items; leave unchecked unless you want defaults again."
                            : "Adds common consultation and procedure fees to get billing started."}
                        </span>
                      </span>
                    </label>
                  </div>
                </StepBody>
                <StepActions
                  left={
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => goToStep(step - 1)}
                        disabled={pending}
                      >
                        Back
                      </Button>
                      {!isRevisiting ? (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={skip}
                          disabled={pending}
                        >
                          Skip for now
                        </Button>
                      ) : null}
                    </>
                  }
                  right={
                    isRevisiting ? (
                      <>
                        <Button
                          type="submit"
                          variant="secondary"
                          loading={pending}
                        >
                          Save changes
                        </Button>
                        <Button
                          type="button"
                          onClick={() => goForward(step + 1)}
                          disabled={pending}
                        >
                          Continue
                        </Button>
                      </>
                    ) : (
                      <Button type="submit" loading={pending}>
                        Save and continue
                      </Button>
                    )
                  }
                />
              </form>
            ) : null}

            {step === 2 ? (
              <form
                onSubmit={savePublicProfile}
                className="flex flex-col"
              >
                <StepBody>
                <div className="flex flex-col gap-5">
                  <Input
                    label="Public URL slug"
                    name="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required={isPublicListed}
                  />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink">
                      Short description
                    </label>
                    <textarea
                      name="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      placeholder="What patients should know about your clinic"
                    />
                  </div>
                  <Input
                    label="Website (optional)"
                    name="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://"
                  />
                  <input type="hidden" name="landmark" value={address.landmark} />
                  <input type="hidden" name="mapsUrl" value={address.mapsUrl} />

                  <fieldset className="flex flex-col gap-3 border-t border-border/60 pt-5">
                    <legend className="text-sm font-medium text-ink">
                      Front-desk clinic hours
                    </legend>
                    <p className="text-xs text-muted-foreground">
                      Shown on your public page (separate from doctor booking
                      slots).
                    </p>
                    {hours
                      .slice()
                      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                      .map((row) => (
                        <div
                          key={row.dayOfWeek}
                          className="grid grid-cols-[7rem_1fr_1fr_auto] items-center gap-2"
                        >
                          <span className="text-sm text-ink">
                            {DAY_FULL[row.dayOfWeek]}
                          </span>
                          <input
                            type="hidden"
                            name={`hoursOpen_${row.dayOfWeek}`}
                            value={row.open}
                          />
                          <input
                            type="hidden"
                            name={`hoursClose_${row.dayOfWeek}`}
                            value={row.close}
                          />
                          <Input
                            label=""
                            aria-label={`${DAY_FULL[row.dayOfWeek]} open`}
                            type="time"
                            value={row.open}
                            disabled={row.closed}
                            onChange={(e) =>
                              updateHour(row.dayOfWeek, {
                                open: e.target.value,
                              })
                            }
                          />
                          <Input
                            label=""
                            aria-label={`${DAY_FULL[row.dayOfWeek]} close`}
                            type="time"
                            value={row.close}
                            disabled={row.closed}
                            onChange={(e) =>
                              updateHour(row.dayOfWeek, {
                                close: e.target.value,
                              })
                            }
                          />
                          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <input
                              type="checkbox"
                              name={`hoursClosed_${row.dayOfWeek}`}
                              value="true"
                              checked={row.closed}
                              onChange={(e) =>
                                updateHour(row.dayOfWeek, {
                                  closed: e.target.checked,
                                })
                              }
                            />
                            Closed
                          </label>
                        </div>
                      ))}
                  </fieldset>

                  <div className="flex flex-col gap-4 rounded-xl border border-border/80 bg-surface-muted px-4 py-4 shadow-[0_1px_3px_rgba(27,73,101,0.08)]">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-ink">
                        Verify clinic phone
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Phone on file:{" "}
                        <span className="font-medium tabular-nums text-ink">
                          {state.clinic.phone || "Not set"}
                        </span>
                      </p>
                    </div>
                    {phoneVerified ? (
                      <Banner variant="success">Phone verified.</Banner>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            loading={pending}
                            onClick={sendPhoneOtp}
                            disabled={!state.clinic.phone}
                          >
                            Send OTP
                          </Button>
                          {otpHint ? (
                            <p className="text-xs text-muted-foreground">
                              {otpHint}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              We&apos;ll text a 6-digit code to this number.
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-3">
                          <label
                            htmlFor="clinic-phone-otp"
                            className="text-sm font-medium text-ink"
                          >
                            Enter OTP
                          </label>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <OtpCodeInput
                              id="clinic-phone-otp"
                              value={otpCode}
                              onChange={setOtpCode}
                              disabled={pending || !state.clinic.phone}
                              onComplete={(code) => {
                                setOtpCode(code);
                              }}
                            />
                            <Button
                              type="button"
                              loading={pending}
                              disabled={otpCode.length !== 6}
                              onClick={verifyPhone}
                              className="sm:self-center"
                            >
                              Verify
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <label
                    className={cn(
                      checkboxOptionClass(isPublicListed),
                      "items-start",
                      !phoneVerified && "opacity-60",
                    )}
                  >
                    <input
                      type="checkbox"
                      name="isPublicListed"
                      value="true"
                      checked={isPublicListed}
                      disabled={!phoneVerified}
                      onChange={(e) => setIsPublicListed(e.target.checked)}
                      className="sr-only"
                    />
                    <CheckboxMark checked={isPublicListed} className="mt-0.5" />
                    <span>
                      <span className="font-medium text-ink">
                        List clinic publicly
                      </span>
                      <span className="mt-1 block text-muted-foreground">
                        Appear on /clinics for patient discovery.
                        {!phoneVerified ? " Verify your phone first." : null}
                      </span>
                    </span>
                  </label>
                  <label
                    className={cn(
                      checkboxOptionClass(bookingEnabled),
                      "items-start",
                    )}
                  >
                    <input
                      type="checkbox"
                      name="bookingEnabled"
                      value="true"
                      checked={bookingEnabled}
                      onChange={(e) => setBookingEnabled(e.target.checked)}
                      className="sr-only"
                    />
                    <CheckboxMark checked={bookingEnabled} className="mt-0.5" />
                    <span>
                      <span className="font-medium text-ink">
                        Enable online booking
                      </span>
                      <span className="mt-1 block text-muted-foreground">
                        Patients can self-book available slots.
                      </span>
                    </span>
                  </label>
                </div>
                </StepBody>
                <StepActions
                  left={
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => goToStep(step - 1)}
                        disabled={pending}
                      >
                        Back
                      </Button>
                      {!isRevisiting ? (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={skip}
                          disabled={pending}
                        >
                          Skip for now
                        </Button>
                      ) : null}
                    </>
                  }
                  right={
                    isRevisiting ? (
                      <>
                        <Button
                          type="submit"
                          variant="secondary"
                          loading={pending}
                        >
                          Save changes
                        </Button>
                        <Button
                          type="button"
                          onClick={() => goForward(step + 1)}
                          disabled={pending}
                        >
                          Continue
                        </Button>
                      </>
                    ) : (
                      <Button type="submit" loading={pending}>
                        Save and continue
                      </Button>
                    )
                  }
                />
              </form>
            ) : null}

            {step === 3 ? (
              <form
                onSubmit={saveDirectory}
                className="flex flex-col"
              >
                <StepBody>
                <div className="flex flex-col gap-6">
                  <fieldset>
                    <legend className="mb-2 text-sm font-medium text-ink">
                      Languages spoken
                    </legend>
                    <p className="mb-3 text-xs text-muted-foreground">
                      Shown on your public clinic directory listing.
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {CLINIC_LANGUAGE_OPTIONS.map((lang) => (
                        <CheckboxOption
                          key={lang}
                          name="languages"
                          value={lang}
                          checked={languages.has(lang)}
                          onChange={() => toggleLanguage(lang)}
                        >
                          {lang}
                        </CheckboxOption>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset className="border-t border-border/60 pt-6">
                    <legend className="mb-2 text-sm font-medium text-ink">
                      Facilities
                    </legend>
                    <p className="mb-3 text-xs text-muted-foreground">
                      Help patients know what to expect on arrival.
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {CLINIC_FACILITY_OPTIONS.map((facility) => (
                        <CheckboxOption
                          key={facility}
                          name="facilities"
                          value={facility}
                          checked={facilities.has(facility)}
                          onChange={() => toggleFacility(facility)}
                        >
                          {facility}
                        </CheckboxOption>
                      ))}
                    </div>
                  </fieldset>
                </div>
                </StepBody>
                <StepActions
                  left={
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => goToStep(step - 1)}
                      disabled={pending}
                    >
                      Back
                    </Button>
                  }
                  right={
                    isRevisiting ? (
                      <>
                        <Button
                          type="submit"
                          variant="secondary"
                          loading={pending}
                        >
                          Save changes
                        </Button>
                        <Button
                          type="button"
                          onClick={() => goForward(step + 1)}
                          disabled={pending}
                        >
                          Continue
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => goForward(step + 1)}
                          disabled={pending}
                        >
                          Skip for now
                        </Button>
                        <Button type="submit" loading={pending}>
                          Save and continue
                        </Button>
                      </>
                    )
                  }
                />
              </form>
            ) : null}

            {step === ONBOARDING_LAST_STEP ? (
              <div className="flex flex-col">
                <div className="mb-4 flex shrink-0 flex-col gap-1">
                  <h2 className="font-display text-xl font-semibold text-ink">
                    You&apos;re ready
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Review what you&apos;ve set up, then go live.
                  </p>
                </div>
                <StepBody>
                <ul className="flex flex-col gap-2.5 border-t border-border/60 pt-5 text-sm text-muted-foreground">
                  <li>
                    Type:{" "}
                    <span className="font-medium text-ink">
                      {
                        CLINIC_TYPE_OPTIONS.find((o) => o.value === clinicType)
                          ?.label
                      }
                    </span>
                  </li>
                  <li>
                    Billing address:{" "}
                    <span className="font-medium text-ink">
                      {address.addressLine1 || address.city || address.pincode
                        ? "Saved"
                        : "Not set yet"}
                    </span>
                  </li>
                  <li>
                    Fees seeded:{" "}
                    <span className="font-medium text-ink">
                      {feeItemCount > 0 ? "Yes" : "Not yet"}
                    </span>
                  </li>
                  <li>
                    Phone verified:{" "}
                    <span className="font-medium text-ink">
                      {phoneVerified ? "Yes" : "Not yet"}
                    </span>
                  </li>
                  <li>
                    Public listing:{" "}
                    <span className="font-medium text-ink">
                      {isPublicListed ? "On" : "Off"}
                    </span>
                  </li>
                  <li>
                    Online booking:{" "}
                    <span className="font-medium text-ink">
                      {bookingEnabled ? "On" : "Off"}
                    </span>
                  </li>
                  <li>
                    Directory extras:{" "}
                    <span className="font-medium text-ink">
                      {languages.size || facilities.size
                        ? `${languages.size} language(s), ${facilities.size} facility(ies)`
                        : "Not set yet"}
                    </span>
                  </li>
                </ul>
                {previewPath && isPublicListed ? (
                  <Banner variant="info" className="mt-5">
                    Preview your clinic page at{" "}
                    <Link
                      href={previewPath}
                      className="font-medium underline underline-offset-2"
                      target="_blank"
                    >
                      {previewPath}
                    </Link>
                  </Banner>
                ) : null}
                </StepBody>
                <StepActions
                  left={
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => goToStep(step - 1)}
                    >
                      Back
                    </Button>
                  }
                  right={
                    <Button type="button" loading={pending} onClick={finish}>
                      Finish setup
                    </Button>
                  }
                />
              </div>
            ) : null}
          </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <aside
        className="relative hidden h-full min-h-0 shrink-0 overflow-hidden border-l border-border lg:block lg:w-[min(55vw,40rem)] xl:w-[min(55vw,44rem)]"
        aria-hidden
      >
        <Image
          src="/landing/signup-panel-architecture.png"
          alt="Clinic architecture and care spaces"
          fill
          priority
          sizes="(min-width: 1024px) 55vw, 0px"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-linear-to-t from-surface-deep/85 via-surface-deep/35 to-surface-deep/10" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-10 xl:p-12">
          <p className="font-display text-3xl font-semibold leading-tight tracking-tight text-white xl:text-4xl">
            Set up once. Run every day.
          </p>
          <p className="max-w-md text-sm leading-relaxed text-white/80 xl:text-base">
            Listing and hours — so patients can find you and your team can
            work without friction.
          </p>
        </div>
      </aside>
    </div>
  );
}

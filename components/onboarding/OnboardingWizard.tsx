"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { inviteStaff } from "@/actions/auth";
import {
  completeOnboarding,
  saveOnboardingIdentity,
  saveOnboardingPublicProfile,
  saveOnboardingSchedule,
  skipOnboarding,
  uploadClinicLogo,
  type OnboardingState,
} from "@/actions/onboarding";
import {
  requestClinicPhoneOtp,
  saveOnboardingBillingAddress,
  saveOnboardingDirectoryExtras,
  saveOnboardingOpsDefaults,
  verifyClinicPhoneOtp,
} from "@/actions/onboarding-medium";
import {
  ClinicAddressFields,
  type ClinicAddressValue,
} from "@/components/settings/ClinicAddressFields";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  BUSINESS_ENTITY_OPTIONS,
  CLINIC_FACILITY_OPTIONS,
  CLINIC_LANGUAGE_OPTIONS,
  CLINIC_TIMEZONE_OPTIONS,
  CLINIC_TYPE_OPTIONS,
  type ClinicHourRow,
} from "@/lib/clinic-onboarding";
import { PRESCRIPTION_LAYOUTS } from "@/lib/prescription-layouts";
import { DOCTOR_SPECIALTY_OPTIONS } from "@/lib/staff-profile";

const WEEKDAYS = [
  { value: "1", label: "Mon" },
  { value: "2", label: "Tue" },
  { value: "3", label: "Wed" },
  { value: "4", label: "Thu" },
  { value: "5", label: "Fri" },
  { value: "6", label: "Sat" },
  { value: "0", label: "Sun" },
];

const DAY_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const STEPS = [
  "Clinic identity",
  "Billing & address",
  "Public profile",
  "Directory extras",
  "Schedule",
  "Ops defaults",
  "Invite staff",
  "Done",
] as const;

const PRESCRIPTION_LAYOUT_OPTIONS = PRESCRIPTION_LAYOUTS.map((layout) => ({
  value: layout.id,
  label: layout.name,
}));

export function OnboardingWizard({ state }: { state: OnboardingState }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [clinicType, setClinicType] = useState(state.clinic.clinicType);
  const [timezone, setTimezone] = useState(state.clinic.timezone);
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

  const [hasAvailability, setHasAvailability] = useState(state.hasAvailability);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(
    () => new Set(["1", "2", "3", "4", "5"]),
  );
  const [doctorId, setDoctorId] = useState(
    state.consultingDoctors[0]?.id ?? "",
  );

  const [prescriptionLayout, setPrescriptionLayout] = useState(
    state.clinic.prescriptionLayout || "classic",
  );
  const [smsEnabled, setSmsEnabled] = useState(
    Boolean(state.clinic.messagingConfig.smsEnabled),
  );
  const [whatsappEnabled, setWhatsappEnabled] = useState(
    Boolean(state.clinic.messagingConfig.whatsappEnabled),
  );
  const [appointmentReminders, setAppointmentReminders] = useState(
    Boolean(state.clinic.messagingConfig.appointmentReminders),
  );
  const [dryRun, setDryRun] = useState(
    state.clinic.messagingConfig.dryRun !== false,
  );
  const [senderId, setSenderId] = useState(
    state.clinic.messagingConfig.senderId ?? "",
  );
  const [razorpayKeyId, setRazorpayKeyId] = useState(
    state.clinic.razorpayKeyId ?? "",
  );

  const [staffCount, setStaffCount] = useState(state.staffCount);
  const [inviteSkipped, setInviteSkipped] = useState(false);
  const [inviteRole, setInviteRole] = useState("receptionist");

  const needsStaffEmphasis =
    clinicType === "multi_doctor" || clinicType === "polyclinic";
  const previewPath = slug ? `/clinics/${slug}` : null;

  const scheduleHint = useMemo(() => {
    if (clinicType === "solo") {
      return "Set the hours patients can book with you.";
    }
    if (clinicType === "hospital_opd") {
      return "OPD slots often fill early — keep slot length short if needed.";
    }
    return "Configure the first doctor's bookable hours. You can add more later.";
  }, [clinicType]);

  function toggleDay(day: string) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
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

  function onLogoFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      startTransition(async () => {
        const upload = await uploadClinicLogo({
          fileName: file.name,
          mimeType: file.type || "image/png",
          base64,
        });
        if (!upload.success) {
          setMessage({ type: "error", text: upload.error });
          return;
        }
        setLogoUrl(upload.data.logoUrl);
        setMessage({ type: "success", text: "Logo uploaded." });
      });
    };
    reader.readAsDataURL(file);
  }

  function saveIdentity(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await saveOnboardingIdentity(fd);
      if (!result.success) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMessage({ type: "success", text: "Clinic identity saved." });
      setStep(1);
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
      setStep(2);
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
      setStep(3);
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
      setStep(4);
      router.refresh();
    });
  }

  function saveSchedule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await saveOnboardingSchedule(fd);
      if (!result.success) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setHasAvailability(true);
      setMessage({ type: "success", text: "Weekly schedule saved." });
      setStep(5);
      router.refresh();
    });
  }

  function saveOps(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await saveOnboardingOpsDefaults(fd);
      if (!result.success) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMessage({ type: "success", text: "Ops defaults saved." });
      setStep(6);
      router.refresh();
    });
  }

  function sendInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await inviteStaff(fd);
      if (!result.success) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setStaffCount((n) => n + 1);
      setMessage({
        type: "success",
        text: `Invite sent to ${result.data.email}.`,
      });
      e.currentTarget.reset();
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
      router.push("/queue");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 md:px-0">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-primary">Clinic setup</p>
        <h1 className="font-display text-2xl font-semibold text-ink md:text-3xl">
          Go live with {state.clinic.name}
        </h1>
        <p className="text-sm text-muted-foreground">{state.planBlurb}</p>
        <Link
          href="/settings/subscription"
          className="text-sm text-primary underline-offset-2 hover:underline"
        >
          View plans & subscription
        </Link>
      </div>

      <ol className="flex flex-wrap gap-2">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              index === step
                ? "bg-primary text-primary-foreground"
                : index < step
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      {message ? (
        <Banner variant={message.type === "error" ? "error" : "success"}>
          {message.text}
        </Banner>
      ) : null}

      {step === 0 ? (
        <form
          onSubmit={saveIdentity}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
        >
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
          <Select
            label="Timezone"
            name="timezone"
            options={[...CLINIC_TIMEZONE_OPTIONS]}
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            required
            allowClear={false}
          />
          <div className="flex flex-col gap-2">
            <Input
              label="Logo URL (optional)"
              name="logoUrl"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://…"
            />
            <label className="text-sm text-muted-foreground">
              Or upload an image
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="mt-1 block w-full text-sm"
                onChange={(e) => onLogoFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Clinic logo preview"
                className="mt-2 h-16 w-16 rounded-lg border border-border object-contain bg-white"
              />
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={pending}>
              Save and continue
            </Button>
            <Button type="button" variant="ghost" onClick={skip} disabled={pending}>
              Skip for now
            </Button>
          </div>
        </form>
      ) : null}

      {step === 1 ? (
        <form
          onSubmit={saveBilling}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
        >
          <ClinicAddressFields
            value={address}
            onChange={setAddress}
            required={false}
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
          <Select
            label="Business entity"
            name="businessEntity"
            options={[...BUSINESS_ENTITY_OPTIONS]}
            value={businessEntity}
            onChange={(e) => setBusinessEntity(e.target.value)}
            allowClear
            clearLabel="Select entity type"
          />
          <label className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm">
            <input
              type="checkbox"
              name="seedFees"
              value="true"
              checked={seedFees}
              onChange={(e) => setSeedFees(e.target.checked)}
              className="mt-1 size-4"
            />
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
          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={pending}>
              Save and continue
            </Button>
            <Button type="button" variant="ghost" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button type="button" variant="ghost" onClick={skip} disabled={pending}>
              Skip for now
            </Button>
          </div>
        </form>
      ) : null}

      {step === 2 ? (
        <form
          onSubmit={savePublicProfile}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
        >
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
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
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

          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium text-ink">
              Front-desk clinic hours
            </legend>
            <p className="text-xs text-muted-foreground">
              Shown on your public page (separate from doctor booking slots).
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
                  <input type="hidden" name={`hoursOpen_${row.dayOfWeek}`} value={row.open} />
                  <input type="hidden" name={`hoursClose_${row.dayOfWeek}`} value={row.close} />
                  <Input
                    label=""
                    aria-label={`${DAY_FULL[row.dayOfWeek]} open`}
                    type="time"
                    value={row.open}
                    disabled={row.closed}
                    onChange={(e) =>
                      updateHour(row.dayOfWeek, { open: e.target.value })
                    }
                  />
                  <Input
                    label=""
                    aria-label={`${DAY_FULL[row.dayOfWeek]} close`}
                    type="time"
                    value={row.close}
                    disabled={row.closed}
                    onChange={(e) =>
                      updateHour(row.dayOfWeek, { close: e.target.value })
                    }
                  />
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      name={`hoursClosed_${row.dayOfWeek}`}
                      value="true"
                      checked={row.closed}
                      onChange={(e) =>
                        updateHour(row.dayOfWeek, { closed: e.target.checked })
                      }
                    />
                    Closed
                  </label>
                </div>
              ))}
          </fieldset>

          <div className="flex flex-col gap-3 rounded-xl border border-border p-3">
            <p className="text-sm font-medium text-ink">Verify clinic phone</p>
            <p className="text-sm text-muted-foreground">
              Phone on file:{" "}
              <span className="font-medium text-ink">
                {state.clinic.phone || "Not set"}
              </span>
            </p>
            {phoneVerified ? (
              <Banner variant="success">Phone verified.</Banner>
            ) : (
              <>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    loading={pending}
                    onClick={sendPhoneOtp}
                    disabled={!state.clinic.phone}
                  >
                    Send OTP
                  </Button>
                </div>
                {otpHint ? (
                  <p className="text-xs text-muted-foreground">{otpHint}</p>
                ) : null}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <Input
                    label="6-digit OTP"
                    name="code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                  />
                  <Button
                    type="button"
                    loading={pending}
                    disabled={otpCode.length !== 6}
                    onClick={verifyPhone}
                  >
                    Verify
                  </Button>
                </div>
              </>
            )}
          </div>

          <label
            className={`flex items-start gap-3 rounded-xl border border-border p-3 text-sm ${
              !phoneVerified ? "opacity-60" : ""
            }`}
          >
            <input
              type="checkbox"
              name="isPublicListed"
              value="true"
              checked={isPublicListed}
              disabled={!phoneVerified}
              onChange={(e) => setIsPublicListed(e.target.checked)}
              className="mt-1 size-4"
            />
            <span>
              <span className="font-medium text-ink">List clinic publicly</span>
              <span className="mt-1 block text-muted-foreground">
                Appear on /clinics for patient discovery.
                {!phoneVerified
                  ? " Verify your phone first."
                  : null}
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm">
            <input
              type="checkbox"
              name="bookingEnabled"
              value="true"
              checked={bookingEnabled}
              onChange={(e) => setBookingEnabled(e.target.checked)}
              className="mt-1 size-4"
            />
            <span>
              <span className="font-medium text-ink">Enable online booking</span>
              <span className="mt-1 block text-muted-foreground">
                Patients can self-book available slots.
              </span>
            </span>
          </label>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={pending}>
              Save and continue
            </Button>
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="button" variant="ghost" onClick={skip} disabled={pending}>
              Skip for now
            </Button>
          </div>
        </form>
      ) : null}

      {step === 3 ? (
        <form
          onSubmit={saveDirectory}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
        >
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-ink">
              Languages spoken
            </legend>
            <p className="mb-3 text-xs text-muted-foreground">
              Shown on your public clinic directory listing.
            </p>
            <div className="flex flex-wrap gap-2">
              {CLINIC_LANGUAGE_OPTIONS.map((lang) => {
                const checked = languages.has(lang);
                return (
                  <label
                    key={lang}
                    className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${
                      checked
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="languages"
                      value={lang}
                      checked={checked}
                      onChange={() => toggleLanguage(lang)}
                      className="sr-only"
                    />
                    {lang}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-ink">
              Facilities
            </legend>
            <p className="mb-3 text-xs text-muted-foreground">
              Help patients know what to expect on arrival.
            </p>
            <div className="flex flex-wrap gap-2">
              {CLINIC_FACILITY_OPTIONS.map((facility) => {
                const checked = facilities.has(facility);
                return (
                  <label
                    key={facility}
                    className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${
                      checked
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="facilities"
                      value={facility}
                      checked={checked}
                      onChange={() => toggleFacility(facility)}
                      className="sr-only"
                    />
                    {facility}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={pending}>
              Save and continue
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep(4)}
              disabled={pending}
            >
              Skip for now
            </Button>
            <Button type="button" variant="ghost" onClick={() => setStep(2)}>
              Back
            </Button>
          </div>
        </form>
      ) : null}

      {step === 4 ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">{scheduleHint}</p>
          {!state.consultingDoctors.length ? (
            <>
              <Banner variant="info">
                No consulting doctor profile yet. Invite a doctor later, or
                continue without a schedule.
              </Banner>
              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={() => setStep(5)}>
                  Continue to ops defaults
                </Button>
                <Button type="button" variant="ghost" onClick={() => setStep(3)}>
                  Back
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={saveSchedule} className="flex flex-col gap-4">
              <Select
                label="Doctor"
                name="doctorId"
                options={state.consultingDoctors.map((d) => ({
                  value: d.id,
                  label: d.specialty
                    ? `${d.name} · ${d.specialty}`
                    : d.name,
                }))}
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                required
              />
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-ink">
                  Days open
                </legend>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => {
                    const checked = selectedDays.has(day.value);
                    return (
                      <label
                        key={day.value}
                        className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${
                          checked
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        <input
                          type="checkbox"
                          name="days"
                          value={day.value}
                          checked={checked}
                          onChange={() => toggleDay(day.value)}
                          className="sr-only"
                        />
                        {day.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label="Start"
                  name="startTime"
                  type="time"
                  defaultValue="09:00"
                  required
                />
                <Input
                  label="End"
                  name="endTime"
                  type="time"
                  defaultValue="17:00"
                  required
                />
                <Input
                  label="Slot (min)"
                  name="slotDuration"
                  type="number"
                  min={5}
                  max={120}
                  defaultValue={15}
                  required
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" loading={pending}>
                  Save schedule
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(5)}
                  disabled={pending}
                >
                  Skip schedule
                </Button>
                <Button type="button" variant="ghost" onClick={() => setStep(3)}>
                  Back
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : null}

      {step === 5 ? (
        <form
          onSubmit={saveOps}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
        >
          <Select
            label="Prescription layout"
            name="prescriptionLayout"
            options={PRESCRIPTION_LAYOUT_OPTIONS}
            value={prescriptionLayout}
            onChange={(e) => setPrescriptionLayout(e.target.value)}
            allowClear={false}
            required
          />
          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium text-ink">Messaging</legend>
            <p className="text-xs text-muted-foreground">
              Fine-tune templates later in{" "}
              <Link
                href="/settings/notifications"
                className="text-primary underline-offset-2 hover:underline"
              >
                notification settings
              </Link>
              .
            </p>
            <label className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm">
              <input
                type="checkbox"
                name="smsEnabled"
                value="true"
                checked={smsEnabled}
                onChange={(e) => setSmsEnabled(e.target.checked)}
                className="mt-1 size-4"
              />
              <span className="font-medium text-ink">SMS notifications</span>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm">
              <input
                type="checkbox"
                name="whatsappEnabled"
                value="true"
                checked={whatsappEnabled}
                onChange={(e) => setWhatsappEnabled(e.target.checked)}
                className="mt-1 size-4"
              />
              <span className="font-medium text-ink">WhatsApp notifications</span>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm">
              <input
                type="checkbox"
                name="appointmentReminders"
                value="true"
                checked={appointmentReminders}
                onChange={(e) => setAppointmentReminders(e.target.checked)}
                className="mt-1 size-4"
              />
              <span className="font-medium text-ink">Appointment reminders</span>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm">
              <input
                type="checkbox"
                name="dryRun"
                value="true"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="mt-1 size-4"
              />
              <span>
                <span className="font-medium text-ink">Dry run mode</span>
                <span className="mt-1 block text-muted-foreground">
                  Log messages without sending while you test.
                </span>
              </span>
            </label>
            <Input
              label="Sender ID (optional)"
              name="senderId"
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              placeholder="e.g. CLINIC"
            />
          </fieldset>
          <div className="flex flex-col gap-1.5">
            <Input
              label="Razorpay key ID (optional)"
              name="razorpayKeyId"
              value={razorpayKeyId}
              onChange={(e) => setRazorpayKeyId(e.target.value)}
              placeholder="rzp_live_… or rzp_test_…"
            />
            <p className="text-xs text-muted-foreground">
              Only the public key ID is stored here. Keep your Razorpay secret
              in environment variables (never paste it into the app).
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={pending}>
              Save and continue
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep(6)}
              disabled={pending}
            >
              Skip for now
            </Button>
            <Button type="button" variant="ghost" onClick={() => setStep(4)}>
              Back
            </Button>
          </div>
        </form>
      ) : null}

      {step === 6 ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
          {needsStaffEmphasis ? (
            <Banner variant="info">
              Multi-doctor clinics work best with at least one invited staff
              member (doctor or front desk).
            </Banner>
          ) : (
            <p className="text-sm text-muted-foreground">
              Optionally invite a front desk user or another doctor now.
            </p>
          )}
          <p className="text-sm text-ink">
            Invited staff so far:{" "}
            <span className="font-medium">{staffCount}</span>
          </p>
          <form onSubmit={sendInvite} className="flex flex-col gap-4">
            <Input label="Name" name="name" required />
            <Input label="Email" name="email" type="email" required />
            <Select
              label="Role"
              name="role"
              options={[
                { value: "doctor", label: "Doctor" },
                { value: "receptionist", label: "Front desk / receptionist" },
                { value: "admin", label: "Admin" },
              ]}
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              allowClear={false}
              required
            />
            <Select
              label="Specialty (doctors)"
              name="specialty"
              options={DOCTOR_SPECIALTY_OPTIONS}
              allowClear
              clearLabel="Not a doctor / skip"
            />
            <Input
              label="Consultation fee (doctors, optional)"
              name="consultationFee"
              type="number"
              min={0}
            />
            <Button type="submit" loading={pending}>
              Send invite
            </Button>
          </form>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => {
                if (needsStaffEmphasis && staffCount === 0 && !inviteSkipped) {
                  setInviteSkipped(true);
                }
                setStep(7);
              }}
            >
              {staffCount > 0 || inviteSkipped || !needsStaffEmphasis
                ? "Continue"
                : "Skip invite for now"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setStep(5)}>
              Back
            </Button>
          </div>
        </div>
      ) : null}

      {step === 7 ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-semibold text-ink">
            You&apos;re ready
          </h2>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li>
              Type:{" "}
              <span className="font-medium text-ink">
                {CLINIC_TYPE_OPTIONS.find((o) => o.value === clinicType)?.label}
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
            <li>
              Schedule:{" "}
              <span className="font-medium text-ink">
                {hasAvailability ? "Saved" : "Not set yet"}
              </span>
            </li>
            <li>
              Rx layout:{" "}
              <span className="font-medium text-ink">
                {PRESCRIPTION_LAYOUTS.find((l) => l.id === prescriptionLayout)
                  ?.name ?? prescriptionLayout}
              </span>
            </li>
            <li>
              Staff invited:{" "}
              <span className="font-medium text-ink">{staffCount}</span>
              {needsStaffEmphasis && staffCount === 0 ? (
                <span className="text-amber-700"> (recommended)</span>
              ) : null}
            </li>
          </ul>
          {previewPath && isPublicListed ? (
            <Banner variant="info">
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
          <div className="flex flex-wrap gap-3">
            <Button type="button" loading={pending} onClick={finish}>
              Finish setup
            </Button>
            <Button type="button" variant="ghost" onClick={() => setStep(6)}>
              Back
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

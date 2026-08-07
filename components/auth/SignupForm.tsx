"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { signup } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { CheckboxOption } from "@/components/ui/CheckboxOption";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useServerActionForm } from "@/hooks/useServerActionForm";
import { CLINIC_SPECIALTIES } from "@/lib/clinic-specialties";

export function SignupForm() {
  const router = useRouter();
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [selectedSpecialties, setSelectedSpecialties] = useState<Set<string>>(
    () => new Set(),
  );
  const [isConsultingDoctor, setIsConsultingDoctor] = useState(true);
  const { handleSubmit, error, fieldError, pending, values, setValue } =
    useServerActionForm(signup, {
      onSuccess: () => router.push("/login?registered=1"),
    });

  const specialtyOptions = useMemo(
    () => CLINIC_SPECIALTIES.map((s) => ({ value: s, label: s })),
    [],
  );

  function toggleSpecialty(specialty: string) {
    setSelectedSpecialties((prev) => {
      const next = new Set(prev);
      if (next.has(specialty)) next.delete(specialty);
      else next.add(specialty);
      return next;
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    setConfirmError(null);
    const form = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;
    const confirm = (
      form.elements.namedItem("confirmPassword") as HTMLInputElement
    ).value;
    if (password !== confirm) {
      e.preventDefault();
      setConfirmError("Passwords do not match.");
      return;
    }
    handleSubmit(e);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-base font-semibold text-ink">
          Clinic details
        </h2>
        <Input
          label="Clinic name"
          name="clinicName"
          value={values.clinicName ?? ""}
          onChange={(e) => setValue("clinicName", e.target.value)}
          error={fieldError("clinicName")}
          required
        />
        <Input
          label="Clinic phone"
          name="clinicPhone"
          type="tel"
          value={values.clinicPhone ?? ""}
          onChange={(e) => setValue("clinicPhone", e.target.value)}
          error={fieldError("clinicPhone")}
          required
        />
        <Input
          label="Clinic email"
          name="clinicEmail"
          type="email"
          autoComplete="email"
          value={values.clinicEmail ?? ""}
          onChange={(e) => setValue("clinicEmail", e.target.value)}
          error={fieldError("clinicEmail")}
          required
        />
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink">
            Specialties <span className="text-danger">*</span>
          </legend>
          <p className="mb-3 text-xs text-muted-foreground">
            Select all that apply for your clinic.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {CLINIC_SPECIALTIES.map((specialty) => (
              <CheckboxOption
                key={specialty}
                name="specialties"
                value={specialty}
                checked={selectedSpecialties.has(specialty)}
                onChange={() => toggleSpecialty(specialty)}
              >
                {specialty}
              </CheckboxOption>
            ))}
          </div>
          {fieldError("specialties") ? (
            <p className="mt-1 text-sm text-danger" role="alert">
              {fieldError("specialties")}
            </p>
          ) : null}
        </fieldset>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-base font-semibold text-ink">
          Your account
        </h2>
        <Input
          label="Your name"
          name="adminName"
          value={values.adminName ?? ""}
          onChange={(e) => setValue("adminName", e.target.value)}
          error={fieldError("adminName")}
          required
        />
        <Input
          label="Login email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email ?? ""}
          onChange={(e) => setValue("email", e.target.value)}
          error={fieldError("email")}
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={values.password ?? ""}
          onChange={(e) => setValue("password", e.target.value)}
          error={fieldError("password")}
          required
        />
        <Input
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={values.confirmPassword ?? ""}
          onChange={(e) => setValue("confirmPassword", e.target.value)}
          error={confirmError ?? undefined}
          required
        />
      </section>

      <section className="flex flex-col gap-4">
        <label className="flex items-start gap-3 rounded-sm border border-border bg-card p-3 text-sm text-muted-foreground has-focus-visible:border-transparent has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
          <input
            type="checkbox"
            name="isConsultingDoctor"
            value="true"
            checked={isConsultingDoctor}
            onChange={(e) => setIsConsultingDoctor(e.target.checked)}
            className="mt-1 size-4 rounded-sm border border-input accent-primary outline-none focus:border-transparent focus:ring-3 focus:ring-ring/50"
          />
          <span>
            <span className="font-medium text-muted-foreground">
              I am a consulting doctor at this clinic
            </span>
            <span className="mt-1 block text-muted-foreground/80">
              Enables your profile for online booking. You can invite other
              doctors later.
            </span>
          </span>
        </label>

        {isConsultingDoctor ? (
          <div className="flex flex-col gap-4 border-l-2 border-primary/30 pl-4">
            <Select
              label="Your specialty"
              name="doctorSpecialty"
              options={specialtyOptions}
              value={values.doctorSpecialty ?? ""}
              onChange={(e) => setValue("doctorSpecialty", e.target.value)}
              error={fieldError("doctorSpecialty")}
              required
              allowClear
              clearLabel="Select specialty"
            />
            <Input
              label="Qualifications (optional)"
              name="qualifications"
              placeholder="e.g. MBBS, MD"
              value={values.qualifications ?? ""}
              onChange={(e) => setValue("qualifications", e.target.value)}
              error={fieldError("qualifications")}
            />
            <Input
              label="Registration no. (optional)"
              name="registrationNo"
              placeholder="MCI / NMC / state council"
              value={values.registrationNo ?? ""}
              onChange={(e) => setValue("registrationNo", e.target.value)}
              error={fieldError("registrationNo")}
            />
            <Input
              label="Consultation fee (₹)"
              name="consultationFee"
              type="number"
              min={0}
              step="1"
              value={values.consultationFee ?? ""}
              onChange={(e) => setValue("consultationFee", e.target.value)}
              error={fieldError("consultationFee")}
              required
            />
          </div>
        ) : null}
      </section>

      <label className="flex items-start gap-3 rounded-sm border border-border bg-card p-3 text-sm text-muted-foreground has-focus-visible:border-transparent has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
        <input
          type="checkbox"
          name="acceptTerms"
          value="true"
          required
          className="mt-1 size-4 rounded-sm border border-input accent-primary outline-none focus:border-transparent focus:ring-3 focus:ring-ring/50"
        />
        <span>
          I agree to the{" "}
          <Link
            href="/terms"
            target="_blank"
            className="text-primary underline-offset-2 hover:underline"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            target="_blank"
            className="text-primary underline-offset-2 hover:underline"
          >
            Privacy Policy
          </Link>
          , including processing of health-related operational data (DPDP).
          {fieldError("acceptTerms") ? (
            <span className="mt-1 block text-danger" role="alert">
              {fieldError("acceptTerms")}
            </span>
          ) : null}
        </span>
      </label>

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" loading={pending}>
        Create clinic account
      </Button>
      <p className="text-sm text-muted-foreground">
        Already registered?{" "}
        <Link
          href="/login"
          className="text-primary underline-offset-4 transition-[color,opacity] duration-150 hover:underline active:opacity-70"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

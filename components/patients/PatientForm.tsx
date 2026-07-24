"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  createPatient,
  findPossibleDuplicatePatients,
  updatePatient,
} from "@/actions/patients";
import { createAppointment } from "@/actions/appointments";
import { useServerActionForm } from "@/hooks/useServerActionForm";
import { AgeField } from "@/components/patients/AgeField";
import { GenderField } from "@/components/patients/GenderField";
import { Button } from "@/components/ui/Button";
import { DateField } from "@/components/ui/DateField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Banner } from "@/components/ui/Banner";
import { toDateInputValue } from "@/lib/date-utils";
import type { Patient } from "@prisma/client";

type PatientFormProps = {
  patient?: Patient;
  onSuccess?: (patientId: string) => void;
  showQueueOption?: boolean;
  cancelHref?: string;
};

type DuplicateHit = Awaited<ReturnType<typeof findPossibleDuplicatePatients>>[number];

function patientToValues(patient?: Patient): Record<string, string> {
  if (!patient) return {};
  return {
    name: patient.name,
    phone: patient.phone,
    age: patient.age != null ? String(patient.age) : "",
    dateOfBirth: patient.dateOfBirth
      ? toDateInputValue(patient.dateOfBirth)
      : "",
    gender: patient.gender ?? "",
    address: patient.address ?? "",
    allergies: patient.allergies ?? "",
    chronicConditions: patient.chronicConditions ?? "",
  };
}

function PatientFields({
  values,
  setValue,
  fieldError,
  showQueueOption,
  addToQueue,
  setAddToQueue,
  isEdit,
  duplicates,
}: {
  values: Record<string, string>;
  setValue: (name: string, value: string) => void;
  fieldError: (name: string) => string | undefined;
  showQueueOption: boolean;
  addToQueue: boolean;
  setAddToQueue: (v: boolean) => void;
  isEdit: boolean;
  duplicates: DuplicateHit[];
}) {
  return (
    <>
      <Input
        label="Full name"
        name="name"
        value={values.name ?? ""}
        onChange={(e) => setValue("name", e.target.value)}
        error={fieldError("name")}
        required
      />
      <Input
        label="Phone"
        name="phone"
        type="tel"
        value={values.phone ?? ""}
        onChange={(e) => setValue("phone", e.target.value)}
        error={fieldError("phone")}
        required
      />
      {!isEdit && duplicates.length > 0 && (
        <Banner variant="info">
          Possible existing patients:{" "}
          {duplicates.map((d, i) => (
            <span key={d.id}>
              {i > 0 ? "; " : ""}
              <Link
                href={`/patients/${d.id}`}
                className="text-primary underline-offset-4 transition-[color,opacity] duration-150 hover:underline active:opacity-70"
              >
                {d.name} ({d.mrn}, {d.phone})
              </Link>
            </span>
          ))}
          . Continue only if this is a new registration.
        </Banner>
      )}
      <div className="grid grid-cols-2 gap-4">
        <DateField
          label="Date of birth"
          name="dateOfBirth"
          value={values.dateOfBirth ?? ""}
          onChange={(next) => {
            setValue("dateOfBirth", next);
            if (next) setValue("age", "");
          }}
          error={fieldError("dateOfBirth")}
        />
        <AgeField
          name="age"
          value={values.age ?? ""}
          onChange={(next) => setValue("age", next)}
          error={fieldError("age")}
          disabled={!!values.dateOfBirth}
        />
      </div>
      <GenderField
        name="gender"
        value={values.gender ?? ""}
        onChange={(next) => setValue("gender", next)}
        error={fieldError("gender")}
      />
      <Textarea
        label="Address"
        name="address"
        value={values.address ?? ""}
        onChange={(e) => setValue("address", e.target.value)}
      />
      <Textarea
        label="Allergies"
        name="allergies"
        value={values.allergies ?? ""}
        onChange={(e) => setValue("allergies", e.target.value)}
        placeholder="e.g. Penicillin, sulfa drugs"
        rows={2}
      />
      <Textarea
        label="Chronic conditions"
        name="chronicConditions"
        value={values.chronicConditions ?? ""}
        onChange={(e) => setValue("chronicConditions", e.target.value)}
        placeholder="e.g. Hypertension, Type 2 diabetes"
        rows={2}
      />
      {!isEdit && showQueueOption && (
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={addToQueue}
            onChange={(e) => setAddToQueue(e.target.checked)}
          />
          Add to today&apos;s queue after registration
        </label>
      )}
    </>
  );
}

function useDuplicateCheck(
  name: string | undefined,
  phone: string | undefined,
  excludeId?: string
) {
  const [duplicates, setDuplicates] = useState<DuplicateHit[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const n = name?.trim() ?? "";
    const p = phone?.trim() ?? "";
    if (n.length < 2 && p.length < 5) {
      setDuplicates([]);
      return;
    }
    const timer = setTimeout(() => {
      startTransition(async () => {
        const hits = await findPossibleDuplicatePatients({
          name: n,
          phone: p,
          excludeId,
        });
        setDuplicates(hits);
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [name, phone, excludeId]);

  return duplicates;
}

function CreatePatientForm({
  showQueueOption,
  cancelHref,
  onSuccess,
}: {
  showQueueOption: boolean;
  cancelHref?: string;
  onSuccess?: (patientId: string) => void;
}) {
  const [addToQueue, setAddToQueue] = useState(true);
  const { handleSubmit, error, fieldError, pending, values, setValue, setError } =
    useServerActionForm(createPatient, {
      onSuccess: async (data) => {
        if (!data?.id) return;
        if (showQueueOption && addToQueue) {
          const queueResult = await createAppointment(data.id);
          if (!queueResult.success) {
            setError(
              `Patient saved, but could not add to queue: ${queueResult.error}`
            );
            return;
          }
        }
        onSuccess?.(data.id);
      },
    });
  const duplicates = useDuplicateCheck(values.name, values.phone);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PatientFields
        values={values}
        setValue={setValue}
        fieldError={fieldError}
        showQueueOption={showQueueOption}
        addToQueue={addToQueue}
        setAddToQueue={setAddToQueue}
        isEdit={false}
        duplicates={duplicates}
      />
      {error && <Banner variant="error">{error}</Banner>}
      <FormActions cancelHref={cancelHref} pending={pending} isEdit={false} />
    </form>
  );
}

function EditPatientForm({
  patient,
  cancelHref,
  onSuccess,
}: {
  patient: Patient;
  cancelHref?: string;
  onSuccess?: (patientId: string) => void;
}) {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const { handleSubmit, error, fieldError, pending, values, setValue } =
    useServerActionForm(
      (formData) => updatePatient(patient.id, formData),
      {
        initialValues: patientToValues(patient),
        onSuccess: () => {
          setSuccessMsg("Patient details saved.");
          onSuccess?.(patient.id);
        },
      }
    );
  const duplicates = useDuplicateCheck(values.name, values.phone, patient.id);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PatientFields
        values={values}
        setValue={setValue}
        fieldError={fieldError}
        showQueueOption={false}
        addToQueue={false}
        setAddToQueue={() => {}}
        isEdit
        duplicates={duplicates}
      />
      {successMsg && <Banner variant="success">{successMsg}</Banner>}
      {error && <Banner variant="error">{error}</Banner>}
      <FormActions cancelHref={cancelHref} pending={pending} isEdit />
    </form>
  );
}

function FormActions({
  cancelHref,
  pending,
  isEdit,
}: {
  cancelHref?: string;
  pending: boolean;
  isEdit: boolean;
}) {
  return (
    <div className="flex flex-wrap justify-end p-2 gap-3">
      {cancelHref && (
        <Link
          href={cancelHref}
          className="inline-flex h-12 px-4 items-center justify-center rounded-lg border border-border bg-white px-4 text-sm font-medium text-ink hover:bg-surface-muted"
        >
          Cancel
        </Link>
      )}
      <Button className="h-12 px-4" type="submit" loading={pending}>
        {isEdit ? "Save changes" : "Register patient"}
      </Button>
    </div>
  );
}

export function PatientForm({
  patient,
  onSuccess,
  showQueueOption = false,
  cancelHref,
}: PatientFormProps) {
  if (patient) {
    return (
      <EditPatientForm
        patient={patient}
        cancelHref={cancelHref}
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <CreatePatientForm
      showQueueOption={showQueueOption}
      cancelHref={cancelHref}
      onSuccess={onSuccess}
    />
  );
}

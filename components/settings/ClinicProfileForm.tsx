"use client";

import Link from "next/link";
import { useState } from "react";
import { updateClinicProfile } from "@/actions/auth";
import { uploadClinicLogo } from "@/actions/onboarding";
import {
  ClinicAddressFields,
  type ClinicAddressValue,
} from "@/components/settings/ClinicAddressFields";
import { Button } from "@/components/ui/Button";
import { ClinicLogo } from "@/components/ui/ClinicLogo";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Banner } from "@/components/ui/Banner";
import {
  BUSINESS_ENTITY_OPTIONS,
  CLINIC_TIMEZONE_OPTIONS,
  CLINIC_TYPE_OPTIONS,
} from "@/lib/clinic-onboarding";
import type { Clinic } from "@prisma/client";
import { usePendingAction } from "@/hooks/usePendingAction";

type ClinicProfileFormProps = {
  clinic: Pick<
    Clinic,
    | "name"
    | "phone"
    | "address"
    | "email"
    | "whatsapp"
    | "gstin"
    | "clinicType"
    | "timezone"
    | "logoUrl"
    | "website"
    | "mapsUrl"
    | "landmark"
    | "addressLine1"
    | "addressLine2"
    | "area"
    | "state"
    | "pincode"
    | "pan"
    | "businessEntity"
    | "city"
    | "latitude"
    | "longitude"
  >;
  cancelHref?: string;
  onSuccess?: () => void;
};

export function ClinicProfileForm({
  clinic,
  cancelHref,
  onSuccess,
}: ClinicProfileFormProps) {
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [clinicType, setClinicType] = useState(clinic.clinicType);
  const [timezone, setTimezone] = useState(clinic.timezone);
  const [businessEntity, setBusinessEntity] = useState(
    clinic.businessEntity ?? "",
  );
  const [logoUrl, setLogoUrl] = useState(clinic.logoUrl ?? "");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [address, setAddress] = useState<ClinicAddressValue>({
    addressLine1: clinic.addressLine1 ?? clinic.address ?? "",
    addressLine2: clinic.addressLine2 ?? "",
    area: clinic.area ?? "",
    city: clinic.city ?? "",
    state: clinic.state ?? "",
    pincode: clinic.pincode ?? "",
    landmark: clinic.landmark ?? "",
    mapsUrl: clinic.mapsUrl ?? "",
    latitude:
      clinic.latitude != null ? Number(clinic.latitude).toFixed(6) : "",
    longitude:
      clinic.longitude != null ? Number(clinic.longitude).toFixed(6) : "",
  });
  const { pending, run } = usePendingAction();

  function handleSubmit(formData: FormData) {
    setMessage(null);
    void run(async () => {
      const result = await updateClinicProfile(formData);
      if (result.success) {
        onSuccess?.();
        return;
      }
      setMessage({ type: "error", text: result.error });
    });
  }

  function onLogoFile(file: File | null) {
    if (!file) return;
    setMessage(null);
    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      void (async () => {
        try {
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
        } finally {
          setUploadingLogo(false);
        }
      })();
    };
    reader.onerror = () => {
      setUploadingLogo(false);
      setMessage({ type: "error", text: "Could not read that image file." });
    };
    reader.readAsDataURL(file);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(new FormData(e.currentTarget));
      }}
      className="flex flex-col gap-4"
    >
      <Input
        label="Clinic name"
        name="name"
        autoComplete="organization"
        defaultValue={clinic.name}
        required
      />
      <Select
        label="Clinic type"
        name="clinicType"
        options={[...CLINIC_TYPE_OPTIONS]}
        value={clinicType}
        onChange={(e) =>
          setClinicType(e.target.value as typeof clinicType)
        }
        allowClear={false}
        required
      />
      <Select
        label="Timezone"
        name="timezone"
        options={[...CLINIC_TIMEZONE_OPTIONS]}
        value={timezone}
        onChange={(e) => setTimezone(e.target.value)}
        allowClear={false}
        required
      />
      <Input
        label="Phone"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        defaultValue={clinic.phone}
        required
      />
      <ClinicAddressFields value={address} onChange={setAddress} />
      <input type="hidden" name="address" value={clinic.address} />
      <Select
        label="Business entity (optional)"
        name="businessEntity"
        options={[...BUSINESS_ENTITY_OPTIONS]}
        value={businessEntity}
        onChange={(e) => setBusinessEntity(e.target.value)}
        allowClear
        clearLabel="Not specified"
      />
      <Input
        label="PAN (optional)"
        name="pan"
        defaultValue={clinic.pan ?? ""}
        maxLength={10}
        className="uppercase"
      />
      <Input
        label="Clinic email (optional)"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={clinic.email ?? ""}
      />
      <Input
        label="WhatsApp (optional)"
        name="whatsapp"
        type="tel"
        inputMode="tel"
        defaultValue={clinic.whatsapp ?? ""}
      />
      <div className="flex flex-col gap-2">
        <Input
          label="Logo URL (optional)"
          name="logoUrl"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://"
        />
        <label className="text-sm text-muted-foreground">
          Or upload an image from your device
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="mt-1 block w-full text-sm"
            disabled={uploadingLogo || pending}
            onChange={(e) => {
              onLogoFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
        </label>
        {uploadingLogo ? (
          <p className="text-xs text-muted-foreground" role="status">
            Uploading logo…
          </p>
        ) : null}
        <ClinicLogo
          src={logoUrl.trim() || null}
          alt="Clinic logo preview"
          size="lg"
        />
      </div>
      <Input
        label="Website (optional)"
        name="website"
        defaultValue={clinic.website ?? ""}
        placeholder="https://"
      />
      <Input
        label="GSTIN (optional)"
        name="gstin"
        autoComplete="off"
        spellCheck={false}
        defaultValue={clinic.gstin ?? ""}
        placeholder="15-character GSTIN…"
        maxLength={15}
      />
      {message ? (
        <Banner variant={message.type === "error" ? "error" : "success"}>
          {message.text}
        </Banner>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={pending}>
          Save clinic profile
        </Button>
        {cancelHref ? (
          <Link
            href={cancelHref}
            className="inline-flex min-h-11 items-center px-3 text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Cancel
          </Link>
        ) : null}
      </div>
    </form>
  );
}

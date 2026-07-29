"use client";

import { faCheck, faDownload } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";
import {
  previewPrescriptionLayout,
  setPrescriptionLayout,
} from "@/actions/prescriptions";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";
import { usePendingAction } from "@/hooks/usePendingAction";
import {
  PRESCRIPTION_LAYOUTS,
  resolvePrescriptionLayout,
  type LayoutHeaderStyle,
  type LayoutMedicinesStyle,
  type LayoutPatientInfoStyle,
  type PrescriptionLayoutConfig,
  type PrescriptionLayoutId,
} from "@/lib/prescription-layouts";
import { cn, downloadBase64Pdf } from "@/lib/utils";

type PrescriptionLayoutsPageClientProps = {
  currentLayout: string;
};

const HEADER_STRUCTURE: Record<LayoutHeaderStyle, string> = {
  centered: "Centered letterhead",
  split: "Split clinic | doctor",
  banner: "Full-width banner",
  sideband: "Left edge band",
  minimal: "Minimal header",
  "double-rule": "Double-ruled letterhead",
};

const PATIENT_STRUCTURE: Record<LayoutPatientInfoStyle, string> = {
  strip: "Shaded patient strip",
  grid: "Open patient fields",
  boxed: "Boxed patient block",
};

const MEDICINE_STRUCTURE: Record<LayoutMedicinesStyle, string> = {
  table: "Table: name, dosage, route, frequency, duration + instructions",
  list: "List: name with dosage · route · frequency · duration + instructions",
  cards: "Cards: name with dosage · route · frequency · duration + instructions",
};

const SAMPLE_CLINIC = {
  name: "Maple Care Multispecialty Clinic",
  addressLine1: "2nd Floor, Sunrise Plaza, Gandhi Nagar",
  addressLine2: "Jammu, Jammu & Kashmir – 180004",
  phone: "+91 191 245 6789",
  email: "care@maplecareclinic.com",
} as const;

const SAMPLE_DOCTOR = {
  name: "Dr. Aditi Sharma",
  qualifications: "MBBS, MD (General Medicine)",
  specialization: "Consultant Physician",
  experience: "12 Years",
} as const;

/** Dummy letterhead mark for Maple Care in layout mini-previews. */
function PreviewClinicLogo({
  accent,
  mark = "#FFFFFF",
  size = 18,
  className,
}: {
  accent: string;
  mark?: string;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <rect width="40" height="40" rx="9" fill={accent} />
      {/* Classic maple leaf */}
      <path
        fill={mark}
        d="M20 5l1.6 5.2 4.8-3.2-1.2 5.4 5.6-.4-3.2 4.4 5.2 2.2-5 2.4 3.6 4.2-5.4-1.2.8 5.6L20 25.2l-1.8 4.4.8-5.6-5.4 1.2 3.6-4.2-5-2.4 5.2-2.2-3.2-4.4 5.6.4-1.2-5.4 4.8 3.2z"
      />
      <rect x="18.7" y="27.5" width="2.6" height="6.5" rx="0.6" fill={mark} />
      {/* Medical cross */}
      <path
        fill={accent}
        d="M18.6 14.5h2.8v2.8H24v2.8h-2.6v2.8h-2.8v-2.8H16v-2.8h2.6z"
      />
    </svg>
  );
}

const SAMPLE_MEDS = [
  {
    name: "Amoxicillin 500 mg",
    dosage: "1 capsule",
    route: "Oral",
    frequency: "Three times daily",
    duration: "5 days",
    instructions: "After meals",
  },
  {
    name: "Paracetamol 650 mg",
    dosage: "1 tablet",
    route: "Oral",
    frequency: "As needed",
    duration: "3 days",
    instructions: "Max 3 tablets / day",
  },
  {
    name: "Pantoprazole 40 mg",
    dosage: "1 tablet",
    route: "Oral",
    frequency: "Once daily",
    duration: "7 days",
    instructions: "Before meals",
  },
] as const;

function structureSummary(layout: PrescriptionLayoutConfig) {
  return [
    HEADER_STRUCTURE[layout.header],
    PATIENT_STRUCTURE[layout.patientInfo],
    MEDICINE_STRUCTURE[layout.medicines],
  ];
}

function PreviewClinicMeta({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={className} style={style}>
      <div>
        {SAMPLE_CLINIC.addressLine1}, {SAMPLE_CLINIC.addressLine2}
      </div>
      <div>
        {SAMPLE_CLINIC.phone} · {SAMPLE_CLINIC.email}
      </div>
    </div>
  );
}

function PreviewDoctorBlock({
  align = "left",
  nameClassName,
  metaClassName,
  nameStyle,
  metaStyle,
}: {
  align?: "left" | "right" | "center";
  nameClassName: string;
  metaClassName: string;
  nameStyle?: CSSProperties;
  metaStyle?: CSSProperties;
}) {
  const alignClass =
    align === "right"
      ? "text-right"
      : align === "center"
        ? "text-center"
        : "text-left";

  return (
    <div className={cn("min-w-0", alignClass)}>
      <div className={nameClassName} style={nameStyle}>
        {SAMPLE_DOCTOR.name}
      </div>
      <div className={metaClassName} style={metaStyle}>
        {SAMPLE_DOCTOR.qualifications}
      </div>
      <div className={metaClassName} style={metaStyle}>
        {SAMPLE_DOCTOR.specialization} · {SAMPLE_DOCTOR.experience}
      </div>
    </div>
  );
}

function PreviewHeader({ layout }: { layout: PrescriptionLayoutConfig }) {
  const { colors, header, font } = layout;
  const onBanner = colors.headerText ?? "#FFFFFF";
  const clinicClass = cn(
    "font-semibold uppercase leading-tight tracking-wide",
    font === "Times-Roman" ? "font-serif text-[7.5px]" : "text-[7px]"
  );
  const metaClass = "mt-0.5 text-[4.5px] leading-snug";
  const doctorClass = "text-[6px] font-semibold leading-tight";
  const doctorMetaClass = "mt-px text-[4.5px] leading-tight";

  if (header === "banner") {
    return (
      <div
        className="flex items-end justify-between gap-2 px-2.5 py-2"
        style={{ backgroundColor: colors.accent, color: onBanner }}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <PreviewClinicLogo
            accent={onBanner}
            mark={colors.accent}
            size={16}
          />
          <div className="min-w-0">
            <div className={clinicClass}>{SAMPLE_CLINIC.name}</div>
            <PreviewClinicMeta className={metaClass} style={{ opacity: 0.85 }} />
          </div>
        </div>
        <PreviewDoctorBlock
          align="right"
          nameClassName={doctorClass}
          metaClassName={doctorMetaClass}
          metaStyle={{ opacity: 0.85 }}
        />
      </div>
    );
  }

  if (header === "split" || header === "sideband") {
    return (
      <div className="px-2.5 pt-2">
        <div className="flex items-end justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <PreviewClinicLogo accent={colors.accent} size={16} />
            <div className="min-w-0">
              <div className={clinicClass} style={{ color: colors.accent }}>
                {SAMPLE_CLINIC.name}
              </div>
              <PreviewClinicMeta
                className={metaClass}
                style={{ color: colors.muted }}
              />
            </div>
          </div>
          <PreviewDoctorBlock
            align="right"
            nameClassName={doctorClass}
            metaClassName={doctorMetaClass}
            nameStyle={{ color: colors.ink }}
            metaStyle={{ color: colors.muted }}
          />
        </div>
        <div
          className={cn("mt-1.5", header === "split" ? "border-t-2" : "border-t")}
          style={{ borderColor: header === "split" ? colors.accent : colors.rule }}
        />
      </div>
    );
  }

  if (header === "double-rule") {
    return (
      <div className="px-2.5 pt-2 text-center">
        <div className="flex flex-col items-center">
          <PreviewClinicLogo accent={colors.accent} size={16} className="mb-1" />
          <div className={clinicClass} style={{ color: colors.accent }}>
            {SAMPLE_CLINIC.name}
          </div>
          <PreviewClinicMeta
            className={metaClass}
            style={{ color: colors.muted }}
          />
        </div>
        <div className="mt-1.5 border-t-2" style={{ borderColor: colors.accent }} />
        <div className="mt-0.5 border-t" style={{ borderColor: colors.accent }} />
        <div className="mt-1.5">
          <PreviewDoctorBlock
            nameClassName={doctorClass}
            metaClassName={doctorMetaClass}
            nameStyle={{ color: colors.ink }}
            metaStyle={{ color: colors.muted }}
          />
        </div>
      </div>
    );
  }

  if (header === "minimal") {
    return (
      <div className="px-2.5 pt-2">
        <div className="flex items-start gap-1.5">
          <PreviewClinicLogo accent={colors.accent} size={14} className="mt-px" />
          <div className="min-w-0">
            <div
              className={cn(clinicClass, "tracking-[0.1em]")}
              style={{ color: colors.ink }}
            >
              {SAMPLE_CLINIC.name}
            </div>
            <PreviewClinicMeta
              className={metaClass}
              style={{ color: colors.muted }}
            />
          </div>
        </div>
        <div className="mt-2">
          <PreviewDoctorBlock
            nameClassName={doctorClass}
            metaClassName={doctorMetaClass}
            nameStyle={{ color: colors.ink }}
            metaStyle={{ color: colors.muted }}
          />
        </div>
        <div className="mt-1.5 border-t" style={{ borderColor: colors.rule }} />
      </div>
    );
  }

  // centered
  return (
    <div className="px-2.5 pt-2">
      <div className="flex flex-col items-center text-center">
        <PreviewClinicLogo accent={colors.accent} size={16} className="mb-1" />
        <div className={clinicClass} style={{ color: colors.accent }}>
          {SAMPLE_CLINIC.name}
        </div>
        <PreviewClinicMeta
          className={metaClass}
          style={{ color: colors.muted }}
        />
      </div>
      <div className="mt-1.5 border-t" style={{ borderColor: colors.rule }} />
      <div className="mt-1.5">
        <PreviewDoctorBlock
          nameClassName={doctorClass}
          metaClassName={doctorMetaClass}
          nameStyle={{ color: colors.ink }}
          metaStyle={{ color: colors.muted }}
        />
      </div>
    </div>
  );
}

function PreviewPatientBlock({ layout }: { layout: PrescriptionLayoutConfig }) {
  const { colors, patientInfo } = layout;
  const fields = [
    { label: "Patient", value: "Asha Verma" },
    { label: "Age", value: "34 F" },
    { label: "MRN", value: "MR-2041" },
    { label: "Date", value: "23 Jul" },
  ] as const;

  return (
    <div
      className={cn(
        "px-1.5 py-1",
        patientInfo === "boxed" && "rounded-sm border",
        patientInfo === "strip" && "rounded-sm"
      )}
      style={{
        backgroundColor:
          patientInfo === "strip" || patientInfo === "boxed"
            ? colors.soft
            : "transparent",
        borderColor: patientInfo === "boxed" ? colors.rule : undefined,
      }}
    >
      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
        {fields.map((field) => (
          <div key={field.label} className="min-w-0">
            <div
              className="text-[4px] font-medium uppercase tracking-wider"
              style={{ color: colors.muted }}
            >
              {field.label}
            </div>
            <div
              className="truncate text-[5.5px] font-medium leading-tight"
              style={{ color: colors.ink }}
            >
              {field.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const PREVIEW_MED_TABLE_COLS =
  "grid grid-cols-[1.05fr_0.55fr_0.4fr_0.75fr_0.55fr] gap-x-0.5";

function PreviewMedDetails(med: (typeof SAMPLE_MEDS)[number]) {
  return [med.dosage, med.route, med.frequency, med.duration]
    .filter(Boolean)
    .join(" · ");
}

function PreviewMedicines({ layout }: { layout: PrescriptionLayoutConfig }) {
  const { colors, medicines } = layout;

  if (medicines === "table") {
    return (
      <div>
        <div
          className={cn(
            PREVIEW_MED_TABLE_COLS,
            "border-b pb-0.5 text-[3.5px] font-semibold uppercase tracking-wide"
          )}
          style={{ borderColor: colors.accent, color: colors.accent }}
        >
          <span>Medicine</span>
          <span>Dosage</span>
          <span>Route</span>
          <span>Frequency</span>
          <span>Duration</span>
        </div>
        {SAMPLE_MEDS.map((med) => (
          <div
            key={med.name}
            className="border-b py-0.5"
            style={{ borderColor: colors.rule }}
          >
            <div
              className={cn(PREVIEW_MED_TABLE_COLS, "text-[4.5px]")}
              style={{ color: colors.ink }}
            >
              <span className="truncate font-medium">{med.name}</span>
              <span className="truncate" style={{ color: colors.muted }}>
                {med.dosage}
              </span>
              <span className="truncate" style={{ color: colors.muted }}>
                {med.route}
              </span>
              <span className="truncate" style={{ color: colors.muted }}>
                {med.frequency}
              </span>
              <span className="truncate" style={{ color: colors.muted }}>
                {med.duration}
              </span>
            </div>
            {med.instructions ? (
              <div
                className="mt-px truncate text-[3.5px]"
                style={{ color: colors.muted }}
              >
                {med.instructions}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  if (medicines === "cards") {
    return (
      <div className="space-y-1">
        {SAMPLE_MEDS.map((med, index) => (
          <div
            key={med.name}
            className="rounded-sm border-l-2 px-1.5 py-1"
            style={{
              backgroundColor: colors.soft,
              borderColor: colors.accent,
            }}
          >
            <div className="flex items-baseline gap-1">
              <span
                className="text-[5px] font-semibold"
                style={{ color: colors.accent }}
              >
                {index + 1}.
              </span>
              <span
                className="truncate text-[5.5px] font-semibold"
                style={{ color: colors.ink }}
              >
                {med.name}
              </span>
            </div>
            <div className="mt-0.5 truncate text-[4px]" style={{ color: colors.ink }}>
              {PreviewMedDetails(med)}
            </div>
            {med.instructions ? (
              <div
                className="mt-px truncate text-[3.5px]"
                style={{ color: colors.muted }}
              >
                {med.instructions}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {SAMPLE_MEDS.map((med, index) => (
        <div key={med.name} className="flex gap-1">
          <span
            className="w-2.5 shrink-0 text-[5.5px] font-semibold"
            style={{ color: colors.accent }}
          >
            {index + 1}.
          </span>
          <div className="min-w-0">
            <div
              className="truncate text-[5.5px] font-semibold"
              style={{ color: colors.ink }}
            >
              {med.name}
            </div>
            <div className="truncate text-[4px]" style={{ color: colors.ink }}>
              {PreviewMedDetails(med)}
            </div>
            {med.instructions ? (
              <div
                className="truncate text-[3.5px]"
                style={{ color: colors.muted }}
              >
                {med.instructions}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function LayoutMiniPreview({ layout }: { layout: PrescriptionLayoutConfig }) {
  const { colors, header } = layout;
  const isSideband = header === "sideband";

  return (
    <div
      aria-hidden
      className="relative overflow-hidden rounded-md border border-border bg-white shadow-sm"
      style={{ aspectRatio: "210 / 297" }}
    >
      {isSideband ? (
        <div
          className="absolute inset-y-0 left-0 w-1.5"
          style={{ backgroundColor: colors.accent }}
        />
      ) : null}

      <div
        className={cn("flex h-full flex-col", isSideband && "pl-1.5")}
        style={{ color: colors.ink }}
      >
        <PreviewHeader layout={layout} />

        <div className="flex flex-1 flex-col gap-1.5 px-2.5 pb-2 pt-1.5">
          <PreviewPatientBlock layout={layout} />

          <div>
            <div
              className="text-[5px] font-semibold uppercase tracking-wider"
              style={{ color: colors.accent }}
            >
              Diagnosis
            </div>
            <div
              className="mt-0.5 truncate text-[5.5px]"
              style={{ color: colors.ink }}
            >
              Acute pharyngitis
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <div
              className="mb-1 font-serif text-[10px] font-semibold italic leading-none"
              style={{ color: colors.accent }}
            >
              Rx
            </div>
            <PreviewMedicines layout={layout} />
          </div>

          <div className="mt-auto flex justify-end pt-1">
            <div
              className="w-12 border-t pt-0.5 text-center text-[4.5px]"
              style={{ borderColor: colors.muted, color: colors.muted }}
            >
              Signature
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PrescriptionLayoutsPageClient({
  currentLayout,
}: PrescriptionLayoutsPageClientProps) {
  const router = useRouter();
  const resolvedCurrent = resolvePrescriptionLayout(currentLayout).id;
  const [selected, setSelected] = useState<PrescriptionLayoutId>(resolvedCurrent);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const { isPending, run } = usePendingAction<"save" | `preview:${string}`>();
  const saving = isPending("save");

  function handleSelect(id: PrescriptionLayoutId) {
    if (id === selected || saving) return;
    const previous = selected;
    setSelected(id);
    setMessage(null);
    void run(async () => {
      const result = await setPrescriptionLayout(id);
      if (!result.success) {
        setSelected(previous);
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMessage({
        type: "success",
        text: `“${resolvePrescriptionLayout(id).name}” is now your clinic prescription layout.`,
      });
      router.refresh();
    }, "save");
  }

  function handlePreview(id: PrescriptionLayoutId) {
    setMessage(null);
    void run(async () => {
      const result = await previewPrescriptionLayout(id);
      if (!result.success) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      downloadBase64Pdf(result.data.pdfBase64, result.data.filename);
    }, `preview:${id}`);
  }

  return (
    <PageShell>
      <PageHeader
        title="Prescription layouts"
        description="Each card shows how the page will print — header, patient block, and full Rx fields (name, dosage, route, frequency, duration, instructions). Click a layout to use it."
        backHref="/settings"
        backLabel="Back to settings"
      />
      <PageBody>
        {message ? (
          <Banner variant={message.type === "success" ? "success" : "error"}>
            {message.text}
          </Banner>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {PRESCRIPTION_LAYOUTS.map((layout) => {
            const isSelected = selected === layout.id;
            const isActive = resolvedCurrent === layout.id;

            return (
              <div
                key={layout.id}
                className={cn(
                  "flex flex-col overflow-hidden rounded-xl border bg-card text-left transition-shadow duration-150",
                  isSelected
                    ? "border-primary shadow-md ring-1 ring-primary/30"
                    : "border-border hover:border-primary/40 hover:shadow-sm",
                  saving && !isSelected && "opacity-60"
                )}
              >
                <button
                  type="button"
                  onClick={() => handleSelect(layout.id)}
                  aria-pressed={isSelected}
                  disabled={saving}
                  className="group flex flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary disabled:cursor-wait"
                >
                  <div className="bg-muted/40 p-3">
                    <LayoutMiniPreview layout={layout} />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-display text-base font-semibold text-ink">
                            {layout.name}
                          </h2>
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                              <Icon icon={faCheck} className="size-3" aria-hidden />
                              Active
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {layout.description}
                        </p>
                      </div>
                      <span
                        aria-hidden
                        className={cn(
                          "mt-1 inline-flex size-4 shrink-0 items-center justify-center rounded-full border",
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-border bg-transparent"
                        )}
                      >
                        {isSelected ? (
                          <Icon
                            icon={faCheck}
                            className="size-2.5 text-primary-foreground"
                          />
                        ) : null}
                      </span>
                    </div>

                    <div className="mt-1 space-y-1.5">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Print structure
                      </p>
                      <ul className="space-y-1">
                        {structureSummary(layout).map((line) => (
                          <li
                            key={line}
                            className="flex items-start gap-1.5 text-xs text-ink/80"
                          >
                            <span
                              className="mt-1.5 size-1 shrink-0 rounded-full"
                              style={{ backgroundColor: layout.colors.accent }}
                              aria-hidden
                            />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="pt-0.5 text-[11px] text-muted-foreground">
                        {layout.font === "Times-Roman" ? "Serif type" : "Sans type"}
                        {" · "}
                        theme tint on accent & fills
                      </p>
                    </div>
                  </div>
                </button>

                <div className="px-4 pb-4">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="min-h-9 w-full sm:w-auto"
                    loading={isPending(`preview:${layout.id}`)}
                    onClick={() => handlePreview(layout.id)}
                  >
                    <Icon icon={faDownload} data-icon="inline-start" />
                    Preview PDF
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </PageBody>
    </PageShell>
  );
}

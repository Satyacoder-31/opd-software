import React from "react";
import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type { Medicine, Vitals } from "@/lib/types";
import {
  resolvePrescriptionLayout,
  type PrescriptionLayoutConfig,
} from "@/lib/prescription-layouts";
import {
  type PdfLanguage,
  PRESCRIPTION_I18N,
  translateFrequency,
  translateGender,
} from "@/lib/pdf/translations";

export type PrescriptionPdfProps = {
  clinicName: string;
  clinicPhone: string;
  clinicAddress: string;
  clinicEmail?: string;
  /** Absolute https URL for clinic logo (optional letterhead mark). */
  clinicLogoUrl?: string | null;
  doctorName: string;
  doctorQualifications?: string;
  doctorSpecialization?: string;
  doctorExperience?: string;
  doctorRegistrationNo?: string;
  date: string;
  patientName: string;
  patientAge?: string;
  patientGender?: string;
  patientMrn: string;
  patientPhone: string;
  diagnosis: string;
  medicines: Medicine[];
  advice?: string;
  followUp?: string;
  /** Visual layout id from the prescription layout registry. */
  layout?: string | null;
  /** Language for prescription labels: "en" | "hi". Defaults to "en". */
  language?: PdfLanguage;
  /** Patient address for legal prescription standards. */
  patientAddress?: string | null;
  /** Known patient drug allergies. */
  patientAllergies?: string | null;
  /** Chronic medical conditions (e.g. Hypertension, Diabetes). */
  patientChronicConditions?: string | null;
  /** Patient physical vitals at visit (BP, Pulse, Temp, Weight, BMI, SpO2). */
  vitals?: Vitals | null;
  /** Symptoms / Chief complaint. */
  chiefComplaint?: string | null;
  /** OPD Queue Token Number. */
  tokenNumber?: number | null;
  /** Ayushman Bharat Health Account number. */
  abhaNumber?: string | null;
  abhaAddress?: string | null;
};

type Theme = {
  layout: PrescriptionLayoutConfig;
  body: string;
  bold: string;
  lang: PdfLanguage;
};

function buildTheme(layoutId?: string | null, language: PdfLanguage = "en"): Theme {
  const layout = resolvePrescriptionLayout(layoutId);
  const isHindi = language === "hi";
  const serif = !isHindi && layout.font === "Times-Roman";
  return {
    layout,
    body: isHindi ? "NotoSansDevanagari" : layout.font,
    bold: isHindi ? "NotoSansDevanagari" : serif ? "Times-Bold" : "Helvetica-Bold",
    lang: language,
  };
}

function parseAdviceLines(advice?: string): string[] {
  if (!advice?.trim()) return [];
  return advice
    .split(/\n|•/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/* ------------------------------- Header ------------------------------- */

function ClinicLogoMark({
  url,
  size = 36,
}: {
  url?: string | null;
  size?: number;
}) {
  if (!url) return null;
  return (
    <Image
      src={url}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
      }}
    />
  );
}

function ClinicBrandBlock({
  props,
  nameStyle,
  metaStyle,
  clinicMeta,
  align = "left",
  logoSize = 36,
}: {
  props: PrescriptionPdfProps;
  nameStyle: Style;
  metaStyle: Style;
  clinicMeta: string;
  align?: "left" | "center";
  logoSize?: number;
}) {
  const hasLogo = Boolean(props.clinicLogoUrl);
  const logo = <ClinicLogoMark url={props.clinicLogoUrl} size={logoSize} />;

  if (align === "center") {
    return (
      <View style={{ alignItems: "center" }}>
        {hasLogo ? <View style={{ marginBottom: 6 }}>{logo}</View> : null}
        <Text style={nameStyle}>{props.clinicName}</Text>
        {clinicMeta ? <Text style={metaStyle}>{clinicMeta}</Text> : null}
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        maxWidth: 320,
      }}
    >
      {hasLogo ? <View style={{ marginRight: 10 }}>{logo}</View> : null}
      <View style={{ flexGrow: 1, flexShrink: 1 }}>
        <Text style={nameStyle}>{props.clinicName}</Text>
        {clinicMeta ? <Text style={metaStyle}>{clinicMeta}</Text> : null}
      </View>
    </View>
  );
}

function DoctorLines({
  theme,
  props,
  align,
  color,
  mutedColor,
}: {
  theme: Theme;
  props: PrescriptionPdfProps;
  align: "left" | "right" | "center";
  color: string;
  mutedColor: string;
}) {
  const i18n = PRESCRIPTION_I18N[theme.lang];
  const meta: Style = {
    fontSize: 8.5,
    color: mutedColor,
    marginTop: 2,
    textAlign: align,
  };
  const specialtyLine = [props.doctorSpecialization, props.doctorExperience]
    .filter(Boolean)
    .join("  ·  ");
  const displayName = props.doctorName.replace(/^Dr\.?\s+/i, "");

  return (
    <View>
      <Text
        style={{
          fontSize: 11,
          fontFamily: theme.bold,
          color,
          textAlign: align,
        }}
      >
        {theme.lang === "hi" ? "डॉ. " : "Dr. "}
        {displayName}
      </Text>
      {props.doctorQualifications ? (
        <Text style={meta}>{props.doctorQualifications}</Text>
      ) : null}
      {specialtyLine ? <Text style={meta}>{specialtyLine}</Text> : null}
      {props.doctorRegistrationNo ? (
        <Text style={meta}>
          {i18n.doctorRegNo} {props.doctorRegistrationNo}
        </Text>
      ) : null}
    </View>
  );
}

function Header({ theme, props }: { theme: Theme; props: PrescriptionPdfProps }) {
  const { colors } = theme.layout;
  const clinicMeta = [
    props.clinicAddress,
    props.clinicPhone,
    props.clinicEmail,
  ]
    .filter(Boolean)
    .join("  ·  ");

  switch (theme.layout.header) {
    case "banner": {
      const onBanner = colors.headerText ?? "#FFFFFF";
      return (
        <View
          style={{
            backgroundColor: colors.accent,
            paddingVertical: 22,
            paddingHorizontal: 48,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <ClinicBrandBlock
            props={props}
            clinicMeta={clinicMeta}
            nameStyle={{
              fontSize: 16,
              fontFamily: theme.bold,
              color: onBanner,
              letterSpacing: 0.8,
            }}
            metaStyle={{
              fontSize: 8.5,
              color: onBanner,
              opacity: 0.85,
              marginTop: 4,
            }}
          />
          <DoctorLines
            theme={theme}
            props={props}
            align="right"
            color={onBanner}
            mutedColor={onBanner}
          />
        </View>
      );
    }

    case "split":
      return (
        <View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <ClinicBrandBlock
              props={props}
              clinicMeta={clinicMeta}
              nameStyle={{
                fontSize: 15,
                fontFamily: theme.bold,
                color: colors.ink,
                letterSpacing: 0.4,
              }}
              metaStyle={{ fontSize: 8.5, color: colors.muted, marginTop: 4 }}
            />
            <DoctorLines
              theme={theme}
              props={props}
              align="right"
              color={theme.layout.colors.ink}
              mutedColor={colors.muted}
            />
          </View>
          <View
            style={{
              borderBottom: `2px solid ${colors.accent}`,
              marginTop: 14,
            }}
          />
        </View>
      );

    case "sideband":
      return (
        <View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <ClinicBrandBlock
              props={props}
              clinicMeta={clinicMeta}
              nameStyle={{
                fontSize: 16,
                fontFamily: theme.bold,
                color: colors.accent,
                letterSpacing: 0.6,
              }}
              metaStyle={{ fontSize: 8.5, color: colors.muted, marginTop: 5 }}
            />
            <DoctorLines
              theme={theme}
              props={props}
              align="right"
              color={theme.layout.colors.ink}
              mutedColor={colors.muted}
            />
          </View>
          <View
            style={{ borderBottom: `1px solid ${colors.rule}`, marginTop: 14 }}
          />
        </View>
      );

    case "minimal":
      return (
        <View>
          <ClinicBrandBlock
            props={props}
            clinicMeta={clinicMeta}
            logoSize={28}
            nameStyle={{
              fontSize: 13,
              fontFamily: theme.bold,
              color: colors.ink,
              letterSpacing: 1.6,
              textTransform: "uppercase",
            }}
            metaStyle={{ fontSize: 8.5, color: colors.muted, marginTop: 4 }}
          />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: 18,
            }}
          >
            <DoctorLines
              theme={theme}
              props={props}
              align="left"
              color={colors.ink}
              mutedColor={colors.muted}
            />
          </View>
          <View
            style={{ borderBottom: `0.75px solid ${colors.rule}`, marginTop: 12 }}
          />
        </View>
      );

    case "double-rule":
      return (
        <View>
          <ClinicBrandBlock
            props={props}
            clinicMeta={clinicMeta}
            align="center"
            logoSize={40}
            nameStyle={{
              fontSize: 17,
              fontFamily: theme.bold,
              color: colors.accent,
              letterSpacing: 1.4,
              textTransform: "uppercase",
            }}
            metaStyle={{ fontSize: 8.5, color: colors.muted, marginTop: 5 }}
          />
          <View
            style={{ borderBottom: `2.5px solid ${colors.accent}`, marginTop: 12 }}
          />
          <View
            style={{ borderBottom: `0.75px solid ${colors.accent}`, marginTop: 2 }}
          />
          <View style={{ marginTop: 12 }}>
            <DoctorLines
              theme={theme}
              props={props}
              align="left"
              color={colors.ink}
              mutedColor={colors.muted}
            />
          </View>
        </View>
      );

    case "centered":
    default:
      return (
        <View>
          <ClinicBrandBlock
            props={props}
            clinicMeta={clinicMeta}
            align="center"
            logoSize={40}
            nameStyle={{
              fontSize: 16,
              fontFamily: theme.bold,
              color: colors.accent,
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
            metaStyle={{ fontSize: 8.5, color: colors.muted, marginTop: 5 }}
          />
          <View
            style={{ borderBottom: `1px solid ${colors.rule}`, marginVertical: 12 }}
          />
          <DoctorLines
            theme={theme}
            props={props}
            align="left"
            color={colors.ink}
            mutedColor={colors.muted}
          />
        </View>
      );
  }
}

/* ---------------------------- Patient info ---------------------------- */

type PatientField = { label: string; value: string };

function patientFields(props: PrescriptionPdfProps, lang: PdfLanguage): PatientField[] {
  const i18n = PRESCRIPTION_I18N[lang];
  const fields: PatientField[] = [
    { label: i18n.patient, value: props.patientName },
  ];
  if (props.patientAge) fields.push({ label: i18n.age, value: props.patientAge });
  if (props.patientGender) {
    fields.push({
      label: i18n.gender,
      value: translateGender(props.patientGender, lang),
    });
  }
  fields.push({ label: i18n.mrn, value: props.patientMrn });
  fields.push({ label: i18n.phone, value: props.patientPhone });
  fields.push({ label: i18n.date, value: props.date });
  if (props.tokenNumber != null) {
    fields.push({ label: i18n.token, value: String(props.tokenNumber) });
  }
  if (props.patientAddress?.trim()) {
    fields.push({ label: i18n.address, value: props.patientAddress.trim() });
  }
  if (props.abhaNumber?.trim()) {
    fields.push({ label: i18n.abha, value: props.abhaNumber.trim() });
  }
  return fields;
}

function FieldLabelValue({
  theme,
  field,
  minWidth,
}: {
  theme: Theme;
  field: PatientField;
  minWidth?: number;
}) {
  const { colors } = theme.layout;
  return (
    <View style={{ minWidth, marginRight: 14, marginBottom: 4 }}>
      <Text
        style={{
          fontSize: 7,
          color: colors.muted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 2,
        }}
      >
        {field.label}
      </Text>
      <Text
        style={{
          fontSize: 9,
          color: colors.ink,
          fontFamily: theme.bold,
        }}
      >
        {field.value}
      </Text>
    </View>
  );
}

function PatientInfo({
  theme,
  props,
}: {
  theme: Theme;
  props: PrescriptionPdfProps;
}) {
  const { colors } = theme.layout;
  const fields = patientFields(props, theme.lang);

  if (theme.layout.patientInfo === "strip") {
    return (
      <View
        style={{
          backgroundColor: colors.soft,
          borderRadius: 4,
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: 4,
          flexDirection: "row",
          flexWrap: "wrap",
        }}
      >
        {fields.map((field) => (
          <FieldLabelValue key={field.label} theme={theme} field={field} />
        ))}
      </View>
    );
  }

  if (theme.layout.patientInfo === "boxed") {
    return (
      <View
        style={{
          border: `1px solid ${colors.rule}`,
          borderRadius: 4,
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: 4,
          flexDirection: "row",
          flexWrap: "wrap",
        }}
      >
        {fields.map((field) => (
          <FieldLabelValue
            key={field.label}
            theme={theme}
            field={field}
            minWidth={105}
          />
        ))}
      </View>
    );
  }

  // default grid
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
      {fields.map((field) => (
        <FieldLabelValue
          key={field.label}
          theme={theme}
          field={field}
          minWidth={130}
        />
      ))}
    </View>
  );
}

/* ------------------- Clinical Vitals & Safety Badges ------------------- */

function PatientSafetyAndVitals({
  theme,
  props,
}: {
  theme: Theme;
  props: PrescriptionPdfProps;
}) {
  const { colors } = theme.layout;
  const i18n = PRESCRIPTION_I18N[theme.lang];
  const vitals = props.vitals;

  // Check if any vitals are recorded
  const hasBp = Boolean(vitals?.bp?.trim());
  const hasPulse = Boolean(vitals?.pulse?.trim());
  const hasTemp = Boolean(vitals?.temp?.trim());
  const hasWeight = Boolean(vitals?.weight?.trim());
  const hasSpo2 = Boolean(vitals?.spo2?.trim());
  const hasHeight = Boolean(vitals?.height?.trim());
  const hasBmi = Boolean(vitals?.bmi?.trim());
  const hasVitals = hasBp || hasPulse || hasTemp || hasWeight || hasSpo2 || hasHeight || hasBmi;

  const hasAllergies = Boolean(props.patientAllergies?.trim());
  const hasChronic = Boolean(props.patientChronicConditions?.trim());
  const hasChiefComplaint = Boolean(props.chiefComplaint?.trim());

  return (
    <View style={{ marginTop: 8 }}>
      {/* 1. Allergies & Clinical Alerts */}
      {hasAllergies ? (
        <View
          style={{
            backgroundColor: "#fff1f2",
            borderLeft: "3px solid #e11d48",
            paddingVertical: 4,
            paddingHorizontal: 8,
            borderRadius: 3,
            marginBottom: 6,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 8,
              fontFamily: theme.bold,
              color: "#be123c",
              textTransform: "uppercase",
            }}
          >
            ! {i18n.allergies}:{" "}
          </Text>
          <Text
            style={{
              fontSize: 8.5,
              fontFamily: theme.bold,
              color: "#9f1239",
            }}
          >
            {props.patientAllergies}
          </Text>
        </View>
      ) : (
        <View
          style={{
            backgroundColor: "#f8fafc",
            borderLeft: "2px solid #94a3b8",
            paddingVertical: 3,
            paddingHorizontal: 8,
            borderRadius: 3,
            marginBottom: 6,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 7.5, color: "#64748b" }}>
            {i18n.allergies}:{" "}
          </Text>
          <Text style={{ fontSize: 7.5, color: "#334155" }}>
            {i18n.noAllergies}
          </Text>
        </View>
      )}

      {/* 2. Chronic History & Chief Complaints (if available) */}
      {(hasChronic || hasChiefComplaint) && (
        <View
          style={{
            backgroundColor: "#f8fafc",
            border: `0.75px solid ${colors.rule}`,
            borderRadius: 4,
            padding: 6,
            marginBottom: 6,
          }}
        >
          {hasChiefComplaint && (
            <View style={{ flexDirection: "row", marginBottom: hasChronic ? 3 : 0 }}>
              <Text
                style={{
                  fontSize: 7.5,
                  fontFamily: theme.bold,
                  color: colors.accent,
                  width: 95,
                }}
              >
                {i18n.chiefComplaint}:
              </Text>
              <Text style={{ fontSize: 8, color: colors.ink, flex: 1 }}>
                {props.chiefComplaint}
              </Text>
            </View>
          )}
          {hasChronic && (
            <View style={{ flexDirection: "row" }}>
              <Text
                style={{
                  fontSize: 7.5,
                  fontFamily: theme.bold,
                  color: "#475569",
                  width: 95,
                }}
              >
                {i18n.chronicConditions}:
              </Text>
              <Text style={{ fontSize: 8, color: colors.ink, flex: 1 }}>
                {props.patientChronicConditions}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* 3. Vitals Strip */}
      {hasVitals && (
        <View
          style={{
            backgroundColor: "#f0f9ff",
            border: "0.75px solid #bae6fd",
            borderRadius: 4,
            paddingVertical: 4,
            paddingHorizontal: 8,
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 4,
          }}
        >
          <Text
            style={{
              fontSize: 7,
              fontFamily: theme.bold,
              color: "#0369a1",
              textTransform: "uppercase",
              marginRight: 6,
            }}
          >
            {i18n.vitalsTitle}:
          </Text>

          {hasBp && (
            <Text style={{ fontSize: 8, color: "#0f172a", marginRight: 8 }}>
              <Text style={{ color: "#64748b" }}>{i18n.bp}: </Text>
              <Text style={{ fontFamily: theme.bold }}>{vitals?.bp}</Text> mmHg
            </Text>
          )}
          {hasPulse && (
            <Text style={{ fontSize: 8, color: "#0f172a", marginRight: 8 }}>
              <Text style={{ color: "#64748b" }}>{i18n.pulse}: </Text>
              <Text style={{ fontFamily: theme.bold }}>{vitals?.pulse}</Text> bpm
            </Text>
          )}
          {hasTemp && (
            <Text style={{ fontSize: 8, color: "#0f172a", marginRight: 8 }}>
              <Text style={{ color: "#64748b" }}>{i18n.temp}: </Text>
              <Text style={{ fontFamily: theme.bold }}>{vitals?.temp}</Text> °F
            </Text>
          )}
          {hasWeight && (
            <Text style={{ fontSize: 8, color: "#0f172a", marginRight: 8 }}>
              <Text style={{ color: "#64748b" }}>{i18n.weight}: </Text>
              <Text style={{ fontFamily: theme.bold }}>{vitals?.weight}</Text> kg
            </Text>
          )}
          {(hasHeight || hasBmi) && (
            <Text style={{ fontSize: 8, color: "#0f172a", marginRight: 8 }}>
              <Text style={{ color: "#64748b" }}>{i18n.height}/{i18n.bmi}: </Text>
              <Text style={{ fontFamily: theme.bold }}>
                {vitals?.height ? `${vitals.height} cm` : ""}
                {vitals?.bmi ? ` (${vitals.bmi})` : ""}
              </Text>
            </Text>
          )}
          {hasSpo2 && (
            <Text style={{ fontSize: 8, color: "#0f172a" }}>
              <Text style={{ color: "#64748b" }}>{i18n.spo2}: </Text>
              <Text style={{ fontFamily: theme.bold }}>{vitals?.spo2}</Text> %
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

/* ----------------------------- Medicines ------------------------------ */

function SectionTitle({ theme, children }: { theme: Theme; children: string }) {
  const { colors } = theme.layout;
  return (
    <Text
      style={{
        fontSize: 8,
        fontFamily: theme.bold,
        color: colors.accent,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 6,
      }}
    >
      {children}
    </Text>
  );
}

function RxMark({ theme }: { theme: Theme }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        marginBottom: 6,
      }}
    >
      <Text
        style={{
          fontSize: 16,
          fontFamily:
            theme.layout.font === "Times-Roman" && theme.lang !== "hi"
              ? "Times-BoldItalic"
              : theme.bold,
          color: theme.layout.colors.accent,
        }}
      >
        Rx
      </Text>
    </View>
  );
}

function MedicinesTable({
  theme,
  medicines,
  lang,
}: {
  theme: Theme;
  medicines: Medicine[];
  lang: PdfLanguage;
}) {
  const i18n = PRESCRIPTION_I18N[lang];
  const { colors } = theme.layout;
  const headCell: Style = {
    fontSize: 7.5,
    fontFamily: theme.bold,
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  };
  const cell: Style = { fontSize: 9, color: colors.ink };

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          borderBottom: `1.5px solid ${colors.accent}`,
          paddingBottom: 4,
          marginBottom: 2,
        }}
      >
        <Text style={[headCell, { width: 22 }]}>{i18n.medIndex}</Text>
        <Text style={[headCell, { flex: 2.6 }]}>{i18n.medName}</Text>
        <Text style={[headCell, { flex: 1.2 }]}>{i18n.dosage}</Text>
        <Text style={[headCell, { flex: 1.0 }]}>{i18n.route}</Text>
        <Text style={[headCell, { flex: 1.6 }]}>{i18n.frequency}</Text>
        <Text style={[headCell, { flex: 1.1 }]}>{i18n.duration}</Text>
      </View>
      {medicines.map((med, i) => (
        <View
          key={i}
          wrap={false}
          style={{
            borderBottom:
              i < medicines.length - 1 ? `0.75px solid ${colors.rule}` : undefined,
            paddingVertical: 5,
          }}
        >
          <View style={{ flexDirection: "row" }}>
            <Text style={[cell, { width: 22, color: colors.muted }]}>
              {i + 1}
            </Text>
            <Text style={[cell, { flex: 2.6, fontFamily: theme.bold }]}>
              {med.name}
            </Text>
            <Text style={[cell, { flex: 1.2 }]}>{med.dosage || "—"}</Text>
            <Text style={[cell, { flex: 1.0 }]}>{med.route || "—"}</Text>
            <Text style={[cell, { flex: 1.6 }]}>
              {translateFrequency(med.frequency, lang)}
            </Text>
            <Text style={[cell, { flex: 1.1 }]}>{med.duration || "—"}</Text>
          </View>
          {med.instructions ? (
            <Text
              style={{
                fontSize: 8,
                color: colors.muted,
                marginLeft: 22,
                marginTop: 2,
              }}
            >
              {med.instructions}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function MedicinesList({
  theme,
  medicines,
  lang,
}: {
  theme: Theme;
  medicines: Medicine[];
  lang: PdfLanguage;
}) {
  const { colors } = theme.layout;
  return (
    <View>
      {medicines.map((med, i) => {
        const details = [
          med.dosage,
          med.route,
          translateFrequency(med.frequency, lang),
          med.duration,
        ]
          .filter(Boolean)
          .join("  ·  ");
        return (
          <View key={i} wrap={false} style={{ marginBottom: 8 }}>
            <Text
              style={{
                fontSize: 9.5,
                fontFamily: theme.bold,
                color: colors.ink,
              }}
            >
              {i + 1}.  {med.name}
            </Text>
            {details ? (
              <Text
                style={{
                  fontSize: 9,
                  color: colors.ink,
                  marginLeft: 16,
                  marginTop: 2,
                }}
              >
                {details}
              </Text>
            ) : null}
            {med.instructions ? (
              <Text
                style={{
                  fontSize: 8,
                  color: colors.muted,
                  marginLeft: 16,
                  marginTop: 2,
                }}
              >
                {med.instructions}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function MedicinesCards({
  theme,
  medicines,
  lang,
}: {
  theme: Theme;
  medicines: Medicine[];
  lang: PdfLanguage;
}) {
  const { colors } = theme.layout;
  return (
    <View>
      {medicines.map((med, i) => {
        const details = [
          med.dosage,
          med.route,
          translateFrequency(med.frequency, lang),
        ]
          .filter(Boolean)
          .join("  ·  ");
        return (
          <View
            key={i}
            wrap={false}
            style={{
              backgroundColor: colors.soft,
              borderRadius: 4,
              borderLeft: `2.5px solid ${colors.accent}`,
              paddingVertical: 7,
              paddingHorizontal: 10,
              marginBottom: 6,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text
                style={{ fontSize: 9.5, fontFamily: theme.bold, color: colors.ink }}
              >
                {i + 1}.  {med.name}
              </Text>
              {med.duration ? (
                <Text style={{ fontSize: 8.5, color: colors.muted }}>
                  {med.duration}
                </Text>
              ) : null}
            </View>
            {details ? (
              <Text style={{ fontSize: 8.5, color: colors.ink, marginTop: 3 }}>
                {details}
              </Text>
            ) : null}
            {med.instructions ? (
              <Text style={{ fontSize: 8, color: colors.muted, marginTop: 2 }}>
                {med.instructions}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function Medicines({
  theme,
  medicines,
  lang,
}: {
  theme: Theme;
  medicines: Medicine[];
  lang: PdfLanguage;
}) {
  switch (theme.layout.medicines) {
    case "table":
      return <MedicinesTable theme={theme} medicines={medicines} lang={lang} />;
    case "cards":
      return <MedicinesCards theme={theme} medicines={medicines} lang={lang} />;
    case "list":
    default:
      return <MedicinesList theme={theme} medicines={medicines} lang={lang} />;
  }
}

/* ------------------------------ Document ------------------------------ */

export function PrescriptionDocument(props: PrescriptionPdfProps) {
  const lang = props.language ?? "en";
  const i18n = PRESCRIPTION_I18N[lang];
  const theme = buildTheme(props.layout, lang);
  const { colors, header } = theme.layout;
  const adviceLines = parseAdviceLines(props.advice);

  const isBanner = header === "banner";
  const isSideband = header === "sideband";

  const contentLeft = isBanner ? 48 : isSideband ? 58 : 48;
  const contentRight = 48;
  // Room for fixed signature + page footer so body content never collides.
  const pageBottomPad = 105;

  const pageStyle: Style = {
    fontSize: 9.5,
    fontFamily: theme.body,
    color: colors.ink,
    paddingTop: isBanner ? 0 : 36,
    paddingBottom: pageBottomPad,
    paddingLeft: isBanner ? 0 : contentLeft,
    paddingRight: isBanner ? 0 : contentRight,
  };

  const bodyStyle: Style = isBanner
    ? { paddingTop: 20, paddingHorizontal: 48 }
    : {};

  const displayDoctorName = props.doctorName.replace(/^Dr\.?\s+/i, "");

  return (
    <Document>
      <Page size="A4" style={pageStyle}>
        {isSideband ? (
          <View
            fixed
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: 14,
              backgroundColor: colors.accent,
            }}
          />
        ) : null}

        <Header theme={theme} props={props} />

        <View style={bodyStyle}>
          {/* Patient Details Strip/Grid */}
          <View style={{ marginTop: isBanner ? 0 : 12 }}>
            <PatientInfo theme={theme} props={props} />
          </View>

          {/* Patient Clinical Safety (Allergies), Chronic Conditions & Vitals */}
          <PatientSafetyAndVitals theme={theme} props={props} />

          {/* Provisional / Final Diagnosis */}
          <View style={{ marginTop: 10 }}>
            <SectionTitle theme={theme}>{i18n.diagnosis}</SectionTitle>
            <Text style={{ fontSize: 9.5, color: colors.ink, fontFamily: theme.bold }}>
              {props.diagnosis || "—"}
            </Text>
          </View>

          {/* Rx - Medicines */}
          <View style={{ marginTop: 14 }}>
            <RxMark theme={theme} />
            <Medicines theme={theme} medicines={props.medicines} lang={lang} />
          </View>

          {/* Advice / Precautions */}
          {adviceLines.length > 0 ? (
            <View style={{ marginTop: 14 }}>
              <SectionTitle theme={theme}>{i18n.adviceTitle}</SectionTitle>
              {adviceLines.map((line, i) => (
                <Text
                  key={i}
                  style={{
                    fontSize: 9,
                    color: colors.ink,
                    marginBottom: 2.5,
                    marginLeft: 4,
                  }}
                >
                  •  {line}
                </Text>
              ))}
            </View>
          ) : null}

          {/* Follow-up / Review */}
          {props.followUp?.trim() ? (
            <View style={{ marginTop: 12 }}>
              <SectionTitle theme={theme}>{i18n.followUpTitle}</SectionTitle>
              <Text style={{ fontSize: 9, color: colors.ink, fontFamily: theme.bold }}>
                {props.followUp.trim()}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Doctor Signature Block */}
        <View
          fixed
          style={{
            position: "absolute",
            bottom: 48,
            right: contentRight,
            minWidth: 150,
            alignItems: "center",
            borderTop: `0.75px solid ${colors.muted}`,
            paddingTop: 5,
          }}
        >
          <Text style={{ fontSize: 9.5, fontFamily: theme.bold }}>
            {lang === "hi" ? "डॉ. " : "Dr. "}
            {displayDoctorName}
          </Text>
          <Text style={{ fontSize: 7, color: colors.muted, marginTop: 2 }}>
            {i18n.doctorSignature}
          </Text>
        </View>

        {/* Running Footer */}
        <View
          fixed
          style={{
            position: "absolute",
            bottom: 18,
            left: contentLeft,
            right: contentRight,
            borderTop: `0.75px solid ${colors.rule}`,
            paddingTop: 5,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: 6.5, color: colors.muted }}>
            {[props.clinicName, props.clinicPhone, props.clinicEmail]
              .filter(Boolean)
              .join(" · ")}
          </Text>
          <Text
            style={{ fontSize: 6.5, color: colors.muted }}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

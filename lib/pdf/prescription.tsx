import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type { Medicine } from "@/lib/types";
import {
  resolvePrescriptionLayout,
  type PrescriptionLayoutConfig,
} from "@/lib/prescription-layouts";

export type PrescriptionPdfProps = {
  clinicName: string;
  clinicPhone: string;
  clinicAddress: string;
  doctorName: string;
  doctorQualifications?: string;
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
};

type Theme = {
  layout: PrescriptionLayoutConfig;
  body: string;
  bold: string;
};

function buildTheme(layoutId?: string | null): Theme {
  const layout = resolvePrescriptionLayout(layoutId);
  const serif = layout.font === "Times-Roman";
  return {
    layout,
    body: layout.font,
    bold: serif ? "Times-Bold" : "Helvetica-Bold",
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
  const meta: Style = {
    fontSize: 8.5,
    color: mutedColor,
    marginTop: 2,
    textAlign: align,
  };
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
        Dr. {props.doctorName}
      </Text>
      {props.doctorQualifications ? (
        <Text style={meta}>{props.doctorQualifications}</Text>
      ) : null}
      {props.doctorRegistrationNo ? (
        <Text style={meta}>Reg. No: {props.doctorRegistrationNo}</Text>
      ) : null}
    </View>
  );
}

function Header({ theme, props }: { theme: Theme; props: PrescriptionPdfProps }) {
  const { colors } = theme.layout;
  const clinicMeta = `${props.clinicAddress}  ·  ${props.clinicPhone}`;

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
          <View style={{ maxWidth: 300 }}>
            <Text
              style={{
                fontSize: 16,
                fontFamily: theme.bold,
                color: onBanner,
                letterSpacing: 0.8,
                textTransform: "uppercase",
              }}
            >
              {props.clinicName}
            </Text>
            <Text style={{ fontSize: 8.5, color: onBanner, opacity: 0.85, marginTop: 5 }}>
              {clinicMeta}
            </Text>
          </View>
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
            <View style={{ maxWidth: 300 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: theme.bold,
                  color: colors.accent,
                  letterSpacing: 0.6,
                }}
              >
                {props.clinicName}
              </Text>
              <Text style={{ fontSize: 8.5, color: colors.muted, marginTop: 5 }}>
                {clinicMeta}
              </Text>
            </View>
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
            <View style={{ maxWidth: 300 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: theme.bold,
                  color: colors.accent,
                  letterSpacing: 0.6,
                }}
              >
                {props.clinicName}
              </Text>
              <Text style={{ fontSize: 8.5, color: colors.muted, marginTop: 5 }}>
                {clinicMeta}
              </Text>
            </View>
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
          <Text
            style={{
              fontSize: 13,
              fontFamily: theme.bold,
              color: colors.ink,
              letterSpacing: 1.6,
              textTransform: "uppercase",
            }}
          >
            {props.clinicName}
          </Text>
          <Text style={{ fontSize: 8.5, color: colors.muted, marginTop: 4 }}>
            {clinicMeta}
          </Text>
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
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: 17,
                fontFamily: theme.bold,
                color: colors.accent,
                letterSpacing: 1.4,
                textTransform: "uppercase",
              }}
            >
              {props.clinicName}
            </Text>
            <Text style={{ fontSize: 8.5, color: colors.muted, marginTop: 5 }}>
              {clinicMeta}
            </Text>
          </View>
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
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: 16,
                fontFamily: theme.bold,
                color: colors.accent,
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              {props.clinicName}
            </Text>
            <Text style={{ fontSize: 8.5, color: colors.muted, marginTop: 5 }}>
              {clinicMeta}
            </Text>
          </View>
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

function patientFields(props: PrescriptionPdfProps): PatientField[] {
  const fields: PatientField[] = [
    { label: "Patient", value: props.patientName },
  ];
  if (props.patientAge) fields.push({ label: "Age", value: props.patientAge });
  if (props.patientGender)
    fields.push({ label: "Gender", value: props.patientGender });
  fields.push({ label: "MRN", value: props.patientMrn });
  fields.push({ label: "Phone", value: props.patientPhone });
  fields.push({ label: "Date", value: props.date });
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
          letterSpacing: 0.7,
          marginBottom: 2,
        }}
      >
        {field.label}
      </Text>
      <Text style={{ fontSize: 9.5, color: colors.ink, fontFamily: theme.body }}>
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
  const fields = patientFields(props);

  if (theme.layout.patientInfo === "strip") {
    return (
      <View
        style={{
          backgroundColor: colors.soft,
          borderRadius: 4,
          paddingHorizontal: 12,
          paddingTop: 9,
          paddingBottom: 5,
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
          paddingTop: 9,
          paddingBottom: 5,
          flexDirection: "row",
          flexWrap: "wrap",
        }}
      >
        {fields.map((field) => (
          <FieldLabelValue
            key={field.label}
            theme={theme}
            field={field}
            minWidth={110}
          />
        ))}
      </View>
    );
  }

  // grid
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
      {fields.map((field) => (
        <FieldLabelValue
          key={field.label}
          theme={theme}
          field={field}
          minWidth={150}
        />
      ))}
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
        letterSpacing: 1.2,
        marginBottom: 7,
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
        marginBottom: 8,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontFamily:
            theme.layout.font === "Times-Roman" ? "Times-BoldItalic" : theme.bold,
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
}: {
  theme: Theme;
  medicines: Medicine[];
}) {
  const { colors } = theme.layout;
  const headCell: Style = {
    fontSize: 7.5,
    fontFamily: theme.bold,
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  };
  const cell: Style = { fontSize: 9.5, color: colors.ink };

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          borderBottom: `1.5px solid ${colors.accent}`,
          paddingBottom: 5,
          marginBottom: 2,
        }}
      >
        <Text style={[headCell, { width: 22 }]}>#</Text>
        <Text style={[headCell, { flex: 2.4 }]}>Medicine</Text>
        <Text style={[headCell, { flex: 1.1 }]}>Dosage</Text>
        <Text style={[headCell, { flex: 1.1 }]}>Route</Text>
        <Text style={[headCell, { flex: 1.4 }]}>Frequency</Text>
        <Text style={[headCell, { flex: 1.0 }]}>Duration</Text>
        <Text style={[headCell, { flex: 0.7 }]}>Qty</Text>
      </View>
      {medicines.map((med, i) => (
        <View
          key={i}
          wrap={false}
          style={{
            borderBottom:
              i < medicines.length - 1 ? `0.75px solid ${colors.rule}` : undefined,
            paddingVertical: 6,
          }}
        >
          <View style={{ flexDirection: "row" }}>
            <Text style={[cell, { width: 22, color: colors.muted }]}>
              {i + 1}
            </Text>
            <Text style={[cell, { flex: 2.4, fontFamily: theme.bold }]}>
              {med.name}
            </Text>
            <Text style={[cell, { flex: 1.1 }]}>{med.dosage || "—"}</Text>
            <Text style={[cell, { flex: 1.1 }]}>{med.route || "—"}</Text>
            <Text style={[cell, { flex: 1.4 }]}>{med.frequency || "—"}</Text>
            <Text style={[cell, { flex: 1.0 }]}>{med.duration || "—"}</Text>
            <Text style={[cell, { flex: 0.7 }]}>{med.quantity || "—"}</Text>
          </View>
          {med.instructions ? (
            <Text
              style={{
                fontSize: 8.5,
                color: colors.muted,
                marginLeft: 22,
                marginTop: 3,
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
}: {
  theme: Theme;
  medicines: Medicine[];
}) {
  const { colors } = theme.layout;
  return (
    <View>
      {medicines.map((med, i) => {
        const details = [
          med.dosage,
          med.route,
          med.frequency,
          med.duration,
          med.quantity ? `Qty ${med.quantity}` : null,
        ]
          .filter(Boolean)
          .join("  ·  ");
        return (
          <View key={i} wrap={false} style={{ marginBottom: 10 }}>
            <Text
              style={{
                fontSize: 10,
                fontFamily: theme.bold,
                color: colors.ink,
              }}
            >
              {i + 1}.  {med.name}
            </Text>
            {details ? (
              <Text
                style={{
                  fontSize: 9.5,
                  color: colors.ink,
                  marginLeft: 16,
                  marginTop: 3,
                }}
              >
                {details}
              </Text>
            ) : null}
            {med.instructions ? (
              <Text
                style={{
                  fontSize: 8.5,
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
}: {
  theme: Theme;
  medicines: Medicine[];
}) {
  const { colors } = theme.layout;
  return (
    <View>
      {medicines.map((med, i) => {
        const details = [
          med.dosage,
          med.route,
          med.frequency,
          med.duration,
          med.quantity ? `Qty ${med.quantity}` : null,
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
              paddingVertical: 8,
              paddingHorizontal: 11,
              marginBottom: 7,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text
                style={{ fontSize: 10, fontFamily: theme.bold, color: colors.ink }}
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
              <Text style={{ fontSize: 9, color: colors.ink, marginTop: 4 }}>
                {[med.dosage, med.route, med.frequency]
                  .filter(Boolean)
                  .join("  ·  ")}
                {med.quantity ? `  ·  Qty ${med.quantity}` : ""}
              </Text>
            ) : null}
            {med.instructions ? (
              <Text style={{ fontSize: 8.5, color: colors.muted, marginTop: 3 }}>
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
}: {
  theme: Theme;
  medicines: Medicine[];
}) {
  switch (theme.layout.medicines) {
    case "table":
      return <MedicinesTable theme={theme} medicines={medicines} />;
    case "cards":
      return <MedicinesCards theme={theme} medicines={medicines} />;
    case "list":
    default:
      return <MedicinesList theme={theme} medicines={medicines} />;
  }
}

/* ------------------------------ Document ------------------------------ */

export function PrescriptionDocument(props: PrescriptionPdfProps) {
  const theme = buildTheme(props.layout);
  const { colors, header } = theme.layout;
  const adviceLines = parseAdviceLines(props.advice);

  const isBanner = header === "banner";
  const isSideband = header === "sideband";

  const pageStyle: Style = {
    fontSize: 10,
    fontFamily: theme.body,
    color: colors.ink,
    paddingTop: isBanner ? 0 : 44,
    paddingBottom: 44,
    paddingLeft: isBanner ? 0 : isSideband ? 58 : 48,
    paddingRight: isBanner ? 0 : 48,
  };

  const bodyStyle: Style = isBanner
    ? { paddingTop: 24, paddingHorizontal: 48 }
    : {};

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
          <View style={{ marginTop: isBanner ? 0 : 16 }}>
            <PatientInfo theme={theme} props={props} />
          </View>

          <View style={{ marginTop: 14 }}>
            <SectionTitle theme={theme}>Diagnosis</SectionTitle>
            <Text style={{ fontSize: 10, color: colors.ink }}>
              {props.diagnosis || "—"}
            </Text>
          </View>

          <View style={{ marginTop: 18 }}>
            <RxMark theme={theme} />
            <Medicines theme={theme} medicines={props.medicines} />
          </View>

          {adviceLines.length > 0 ? (
            <View style={{ marginTop: 16 }}>
              <SectionTitle theme={theme}>Advice</SectionTitle>
              {adviceLines.map((line, i) => (
                <Text
                  key={i}
                  style={{
                    fontSize: 9.5,
                    color: colors.ink,
                    marginBottom: 3,
                    marginLeft: 4,
                  }}
                >
                  •  {line}
                </Text>
              ))}
            </View>
          ) : null}

          {props.followUp?.trim() ? (
            <View style={{ marginTop: 14 }}>
              <SectionTitle theme={theme}>Follow-up</SectionTitle>
              <Text style={{ fontSize: 9.5, color: colors.ink }}>
                {props.followUp.trim()}
              </Text>
            </View>
          ) : null}

          <View wrap={false} style={{ marginTop: 36, alignItems: "flex-end" }}>
            <View
              style={{
                borderTop: `0.75px solid ${colors.muted}`,
                paddingTop: 6,
                minWidth: 150,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 9.5, fontFamily: theme.bold }}>
                Dr. {props.doctorName}
              </Text>
              <Text style={{ fontSize: 7.5, color: colors.muted, marginTop: 2 }}>
                Digital signature
              </Text>
            </View>
          </View>
        </View>

        <View
          fixed
          style={{
            position: "absolute",
            bottom: 22,
            left: isSideband ? 58 : 48,
            right: 48,
            borderTop: `0.75px solid ${colors.rule}`,
            paddingTop: 6,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: 7, color: colors.muted }}>
            {props.clinicName} · {props.clinicPhone}
          </Text>
          <Text
            style={{ fontSize: 7, color: colors.muted }}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

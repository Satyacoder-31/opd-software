import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Medicine } from "@/lib/types";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: "#1A2332" },
  rule: { borderBottom: "1px solid #CBD5E1", marginVertical: 14 },
  header: { alignItems: "center", marginBottom: 4 },
  clinicName: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#1A85C8",
  },
  clinicMeta: { fontSize: 9, color: "#5C6B7A", marginTop: 6, textAlign: "center" },
  doctorBlock: { marginTop: 16, marginBottom: 4 },
  doctorName: { fontSize: 11, fontWeight: "bold" },
  doctorMeta: { fontSize: 9, color: "#5C6B7A", marginTop: 2 },
  fieldRow: { marginBottom: 5 },
  fieldLabel: { fontSize: 9, color: "#5C6B7A", marginBottom: 2 },
  fieldValue: { fontSize: 10 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1A2332",
  },
  medicineBlock: { marginBottom: 12 },
  medicineTitle: { fontSize: 10, fontWeight: "bold", marginBottom: 4 },
  medicineLine: { fontSize: 10, color: "#334155", marginLeft: 12, marginBottom: 2 },
  bullet: { fontSize: 10, marginLeft: 8, marginBottom: 3, color: "#334155" },
  signatureBlock: { marginTop: 28, alignItems: "flex-end" },
  signatureName: { fontSize: 10, fontWeight: "bold" },
  signatureLabel: { fontSize: 8, color: "#5C6B7A", marginTop: 2 },
});

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
};

function parseAdviceLines(advice?: string): string[] {
  if (!advice?.trim()) return [];
  return advice
    .split(/\n|•/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function PrescriptionDocument({
  clinicName,
  clinicPhone,
  clinicAddress,
  doctorName,
  doctorQualifications,
  doctorRegistrationNo,
  date,
  patientName,
  patientAge,
  patientGender,
  patientMrn,
  patientPhone,
  diagnosis,
  medicines,
  advice,
  followUp,
}: PrescriptionPdfProps) {
  const adviceLines = parseAdviceLines(advice);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.clinicName}>{clinicName}</Text>
          <Text style={styles.clinicMeta}>
            {clinicAddress} | {clinicPhone}
          </Text>
        </View>

        <View style={styles.rule} />

        <View style={styles.doctorBlock}>
          <Text style={styles.doctorName}>Dr. {doctorName}</Text>
          {doctorQualifications ? (
            <Text style={styles.doctorMeta}>{doctorQualifications}</Text>
          ) : null}
          {doctorRegistrationNo ? (
            <Text style={styles.doctorMeta}>Reg. No: {doctorRegistrationNo}</Text>
          ) : null}
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Date</Text>
          <Text style={styles.fieldValue}>{date}</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Patient</Text>
          <Text style={styles.fieldValue}>{patientName}</Text>
        </View>
        {patientAge ? (
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Age</Text>
            <Text style={styles.fieldValue}>{patientAge}</Text>
          </View>
        ) : null}
        {patientGender ? (
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Gender</Text>
            <Text style={styles.fieldValue}>{patientGender}</Text>
          </View>
        ) : null}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>MRN</Text>
          <Text style={styles.fieldValue}>{patientMrn}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Phone</Text>
          <Text style={styles.fieldValue}>{patientPhone}</Text>
        </View>

        <View style={{ marginTop: 10, marginBottom: 4 }}>
          <Text style={styles.fieldLabel}>Diagnosis</Text>
          <Text style={styles.fieldValue}>{diagnosis || "—"}</Text>
        </View>

        <View style={styles.rule} />

        <Text style={styles.sectionTitle}>Rx</Text>
        {medicines.map((med, i) => (
          <View key={i} style={styles.medicineBlock}>
            <Text style={styles.medicineTitle}>
              {i + 1}. {med.name}
            </Text>
            {med.dosage ? (
              <Text style={styles.medicineLine}>- {med.dosage}</Text>
            ) : null}
            {med.frequency ? (
              <Text style={styles.medicineLine}>- {med.frequency}</Text>
            ) : null}
            {med.duration ? (
              <Text style={styles.medicineLine}>- {med.duration}</Text>
            ) : null}
            {med.instructions ? (
              <Text style={styles.medicineLine}>- {med.instructions}</Text>
            ) : null}
          </View>
        ))}

        {adviceLines.length > 0 ? (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.sectionTitle}>Advice</Text>
            {adviceLines.map((line, i) => (
              <Text key={i} style={styles.bullet}>
                • {line}
              </Text>
            ))}
          </View>
        ) : null}

        {followUp?.trim() ? (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>Follow-up</Text>
            <Text style={styles.fieldValue}>{followUp.trim()}</Text>
          </View>
        ) : null}

        <View style={styles.signatureBlock}>
          <Text style={styles.signatureName}>Dr. {doctorName}</Text>
          <Text style={styles.signatureLabel}>(Digital Signature)</Text>
        </View>

        <View style={[styles.rule, { marginTop: 20 }]} />
      </Page>
    </Document>
  );
}

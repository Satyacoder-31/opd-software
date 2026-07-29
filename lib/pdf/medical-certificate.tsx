import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: "#1A2332" },
  rule: { borderBottom: "1px solid #CBD5E1", marginVertical: 14 },
  header: { alignItems: "center", marginBottom: 4 },
  logo: { width: 44, height: 44, objectFit: "contain", marginBottom: 8 },
  clinicName: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#1A85C8",
  },
  clinicMeta: { fontSize: 9, color: "#5C6B7A", marginTop: 6, textAlign: "center" },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  doctorBlock: { marginTop: 8, marginBottom: 12 },
  doctorName: { fontSize: 11, fontWeight: "bold" },
  doctorMeta: { fontSize: 9, color: "#5C6B7A", marginTop: 2 },
  fieldRow: { marginBottom: 8 },
  fieldLabel: { fontSize: 9, color: "#5C6B7A", marginBottom: 2 },
  fieldValue: { fontSize: 10 },
  bodyText: { fontSize: 10, lineHeight: 1.5, marginTop: 16, marginBottom: 8 },
  signatureBlock: { marginTop: 40, alignItems: "flex-end" },
  signatureName: { fontSize: 10, fontWeight: "bold" },
  signatureLabel: { fontSize: 8, color: "#5C6B7A", marginTop: 2 },
});

export type MedicalCertificatePdfProps = {
  clinicName: string;
  clinicPhone: string;
  clinicAddress: string;
  clinicLogoUrl?: string | null;
  doctorName: string;
  doctorQualifications?: string;
  doctorRegistrationNo?: string;
  date: string;
  patientName: string;
  patientAge?: string;
  patientGender?: string;
  patientMrn: string;
  diagnosisForCertificate?: string;
  restFrom?: string;
  restTo?: string;
  fitnessStatus?: string;
  remarks?: string;
};

function formatRestPeriod(restFrom?: string, restTo?: string): string | null {
  if (restFrom?.trim() && restTo?.trim()) {
    return `from ${restFrom.trim()} to ${restTo.trim()}`;
  }
  if (restFrom?.trim()) return `from ${restFrom.trim()}`;
  if (restTo?.trim()) return `until ${restTo.trim()}`;
  return null;
}

export function MedicalCertificateDocument({
  clinicName,
  clinicPhone,
  clinicAddress,
  clinicLogoUrl,
  doctorName,
  doctorQualifications,
  doctorRegistrationNo,
  date,
  patientName,
  patientAge,
  patientGender,
  patientMrn,
  diagnosisForCertificate,
  restFrom,
  restTo,
  fitnessStatus,
  remarks,
}: MedicalCertificatePdfProps) {
  const restPeriod = formatRestPeriod(restFrom, restTo);
  const patientDetails = [
    patientAge,
    patientGender,
    `MRN: ${patientMrn}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {clinicLogoUrl ? (
            <Image src={clinicLogoUrl} style={styles.logo} />
          ) : null}
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

        <Text style={styles.title}>Medical Certificate</Text>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Date</Text>
          <Text style={styles.fieldValue}>{date}</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Patient</Text>
          <Text style={styles.fieldValue}>{patientName}</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Patient details</Text>
          <Text style={styles.fieldValue}>{patientDetails}</Text>
        </View>

        <Text style={styles.bodyText}>
          This is to certify that {patientName}
          {diagnosisForCertificate?.trim()
            ? ` has been diagnosed with ${diagnosisForCertificate.trim()}`
            : " has been examined at this clinic"}
          {restPeriod ? ` and is advised rest ${restPeriod}` : ""}
          {fitnessStatus?.trim() ? `. Fitness status: ${fitnessStatus.trim()}` : "."}
        </Text>

        {remarks?.trim() ? (
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Remarks</Text>
            <Text style={styles.fieldValue}>{remarks.trim()}</Text>
          </View>
        ) : null}

        <View style={styles.signatureBlock}>
          <Text style={styles.signatureName}>Dr. {doctorName}</Text>
          <Text style={styles.signatureLabel}>(Authorized Signatory)</Text>
        </View>

        <View style={[styles.rule, { marginTop: 24 }]} />
      </Page>
    </Document>
  );
}

import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: "#1A2332" },
  header: { alignItems: "center", marginBottom: 18 },
  logo: { width: 44, height: 44, objectFit: "contain", marginBottom: 8 },
  clinic: { fontSize: 16, fontWeight: "bold", color: "#1A85C8" },
  muted: { color: "#5C6B7A", marginTop: 4 },
  rule: { borderBottom: "1px solid #CBD5E1", marginVertical: 12 },
  title: { fontSize: 15, fontWeight: "bold", textAlign: "center", marginVertical: 16 },
  row: { marginBottom: 10 },
  label: { color: "#5C6B7A", fontSize: 8, marginBottom: 3, textTransform: "uppercase" },
  value: { fontSize: 10, lineHeight: 1.45 },
  sign: { marginTop: 42, alignItems: "flex-end" },
});

export type ReferralPdfProps = {
  clinicName: string;
  clinicPhone: string;
  clinicAddress: string;
  clinicLogoUrl?: string | null;
  doctorName: string;
  doctorQualifications?: string;
  doctorRegistrationNo?: string;
  date: string;
  patientName: string;
  patientMrn: string;
  patientAge?: string;
  patientGender?: string;
  toSpecialty?: string;
  toFacility?: string;
  reason?: string;
  notes?: string;
  diagnosis?: string;
};

export function ReferralDocument(props: ReferralPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {props.clinicLogoUrl ? (
            <Image src={props.clinicLogoUrl} style={styles.logo} />
          ) : null}
          <Text style={styles.clinic}>{props.clinicName}</Text>
          <Text style={styles.muted}>{props.clinicAddress} | {props.clinicPhone}</Text>
        </View>
        <View style={styles.rule} />
        <Text style={styles.title}>Referral Letter</Text>
        <View style={styles.row}><Text style={styles.label}>Date</Text><Text>{props.date}</Text></View>
        <View style={styles.row}>
          <Text style={styles.label}>Patient</Text>
          <Text style={styles.value}>
            {props.patientName} · MRN {props.patientMrn}
            {props.patientAge ? ` · ${props.patientAge}` : ""}
            {props.patientGender ? ` · ${props.patientGender}` : ""}
          </Text>
        </View>
        <View style={styles.row}><Text style={styles.label}>Referred to</Text><Text style={styles.value}>{[props.toSpecialty, props.toFacility].filter(Boolean).join(" · ") || "Specialist consultation"}</Text></View>
        {props.diagnosis ? <View style={styles.row}><Text style={styles.label}>Clinical diagnosis</Text><Text style={styles.value}>{props.diagnosis}</Text></View> : null}
        {props.reason ? <View style={styles.row}><Text style={styles.label}>Reason for referral</Text><Text style={styles.value}>{props.reason}</Text></View> : null}
        {props.notes ? <View style={styles.row}><Text style={styles.label}>Clinical notes</Text><Text style={styles.value}>{props.notes}</Text></View> : null}
        <View style={styles.sign}>
          <Text style={{ fontWeight: "bold" }}>Dr. {props.doctorName}</Text>
          {props.doctorQualifications ? <Text style={styles.muted}>{props.doctorQualifications}</Text> : null}
          {props.doctorRegistrationNo ? <Text style={styles.muted}>Reg. No: {props.doctorRegistrationNo}</Text> : null}
        </View>
      </Page>
    </Document>
  );
}

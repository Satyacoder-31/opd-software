import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { LineItem } from "@/lib/types";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  header: { marginBottom: 20, flexDirection: "row", alignItems: "center" },
  logo: { width: 40, height: 40, objectFit: "contain", marginRight: 12 },
  clinicName: { fontSize: 18, fontWeight: "bold", color: "#1A85C8" },
  clinicInfo: { fontSize: 9, color: "#5C6B7A", marginTop: 4 },
  title: { fontSize: 14, fontWeight: "bold", marginBottom: 16, color: "#1A2332" },
  divider: { borderBottom: "1px solid #E2E8F0", marginVertical: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottom: "1px solid #F1F5F9" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, paddingTop: 8, borderTop: "2px solid #1A2332" },
  totalLabel: { fontSize: 13, fontWeight: "bold" },
  totalValue: { fontSize: 13, fontWeight: "bold", color: "#1A85C8" },
  paidBadge: { fontSize: 10, color: "#1A85C8", marginTop: 8 },
});

type ReceiptPdfProps = {
  clinicName: string;
  clinicPhone: string;
  clinicAddress: string;
  clinicGstin?: string;
  clinicLogoUrl?: string | null;
  patientName: string;
  lineItems: LineItem[] | null;
  amount: number;
  taxableAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  paymentMode: string;
  date: string;
  invoiceId: string;
  invoiceNumber?: string;
};

export function ReceiptDocument({
  clinicName,
  clinicPhone,
  clinicAddress,
  clinicGstin,
  clinicLogoUrl,
  patientName,
  lineItems,
  amount,
  taxableAmount,
  taxRate,
  taxAmount,
  paymentMode,
  date,
  invoiceId,
  invoiceNumber,
}: ReceiptPdfProps) {
  const showTax = (taxRate ?? 0) > 0 && (taxAmount ?? 0) > 0;
  const receiptNo = invoiceNumber ?? invoiceId.slice(0, 8).toUpperCase();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {clinicLogoUrl ? (
            <Image src={clinicLogoUrl} style={styles.logo} />
          ) : null}
          <View>
            <Text style={styles.clinicName}>{clinicName}</Text>
            <Text style={styles.clinicInfo}>{clinicAddress}</Text>
            <Text style={styles.clinicInfo}>Tel: {clinicPhone}</Text>
            {clinicGstin ? (
              <Text style={styles.clinicInfo}>GSTIN: {clinicGstin}</Text>
            ) : null}
          </View>
        </View>

        <Text style={styles.title}>Payment Receipt</Text>

        <View style={styles.row}>
          <Text>Invoice #</Text>
          <Text>{receiptNo}</Text>
        </View>
        <View style={styles.row}>
          <Text>Date</Text>
          <Text>{date}</Text>
        </View>
        <View style={styles.row}>
          <Text>Patient</Text>
          <Text>{patientName}</Text>
        </View>

        <View style={styles.divider} />

        {lineItems && lineItems.length > 0 ? (
          lineItems.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text>{item.description}</Text>
              <Text>₹{item.amount.toFixed(2)}</Text>
            </View>
          ))
        ) : (
          <View style={styles.itemRow}>
            <Text>Consultation fee</Text>
            <Text>₹{(taxableAmount ?? amount).toFixed(2)}</Text>
          </View>
        )}

        {showTax ? (
          <>
            <View style={styles.row}>
              <Text>Taxable amount</Text>
              <Text>₹{(taxableAmount ?? amount).toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
              <Text>GST ({taxRate}%)</Text>
              <Text>₹{(taxAmount ?? 0).toFixed(2)}</Text>
            </View>
          </>
        ) : null}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Paid</Text>
          <Text style={styles.totalValue}>₹{amount.toFixed(2)}</Text>
        </View>

        <Text style={styles.paidBadge}>
          Paid via {paymentMode.toUpperCase()}
        </Text>
      </Page>
    </Document>
  );
}

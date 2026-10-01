import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { LineItem, Vitals } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1e293b",
    backgroundColor: "#ffffff",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: "#0284c7",
  },
  clinicBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "65%",
  },
  logo: {
    width: 44,
    height: 44,
    objectFit: "contain",
    marginRight: 10,
  },
  clinicName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#0a192f",
    marginBottom: 2,
  },
  clinicAddress: {
    fontSize: 8,
    color: "#475569",
    lineHeight: 1.3,
  },
  receiptBadgeContainer: {
    alignItems: "flex-end",
  },
  receiptTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#0284c7",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  receiptMetaRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 1,
  },
  metaLabel: {
    fontSize: 8,
    color: "#64748b",
  },
  metaValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0a192f",
  },

  // Patient & Doctor Section
  gridSection: {
    flexDirection: "row",
    marginTop: 12,
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  gridColumn: {
    flex: 1,
  },
  columnTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#0284c7",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  infoLabel: {
    width: 60,
    fontSize: 8,
    color: "#64748b",
  },
  infoValue: {
    flex: 1,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },

  // Vitals Bar - Explicitly highlighted
  vitalsContainer: {
    marginTop: 10,
    padding: 8,
    backgroundColor: "#f0f9ff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  vitalsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#bae6fd",
    paddingBottom: 3,
  },
  vitalsTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0369a1",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  vitalsSubtitle: {
    fontSize: 7,
    color: "#0284c7",
  },
  vitalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  vitalTile: {
    width: "16%",
    minWidth: 50,
    backgroundColor: "#ffffff",
    padding: 4,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: "#e0f2fe",
    alignItems: "center",
  },
  vitalLabel: {
    fontSize: 6.5,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 1,
  },
  vitalValue: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#0a192f",
  },
  vitalUnit: {
    fontSize: 6,
    color: "#94a3b8",
  },

  // Clinical Summary
  clinicalBox: {
    marginTop: 8,
    padding: 6,
    backgroundColor: "#ffffff",
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    gap: 16,
  },
  clinicalItem: {
    flex: 1,
  },
  clinicalItemLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    textTransform: "uppercase",
    marginBottom: 1,
  },
  clinicalItemValue: {
    fontSize: 8,
    color: "#0f172a",
  },

  // Table
  tableContainer: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0a192f",
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#ffffff",
  },
  tableRowAlt: {
    backgroundColor: "#f8fafc",
  },
  colDesc: {
    flex: 5,
    fontSize: 8,
    color: "#1e293b",
  },
  colSac: {
    flex: 2,
    fontSize: 7.5,
    color: "#64748b",
    textAlign: "center",
  },
  colAmount: {
    flex: 2,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textAlign: "right",
  },

  // Totals & Payment Summary
  totalsContainer: {
    flexDirection: "row",
    marginTop: 8,
    justifyContent: "space-between",
  },
  paymentModeCard: {
    width: "48%",
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  paymentModeTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  paidBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#dcfce7",
    color: "#15803d",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  taxBreakdownCard: {
    width: "48%",
  },
  taxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  taxLabel: {
    fontSize: 8,
    color: "#64748b",
  },
  taxValue: {
    fontSize: 8,
    fontFamily: "Helvetica",
    color: "#1e293b",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    marginTop: 4,
    borderTopWidth: 1.5,
    borderTopColor: "#0284c7",
    borderBottomWidth: 1.5,
    borderBottomColor: "#0284c7",
  },
  grandTotalLabel: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0a192f",
  },
  grandTotalValue: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#0284c7",
  },

  // Footer & Signatures
  footerContainer: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  termsText: {
    maxWidth: "60%",
    fontSize: 6.5,
    color: "#94a3b8",
    lineHeight: 1.3,
  },
  signatureBox: {
    alignItems: "center",
    width: 140,
  },
  signatureLine: {
    width: 120,
    borderBottomWidth: 1,
    borderBottomColor: "#94a3b8",
    marginBottom: 4,
  },
  signatureTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
  },
  signatureClinic: {
    fontSize: 6.5,
    color: "#94a3b8",
  },
});

export type ReceiptPdfProps = {
  clinicName: string;
  clinicPhone: string;
  clinicAddress: string;
  clinicGstin?: string;
  clinicEmail?: string;
  clinicLogoUrl?: string | null;
  patientName: string;
  patientMrn?: string;
  patientAge?: string | null;
  patientGender?: string | null;
  patientPhone?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  doctorRegNo?: string;
  tokenNumber?: number;
  queueDate?: string;
  chiefComplaint?: string;
  diagnosis?: string;
  vitals?: Vitals | null;
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
  clinicEmail,
  clinicLogoUrl,
  patientName,
  patientMrn,
  patientAge,
  patientGender,
  patientPhone,
  doctorName,
  doctorSpecialty,
  doctorRegNo,
  tokenNumber,
  queueDate,
  chiefComplaint,
  diagnosis,
  vitals,
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
  const baseAmount = taxableAmount ?? amount;

  // Extract vitals with fallbacks
  const bp = vitals?.bp?.trim() || "—";
  const pulse = vitals?.pulse?.trim() ? `${vitals.pulse} bpm` : "—";
  const temp = vitals?.temp?.trim() ? `${vitals.temp} °F` : "—";
  const weight = vitals?.weight?.trim() ? `${vitals.weight} kg` : "—";
  const spo2 = vitals?.spo2?.trim() ? `${vitals.spo2} %` : "—";
  const heightVal = vitals?.height?.trim();
  const bmiVal = vitals?.bmi?.trim();
  const heightBmi = bmiVal
    ? `${bmiVal}${heightVal ? ` (${heightVal} cm)` : ""}`
    : heightVal
    ? `${heightVal} cm`
    : "—";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Clinic Branding & Invoice Title */}
        <View style={styles.headerContainer}>
          <View style={styles.clinicBrandRow}>
            {clinicLogoUrl ? (
              <Image src={clinicLogoUrl} style={styles.logo} />
            ) : null}
            <View>
              <Text style={styles.clinicName}>{clinicName}</Text>
              <Text style={styles.clinicAddress}>{clinicAddress}</Text>
              <Text style={styles.clinicAddress}>
                Phone: {clinicPhone}
                {clinicEmail ? ` | Email: ${clinicEmail}` : ""}
              </Text>
              {clinicGstin ? (
                <Text style={styles.clinicAddress}>GSTIN: {clinicGstin}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.receiptBadgeContainer}>
            <Text style={styles.receiptTitle}>TAX INVOICE & RECEIPT</Text>
            <View style={styles.receiptMetaRow}>
              <Text style={styles.metaLabel}>Invoice No:</Text>
              <Text style={styles.metaValue}>{receiptNo}</Text>
            </View>
            <View style={styles.receiptMetaRow}>
              <Text style={styles.metaLabel}>Date:</Text>
              <Text style={styles.metaValue}>{date}</Text>
            </View>
            {tokenNumber ? (
              <View style={styles.receiptMetaRow}>
                <Text style={styles.metaLabel}>Token #:</Text>
                <Text style={styles.metaValue}>{tokenNumber}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Patient & Doctor Two-Column Grid */}
        <View style={styles.gridSection}>
          <View style={styles.gridColumn}>
            <Text style={styles.columnTitle}>Patient Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{patientName}</Text>
            </View>
            {patientMrn ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>UHID / MRN:</Text>
                <Text style={styles.infoValue}>{patientMrn}</Text>
              </View>
            ) : null}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Age / Sex:</Text>
              <Text style={styles.infoValue}>
                {patientAge ?? "—"} {patientGender ? `· ${patientGender}` : ""}
              </Text>
            </View>
            {patientPhone ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Contact:</Text>
                <Text style={styles.infoValue}>{patientPhone}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.gridColumn}>
            <Text style={styles.columnTitle}>Consultation Details</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Doctor:</Text>
              <Text style={styles.infoValue}>
                {doctorName ? `Dr. ${doctorName}` : "Consultant Specialist"}
              </Text>
            </View>
            {doctorSpecialty ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Specialty:</Text>
                <Text style={styles.infoValue}>{doctorSpecialty}</Text>
              </View>
            ) : null}
            {doctorRegNo ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Reg. No:</Text>
                <Text style={styles.infoValue}>{doctorRegNo}</Text>
              </View>
            ) : null}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Visit Date:</Text>
              <Text style={styles.infoValue}>{queueDate ?? date}</Text>
            </View>
          </View>
        </View>

        {/* Clinical Vitals Bar — temperature, weight, bp, pulse, spo2, bmi */}
        <View style={styles.vitalsContainer}>
          <View style={styles.vitalsHeader}>
            <Text style={styles.vitalsTitle}>
              Clinical Vitals & Recorded Metrics
            </Text>
            <Text style={styles.vitalsSubtitle}>
              Recorded at triage / consultation
            </Text>
          </View>
          <View style={styles.vitalsGrid}>
            <View style={styles.vitalTile}>
              <Text style={styles.vitalLabel}>Blood Pressure</Text>
              <Text style={styles.vitalValue}>{bp}</Text>
              <Text style={styles.vitalUnit}>mmHg</Text>
            </View>
            <View style={styles.vitalTile}>
              <Text style={styles.vitalLabel}>Heart / Pulse</Text>
              <Text style={styles.vitalValue}>{pulse}</Text>
            </View>
            <View style={styles.vitalTile}>
              <Text style={styles.vitalLabel}>Body Temp</Text>
              <Text style={styles.vitalValue}>{temp}</Text>
            </View>
            <View style={styles.vitalTile}>
              <Text style={styles.vitalLabel}>Weight</Text>
              <Text style={styles.vitalValue}>{weight}</Text>
            </View>
            <View style={styles.vitalTile}>
              <Text style={styles.vitalLabel}>Oxygen SpO₂</Text>
              <Text style={styles.vitalValue}>{spo2}</Text>
            </View>
            <View style={styles.vitalTile}>
              <Text style={styles.vitalLabel}>Height / BMI</Text>
              <Text style={styles.vitalValue}>{heightBmi}</Text>
            </View>
          </View>
        </View>

        {/* Diagnosis & Clinical Summary if present */}
        {(chiefComplaint || diagnosis) && (
          <View style={styles.clinicalBox}>
            {chiefComplaint ? (
              <View style={styles.clinicalItem}>
                <Text style={styles.clinicalItemLabel}>Chief Complaint</Text>
                <Text style={styles.clinicalItemValue}>{chiefComplaint}</Text>
              </View>
            ) : null}
            {diagnosis ? (
              <View style={styles.clinicalItem}>
                <Text style={styles.clinicalItemLabel}>Diagnosis / Impression</Text>
                <Text style={styles.clinicalItemValue}>{diagnosis}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Itemized Table of Services / Fees */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>
              Description of Service / Item
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colSac]}>SAC / Code</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>
              Amount (INR)
            </Text>
          </View>

          {lineItems && lineItems.length > 0 ? (
            lineItems.map((item, idx) => (
              <View
                key={idx}
                style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
              >
                <Text style={styles.colDesc}>{item.description}</Text>
                <Text style={styles.colSac}>999312</Text>
                <Text style={styles.colAmount}>₹{item.amount.toFixed(2)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <Text style={styles.colDesc}>
                Outpatient Consultation & Clinical Examination
              </Text>
              <Text style={styles.colSac}>999312</Text>
              <Text style={styles.colAmount}>₹{baseAmount.toFixed(2)}</Text>
            </View>
          )}
        </View>

        {/* Totals & Tax Breakdown & Payment Info */}
        <View style={styles.totalsContainer}>
          <View style={styles.paymentModeCard}>
            <Text style={styles.paymentModeTitle}>Payment Settlement</Text>
            <Text style={styles.paidBadge}>
              PAID IN FULL · {paymentMode.toUpperCase()}
            </Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={styles.infoValue}>Settled & Reconciled</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ref ID:</Text>
              <Text style={styles.infoValue}>{receiptNo}</Text>
            </View>
          </View>

          <View style={styles.taxBreakdownCard}>
            <View style={styles.taxRow}>
              <Text style={styles.taxLabel}>Subtotal / Taxable:</Text>
              <Text style={styles.taxValue}>₹{baseAmount.toFixed(2)}</Text>
            </View>

            {showTax ? (
              <View style={styles.taxRow}>
                <Text style={styles.taxLabel}>GST / Tax ({taxRate}%):</Text>
                <Text style={styles.taxValue}>₹{(taxAmount ?? 0).toFixed(2)}</Text>
              </View>
            ) : (
              <View style={styles.taxRow}>
                <Text style={styles.taxLabel}>Taxes (Healthcare Exempt):</Text>
                <Text style={styles.taxValue}>₹0.00</Text>
              </View>
            )}

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total Paid:</Text>
              <Text style={styles.grandTotalValue}>₹{amount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Footer, Terms, and Authorized Signatory */}
        <View style={styles.footerContainer}>
          <Text style={styles.termsText}>
            This is a computer-generated tax invoice and clinical OPD receipt
            issued by {clinicName}. It incorporates recorded vitals and
            diagnostic notes for medical reimbursement and tax records.
          </Text>

          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureTitle}>Authorized Signatory</Text>
            <Text style={styles.signatureClinic}>{clinicName}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

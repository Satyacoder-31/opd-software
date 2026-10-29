import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Medicine } from "@/lib/types";
import { getGenericCompositionForDrug } from "@/lib/drug-catalog";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#0f172a",
    backgroundColor: "#ffffff",
    lineHeight: 1.35,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1.5,
    borderBottomColor: "#0f172a",
    paddingBottom: 8,
    marginBottom: 8,
  },
  doctorBlock: {
    maxWidth: "40%",
  },
  doctorName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    color: "#0a192f",
  },
  doctorSub: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#334155",
    marginTop: 1,
  },
  docEmail: {
    fontSize: 7.5,
    color: "#475569",
    marginTop: 1,
  },
  titleBlock: {
    alignItems: "center",
  },
  docTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  clinicLogo: {
    width: 36,
    height: 36,
    objectFit: "contain",
  },

  // Patient demographic container
  patientContainer: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 7,
    marginBottom: 8,
    backgroundColor: "#f8fafc",
  },
  patientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  patientName: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0a192f",
    textTransform: "uppercase",
  },
  patientMeta: {
    fontSize: 7.5,
    color: "#334155",
  },
  allergyRow: {
    marginTop: 4,
    paddingTop: 3,
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
  },
  allergyText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#b91c1c",
  },
  allergySafe: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#15803d",
  },

  // Content Sections
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    color: "#0a192f",
    borderBottomWidth: 0.5,
    borderBottomColor: "#94a3b8",
    paddingBottom: 2,
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  sectionContent: {
    fontSize: 8,
    color: "#1e293b",
    lineHeight: 1.4,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bulletDot: {
    width: 10,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  bulletText: {
    flex: 1,
    fontSize: 8,
    color: "#1e293b",
  },

  // Medicines Table
  table: {
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 0.5,
    borderBottomColor: "#cbd5e1",
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  colMed: {
    flex: 4,
  },
  colDose: {
    flex: 1.2,
    textAlign: "center",
  },
  medName: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#0a192f",
  },
  medGeneric: {
    fontSize: 7,
    color: "#0f766e",
    marginTop: 1,
  },
  medSub: {
    fontSize: 7,
    color: "#475569",
    marginTop: 1,
  },
  timingPill: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#0284c7",
    textAlign: "center",
  },

  // Footer & Signature
  footerContainer: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerMeta: {
    fontSize: 7,
    color: "#64748b",
  },
  signatoryBlock: {
    alignItems: "flex-end",
    minWidth: 160,
  },
  signatoryName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0a192f",
  },
  signatorySub: {
    fontSize: 7.5,
    color: "#475569",
  },
  pageNumber: {
    position: "absolute",
    fontSize: 7,
    bottom: 12,
    right: 32,
    color: "#94a3b8",
  },
});

export type OutpatientSummaryPdfProps = {
  clinicName: string;
  clinicPhone: string;
  clinicAddress: string;
  clinicEmail?: string;
  clinicLogoUrl?: string | null;
  doctorName: string;
  doctorSpecialty?: string;
  doctorEmail?: string;
  doctorRegistrationNo?: string;
  doctorQualifications?: string;
  date: string;
  patientName: string;
  patientDob?: string;
  patientAge?: string;
  patientGender?: string;
  patientAddress?: string;
  patientPhone: string;
  patientUhid: string;
  opNumber?: string;
  visitDate: string;
  patientAllergies?: string | null;
  chiefComplaints?: string | null;
  historyOfPresentIllness?: string | null;
  currentMedications?: string | null;
  physicalExamination?: string | null;
  diagnosis: string;
  diagnosisType?: string;
  investigationResults?: string | null;
  labs?: string | null;
  medicines: Medicine[];
  advice?: string | null;
  followUp?: string | null;
  language?: "en" | "hi";
};

export function OutpatientSummaryDocument(props: OutpatientSummaryPdfProps) {
  const hasAllergies = Boolean(props.patientAllergies?.trim());

  // Parse lines for clean display
  const complaintLines = props.chiefComplaints
    ? props.chiefComplaints.split(/\n|•/).map((l) => l.trim()).filter(Boolean)
    : [];

  const examLines = props.physicalExamination
    ? props.physicalExamination.split(/\n|•/).map((l) => l.trim()).filter(Boolean)
    : [];

  const adviceLines = props.advice
    ? props.advice.split(/\n|•/).map((l) => l.trim()).filter(Boolean)
    : [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.headerRow}>
          <View style={styles.doctorBlock}>
            <Text style={styles.doctorName}>
              {props.doctorName.startsWith("Dr.") ? props.doctorName : `Dr. ${props.doctorName}`}
            </Text>
            {props.doctorSpecialty && (
              <Text style={styles.doctorSub}>{props.doctorSpecialty.toUpperCase()}</Text>
            )}
            {props.doctorQualifications && (
              <Text style={styles.docEmail}>{props.doctorQualifications}</Text>
            )}
            {props.doctorRegistrationNo && (
              <Text style={styles.docEmail}>Reg. No: {props.doctorRegistrationNo}</Text>
            )}
            {props.doctorEmail && (
              <Text style={styles.docEmail}>Email: {props.doctorEmail}</Text>
            )}
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.docTitle}>Outpatient Summary and Prescription</Text>
            <Text style={[styles.docEmail, { textAlign: "center", marginTop: 2 }]}>
              {props.clinicName}
            </Text>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            {props.clinicLogoUrl ? (
              <Image src={props.clinicLogoUrl} style={styles.clinicLogo} />
            ) : null}
            <Text style={[styles.docEmail, { textAlign: "right" }]}>{props.clinicPhone}</Text>
          </View>
        </View>

        {/* PATIENT DEMOGRAPHIC BOX */}
        <View style={styles.patientContainer}>
          <View style={styles.patientRow}>
            <Text style={styles.patientName}>{props.patientName}</Text>
            <Text style={styles.patientMeta}>
              UHID: <Text style={{ fontFamily: "Helvetica-Bold" }}>{props.patientUhid}</Text>
            </Text>
          </View>
          <View style={styles.patientRow}>
            <Text style={styles.patientMeta}>
              {props.patientGender || "—"}, {props.patientAge || ""}
              {props.patientDob ? ` (DOB: ${props.patientDob})` : ""}
            </Text>
            <Text style={styles.patientMeta}>
              Visit ID: {props.opNumber || "OP-" + props.patientUhid.slice(-6)}
            </Text>
          </View>
          <View style={styles.patientRow}>
            <Text style={styles.patientMeta}>
              Address: {props.patientAddress || "—"} · Phone: {props.patientPhone}
            </Text>
            <Text style={styles.patientMeta}>
              Visit Date: <Text style={{ fontFamily: "Helvetica-Bold" }}>{props.visitDate}</Text>
            </Text>
          </View>
          <View style={styles.allergyRow}>
            {hasAllergies ? (
              <Text style={styles.allergyText}>
                ⚠️ Known Drug Allergies: {props.patientAllergies}
              </Text>
            ) : (
              <Text style={styles.allergySafe}>Allergy: No Known Drug Allergies</Text>
            )}
          </View>
        </View>

        {/* 1. CHIEF COMPLAINTS */}
        {complaintLines.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chief Complaints & Symptoms</Text>
            {complaintLines.map((line, idx) => (
              <View key={idx} style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{line}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 2. HISTORY OF PRESENT ILLNESS */}
        {props.historyOfPresentIllness && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>History of Present Illness</Text>
            <Text style={styles.sectionContent}>{props.historyOfPresentIllness}</Text>
          </View>
        )}

        {/* 3. CURRENT MEDICATION */}
        {props.currentMedications && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Medication</Text>
            <Text style={styles.sectionContent}>{props.currentMedications}</Text>
          </View>
        )}

        {/* 4. PHYSICAL & JOINT EXAMINATION */}
        {examLines.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Physical & Clinical Examination</Text>
            {examLines.map((line, idx) => (
              <View key={idx} style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{line}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 5. DIAGNOSIS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clinical Diagnosis</Text>
          <Text style={[styles.sectionContent, { fontFamily: "Helvetica-Bold", fontSize: 9 }]}>
            {props.diagnosis || "Clinical evaluation recorded"}
            {props.diagnosisType ? ` (${props.diagnosisType})` : " (Provisional)"}
          </Text>
        </View>

        {/* 6. INVESTIGATION RESULTS (X-RAY / MRI) */}
        {props.investigationResults && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Investigation & Imaging Results (X-Ray / MRI)</Text>
            <Text style={styles.sectionContent}>{props.investigationResults}</Text>
          </View>
        )}

        {/* 7. LABS */}
        {props.labs && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Laboratory Investigations</Text>
            <Text style={styles.sectionContent}>{props.labs}</Text>
          </View>
        )}

        {/* 8. MEDICINES SCHEDULE TABLE */}
        {props.medicines && props.medicines.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Outpatient Prescription & Medicines</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colMed]}>Medicines</Text>
                <Text style={[styles.tableHeaderCell, styles.colDose]}>Morning</Text>
                <Text style={[styles.tableHeaderCell, styles.colDose]}>Afternoon</Text>
                <Text style={[styles.tableHeaderCell, styles.colDose]}>Evening</Text>
                <Text style={[styles.tableHeaderCell, styles.colDose]}>Night</Text>
              </View>

              {props.medicines.map((med, idx) => {
                const freq = (med.frequency || "").toLowerCase();
                const isMorning = freq.includes("1-0-") || freq.includes("1-1-") || freq.includes("morning") || freq.includes("once daily");
                const isAfternoon = freq.includes("-1-") || freq.includes("afternoon") || freq.includes("thrice");
                const isEvening = freq.includes("evening");
                const isNight = freq.includes("-0-1") || freq.includes("-1-1") || freq.includes("night") || freq.includes("bedtime");
                const isSos = freq.includes("sos") || freq.includes("as needed");
                const genericSalt =
                  med.genericName?.trim() || getGenericCompositionForDrug(med.name);

                return (
                  <View key={idx} style={styles.tableRow} wrap={false}>
                    <View style={styles.colMed}>
                      <Text style={styles.medName}>
                        {idx + 1}. {med.name}
                      </Text>
                      {genericSalt &&
                      genericSalt.toLowerCase() !== med.name.toLowerCase() ? (
                        <Text style={styles.medGeneric}>
                          {genericSalt}
                        </Text>
                      ) : null}
                      <Text style={styles.medSub}>
                        {med.dosage || "1 tab"} · {med.route || "Oral"} · {med.duration || "5 days"}
                        {med.instructions ? ` · ${med.instructions}` : ""}
                      </Text>
                    </View>
                    <Text style={[styles.colDose, styles.timingPill]}>
                      {isSos ? "SOS" : isMorning ? "1" : "—"}
                    </Text>
                    <Text style={[styles.colDose, styles.timingPill]}>
                      {isSos ? "—" : isAfternoon ? "1" : "—"}
                    </Text>
                    <Text style={[styles.colDose, styles.timingPill]}>
                      {isSos ? "—" : isEvening ? "1" : "—"}
                    </Text>
                    <Text style={[styles.colDose, styles.timingPill]}>
                      {isSos ? "—" : isNight ? "1" : "—"}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* 9. ADVICE & PRECAUTIONS */}
        {adviceLines.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Doctor&apos;s Advice & Precautions</Text>
            {adviceLines.map((line, idx) => (
              <View key={idx} style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{line}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 10. FOLLOW-UP */}
        {props.followUp && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Follow-Up Review</Text>
            <Text style={[styles.sectionContent, { fontFamily: "Helvetica-Bold" }]}>
              {props.followUp}
            </Text>
          </View>
        )}

        {/* FOOTER & SIGNATURE */}
        <View style={styles.footerContainer} wrap={false}>
          <View>
            <Text style={styles.footerMeta}>
              Printed Date & Time: {props.date}
            </Text>
            <Text style={styles.footerMeta}>
              Document: Outpatient Clinical Summary & Prescription
            </Text>
            <Text style={styles.footerMeta}>
              {props.clinicAddress} · Phone: {props.clinicPhone}
            </Text>
          </View>

          <View style={styles.signatoryBlock}>
            <Text style={styles.signatoryName}>
              {props.doctorName.startsWith("Dr.") ? props.doctorName : `Dr. ${props.doctorName}`}
            </Text>
            {props.doctorSpecialty && (
              <Text style={styles.signatorySub}>{props.doctorSpecialty}</Text>
            )}
            {props.doctorRegistrationNo && (
              <Text style={styles.signatorySub}>Reg No: {props.doctorRegistrationNo}</Text>
            )}
            <Text style={[styles.signatorySub, { marginTop: 4, fontFamily: "Helvetica-Bold" }]}>
              Authorized Signatory
            </Text>
          </View>
        </View>

        {/* Page numbering */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}

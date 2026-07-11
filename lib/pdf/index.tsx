import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  PrescriptionDocument,
  type PrescriptionPdfProps,
} from "@/lib/pdf/prescription";
import {
  MedicalCertificateDocument,
  type MedicalCertificatePdfProps,
} from "@/lib/pdf/medical-certificate";
import { ReceiptDocument } from "@/lib/pdf/receipt";
import type { LineItem } from "@/lib/types";

export async function renderPrescriptionPdf(
  props: PrescriptionPdfProps
): Promise<Uint8Array> {
  const buffer = await renderToBuffer(<PrescriptionDocument {...props} />);
  return new Uint8Array(buffer);
}

export async function renderMedicalCertificatePdf(
  props: MedicalCertificatePdfProps
): Promise<Uint8Array> {
  const buffer = await renderToBuffer(<MedicalCertificateDocument {...props} />);
  return new Uint8Array(buffer);
}

export async function renderReceiptPdf(props: {
  clinicName: string;
  clinicPhone: string;
  clinicAddress: string;
  clinicGstin?: string;
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
}): Promise<Uint8Array> {
  const buffer = await renderToBuffer(<ReceiptDocument {...props} />);
  return new Uint8Array(buffer);
}

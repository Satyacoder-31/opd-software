"use server";

import { revalidatePath } from "next/cache";
import { AppointmentStatus, InvoiceStatus, PaymentMode } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { permissionDenied, requireSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { renderReceiptPdf } from "@/lib/pdf";
import { validateBillingInput, validateReason } from "@/lib/validation";
import { parseLocalDateInput, clinicTodayDate } from "@/lib/date-utils";
import {
  matchesBillingHubSearch,
  matchesBillingHubStatus,
  type BillingHubStatusFilter,
} from "@/lib/billing-hub";
import { can } from "@/lib/rbac";
import type { ActionResult, LineItem, VoidActionResult } from "@/lib/types";

const lineItemSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive().finite(),
});

const invoiceInputSchema = z.object({
  lineItems: z.array(lineItemSchema).nullable(),
  amount: z.number().positive().finite().optional(),
  taxRate: z.number().min(0).max(100).finite().nullable().optional(),
});

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export type BillingHubRow = {
  kind: "invoice" | "unbilled";
  consultationId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  doctorName: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
  invoiceStatus: InvoiceStatus | null;
  amount: number | null;
  paymentMode: PaymentMode | null;
  queueDate: string;
};

export type ListBillingHubInput = {
  date?: string;
  status?: BillingHubStatusFilter;
  q?: string;
};

export async function listBillingHub(
  input: ListBillingHubInput = {}
): Promise<{ date: string; rows: BillingHubRow[] } | null> {
  const session = await requireSessionUser();
  if (!can(session, "billing.read")) return null;

  const queueDate =
    (input.date?.trim()
      ? parseLocalDateInput(input.date.trim())
      : null) ?? clinicTodayDate();
  const dateKey = formatDateKey(queueDate);
  const statusFilter: BillingHubStatusFilter = input.status ?? "all";
  const query = input.q ?? "";

  const appointments = await prisma.appointment.findMany({
    where: {
      clinicId: session.clinicId,
      queueDate,
      status: AppointmentStatus.done,
    },
    orderBy: { updatedAt: "desc" },
    include: {
      patient: { select: { id: true, name: true, mrn: true } },
      consultation: {
        include: {
          doctor: { select: { name: true } },
          invoice: true,
        },
      },
    },
  });

  const rows: BillingHubRow[] = [];

  for (const appointment of appointments) {
    const consultation = appointment.consultation;
    if (!consultation) continue;

    const invoice = consultation.invoice;
    const base = {
      consultationId: consultation.id,
      appointmentId: appointment.id,
      patientId: appointment.patient.id,
      patientName: appointment.patient.name,
      patientMrn: appointment.patient.mrn,
      doctorName: consultation.doctor?.name ?? null,
      queueDate: dateKey,
    };

    if (!invoice) {
      const row: BillingHubRow = {
        ...base,
        kind: "unbilled",
        invoiceId: null,
        invoiceNumber: null,
        invoiceStatus: null,
        amount: null,
        paymentMode: null,
      };
      if (
        matchesBillingHubStatus(row.kind, null, statusFilter) &&
        matchesBillingHubSearch(row, query)
      ) {
        rows.push(row);
      }
      continue;
    }

    const row: BillingHubRow = {
      ...base,
      kind: "invoice",
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceStatus: invoice.status,
      amount: Number(invoice.amount),
      paymentMode: invoice.paymentMode,
    };

    if (
      matchesBillingHubStatus(row.kind, row.invoiceStatus, statusFilter) &&
      matchesBillingHubSearch(row, query)
    ) {
      rows.push(row);
    }
  }

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "read",
    resourceType: "invoice",
    metadata: {
      hub: "billing",
      date: dateKey,
      status: statusFilter,
      resultCount: rows.length,
    },
  });

  return { date: dateKey, rows };
}

export async function getBillingContext(consultationId: string) {
  const session = await requireSessionUser();
  if (!can(session, "billing.read")) return null;

  const consultation = await prisma.consultation.findFirst({
    where: { id: consultationId, clinicId: session.clinicId },
    include: {
      patient: { select: { id: true, name: true, mrn: true } },
      invoice: true,
    },
  });

  if (!consultation) return null;

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "read",
    resourceType: consultation.invoice ? "invoice" : "consultation",
    resourceId: consultation.invoice?.id ?? consultation.id,
  });

  return consultation;
}

export async function createOrUpdateInvoice(
  consultationId: string,
  data: {
    lineItems: LineItem[] | null;
    amount: number;
    taxRate?: number | null;
  }
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSessionUser();
  if (!can(session, "billing.write")) return permissionDenied();

  const parsed = invoiceInputSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid billing details." };
  }

  const consultation = await prisma.consultation.findFirst({
    where: { id: consultationId, clinicId: session.clinicId },
    include: { invoice: true },
  });

  if (!consultation) {
    return { success: false, error: "Consultation not found." };
  }

  if (consultation.invoice?.status === InvoiceStatus.paid) {
    return {
      success: false,
      error: "Paid invoices cannot be edited. Void the invoice first to create a correction.",
    };
  }

  const mode = parsed.data.lineItems && parsed.data.lineItems.length > 0
    ? "itemized"
    : "flat";

  const lineItems = parsed.data.lineItems;
  const taxableAmount =
    mode === "itemized" && lineItems
      ? Math.round(lineItems.reduce((sum, item) => sum + item.amount, 0) * 100) /
        100
      : parsed.data.amount;

  if (taxableAmount == null || !Number.isFinite(taxableAmount)) {
    return { success: false, error: "Enter a valid amount." };
  }

  const billingCheck = validateBillingInput({
    mode,
    total: taxableAmount,
    lineItems: lineItems ?? [],
  });
  if (!billingCheck.ok) {
    return { success: false, error: billingCheck.error };
  }

  const taxRate =
    parsed.data.taxRate != null &&
    Number.isFinite(parsed.data.taxRate) &&
    parsed.data.taxRate > 0
      ? parsed.data.taxRate
      : 0;
  const taxAmount = Math.round(taxableAmount * taxRate) / 100;
  const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

  const resettingVoid = consultation.invoice?.status === InvoiceStatus.void;

  const invoice = await prisma.invoice.upsert({
    where: { consultationId },
    create: {
      clinicId: session.clinicId,
      consultationId,
      lineItems: lineItems ?? undefined,
      amount: new Decimal(totalAmount),
      taxableAmount: new Decimal(taxableAmount),
      taxRate: taxRate > 0 ? new Decimal(taxRate) : null,
      taxAmount: taxRate > 0 ? new Decimal(taxAmount) : null,
      createdById: session.userId,
    },
    update: {
      lineItems: lineItems ?? undefined,
      amount: new Decimal(totalAmount),
      taxableAmount: new Decimal(taxableAmount),
      taxRate: taxRate > 0 ? new Decimal(taxRate) : null,
      taxAmount: taxRate > 0 ? new Decimal(taxAmount) : null,
      status: InvoiceStatus.draft,
      paymentMode: resettingVoid ? null : undefined,
      voidReason: resettingVoid ? null : undefined,
      voidedAt: resettingVoid ? null : undefined,
      voidedById: resettingVoid ? null : undefined,
      updatedById: session.userId,
    },
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "invoice",
    resourceId: invoice.id,
    metadata: resettingVoid ? { reopenedFromVoid: true } : undefined,
  });

  revalidatePath(`/billing/${consultationId}`);
  revalidatePath("/billing");
  revalidatePath("/reports");
  revalidatePath("/reports/daily");
  return { success: true, data: { id: invoice.id } };
}

export async function markInvoicePaid(
  consultationId: string,
  paymentMode: PaymentMode
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "billing.write")) return permissionDenied();

  if (!Object.values(PaymentMode).includes(paymentMode)) {
    return { success: false, error: "Select a valid payment mode." };
  }

  const invoice = await prisma.invoice.findFirst({
    where: { consultationId, clinicId: session.clinicId },
  });

  if (!invoice) {
    return { success: false, error: "Invoice not found." };
  }

  if (invoice.status === InvoiceStatus.void) {
    return {
      success: false,
      error: "Voided invoices cannot be marked paid. Save a corrected draft first.",
    };
  }

  if (invoice.status === InvoiceStatus.paid) {
    return { success: false, error: "Invoice is already paid." };
  }

  const year = new Date().getFullYear();
  const assigned = await prisma.$transaction(async (tx) => {
    const paid = await tx.invoice.updateMany({
      where: {
        id: invoice.id,
        clinicId: session.clinicId,
        status: InvoiceStatus.draft,
      },
      data: {
        status: InvoiceStatus.paid,
        paymentMode,
        updatedById: session.userId,
      },
    });

    if (paid.count === 0) {
      return null;
    }

    if (invoice.invoiceNumber) {
      return invoice.invoiceNumber;
    }

    const clinic = await tx.clinic.update({
      where: { id: session.clinicId },
      data: { nextInvoiceSeq: { increment: 1 } },
      select: { nextInvoiceSeq: true },
    });
    const seq = clinic.nextInvoiceSeq - 1;
    const invoiceNumber = `INV-${year}-${String(seq).padStart(4, "0")}`;

    await tx.invoice.update({
      where: { id: invoice.id },
      data: { invoiceNumber },
    });

    return invoiceNumber;
  });

  if (!assigned) {
    return {
      success: false,
      error: "Invoice was already paid or changed. Refresh and try again.",
    };
  }

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "invoice",
    resourceId: invoice.id,
    metadata: { status: "paid", paymentMode, invoiceNumber: assigned },
  });

  revalidatePath(`/billing/${consultationId}`);
  revalidatePath("/billing");
  revalidatePath("/reports");
  revalidatePath("/reports/daily");
  return { success: true };
}

export async function voidInvoice(
  consultationId: string,
  reason: string
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "billing.write")) return permissionDenied();

  const reasonCheck = validateReason(reason, "Void reason");
  if (!reasonCheck.ok) {
    return { success: false, error: reasonCheck.error };
  }

  const invoice = await prisma.invoice.findFirst({
    where: { consultationId, clinicId: session.clinicId },
  });

  if (!invoice) {
    return { success: false, error: "Invoice not found." };
  }

  if (invoice.status === InvoiceStatus.void) {
    return { success: false, error: "Invoice is already voided." };
  }

  const voided = await prisma.invoice.updateMany({
    where: {
      id: invoice.id,
      clinicId: session.clinicId,
      status: { not: InvoiceStatus.void },
    },
    data: {
      status: InvoiceStatus.void,
      voidReason: reasonCheck.reason,
      voidedAt: new Date(),
      voidedById: session.userId,
      updatedById: session.userId,
    },
  });

  if (voided.count === 0) {
    return { success: false, error: "Invoice is already voided." };
  }

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "invoice",
    resourceId: invoice.id,
    metadata: {
      status: "void",
      reason: reasonCheck.reason,
      previousStatus: invoice.status,
    },
  });

  revalidatePath(`/billing/${consultationId}`);
  revalidatePath("/billing");
  revalidatePath("/reports");
  revalidatePath("/reports/daily");
  return { success: true };
}

export async function generateReceiptPdf(
  consultationId: string
): Promise<ActionResult<{ pdfBase64: string; filename: string }>> {
  const session = await requireSessionUser();
  if (!can(session, "billing.write")) return permissionDenied();

  const invoice = await prisma.invoice.findFirst({
    where: { consultationId, clinicId: session.clinicId },
    include: {
      consultation: { include: { patient: true } },
    },
  });

  if (!invoice || invoice.status !== InvoiceStatus.paid) {
    return { success: false, error: "Paid invoice not found." };
  }

  const clinic = await prisma.clinic.findUniqueOrThrow({
    where: { id: session.clinicId },
  });

  const lineItems = Array.isArray(invoice.lineItems)
    ? (invoice.lineItems as LineItem[])
    : null;
  const amount = Number(invoice.amount);
  const taxableAmount =
    invoice.taxableAmount != null ? Number(invoice.taxableAmount) : amount;
  const taxRate = invoice.taxRate != null ? Number(invoice.taxRate) : 0;
  const taxAmount = invoice.taxAmount != null ? Number(invoice.taxAmount) : 0;

  const pdfBytes = await renderReceiptPdf({
    clinicName: clinic.name,
    clinicPhone: clinic.phone,
    clinicAddress: clinic.address,
    clinicGstin: clinic.gstin ?? undefined,
    patientName: invoice.consultation.patient.name,
    lineItems,
    amount,
    taxableAmount,
    taxRate,
    taxAmount,
    paymentMode: invoice.paymentMode ?? "cash",
    date: new Date().toLocaleDateString("en-IN"),
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber ?? invoice.id.slice(0, 8).toUpperCase(),
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "export",
    resourceType: "invoice",
    resourceId: invoice.id,
  });

  const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
  const filename = `receipt-${(invoice.invoiceNumber ?? invoice.id).slice(0, 12)}.pdf`;

  return { success: true, data: { pdfBase64, filename } };
}

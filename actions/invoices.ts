"use server";

import { revalidatePath } from "next/cache";
import { InvoiceStatus, PaymentMode, Role } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { permissionDenied, requireSessionUser, roleAllowed } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { renderReceiptPdf } from "@/lib/pdf";
import { validateReason } from "@/lib/validation";
import type { ActionResult, LineItem, VoidActionResult } from "@/lib/types";

const BILLING_ROLES: Role[] = [Role.admin, Role.receptionist];

const lineItemSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
});

export async function getBillingContext(consultationId: string) {
  const session = await requireSessionUser();
  if (!roleAllowed(session, BILLING_ROLES)) return null;

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

/** @deprecated Use getBillingContext */
export async function getInvoiceByConsultation(consultationId: string) {
  const context = await getBillingContext(consultationId);
  if (!context?.invoice) return null;
  return { ...context.invoice, consultation: context };
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
  if (!roleAllowed(session, BILLING_ROLES)) return permissionDenied();

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

  if (data.lineItems) {
    const validated = z.array(lineItemSchema).safeParse(data.lineItems);
    if (!validated.success) {
      return { success: false, error: "Invalid line items." };
    }
  }

  const taxRate =
    data.taxRate != null && Number.isFinite(data.taxRate) && data.taxRate > 0
      ? data.taxRate
      : 0;
  const taxableAmount = data.amount;
  const taxAmount = Math.round(taxableAmount * taxRate) / 100;
  const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

  const resettingVoid = consultation.invoice?.status === InvoiceStatus.void;

  const invoice = await prisma.invoice.upsert({
    where: { consultationId },
    create: {
      clinicId: session.clinicId,
      consultationId,
      lineItems: data.lineItems ?? undefined,
      amount: new Decimal(totalAmount),
      taxableAmount: new Decimal(taxableAmount),
      taxRate: taxRate > 0 ? new Decimal(taxRate) : null,
      taxAmount: taxRate > 0 ? new Decimal(taxAmount) : null,
      createdById: session.userId,
    },
    update: {
      lineItems: data.lineItems ?? undefined,
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
  return { success: true, data: { id: invoice.id } };
}

export async function markInvoicePaid(
  consultationId: string,
  paymentMode: PaymentMode
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!roleAllowed(session, BILLING_ROLES)) return permissionDenied();

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
    const clinic = await tx.clinic.update({
      where: { id: session.clinicId },
      data: { nextInvoiceSeq: { increment: 1 } },
      select: { nextInvoiceSeq: true },
    });
    const seq = clinic.nextInvoiceSeq - 1;
    const invoiceNumber =
      invoice.invoiceNumber ?? `INV-${year}-${String(seq).padStart(4, "0")}`;

    await tx.invoice.updateMany({
      where: { id: invoice.id, clinicId: session.clinicId },
      data: {
        status: InvoiceStatus.paid,
        paymentMode,
        invoiceNumber,
        updatedById: session.userId,
      },
    });

    return invoiceNumber;
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "invoice",
    resourceId: invoice.id,
    metadata: { status: "paid", paymentMode, invoiceNumber: assigned },
  });

  revalidatePath(`/billing/${consultationId}`);
  return { success: true };
}

export async function voidInvoice(
  consultationId: string,
  reason: string
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!roleAllowed(session, BILLING_ROLES)) return permissionDenied();

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

  await prisma.invoice.updateMany({
    where: { id: invoice.id, clinicId: session.clinicId },
    data: {
      status: InvoiceStatus.void,
      voidReason: reasonCheck.reason,
      voidedAt: new Date(),
      voidedById: session.userId,
      updatedById: session.userId,
    },
  });

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
  return { success: true };
}

export async function generateReceiptPdf(
  consultationId: string
): Promise<ActionResult<{ pdfBase64: string; filename: string }>> {
  const session = await requireSessionUser();
  if (!roleAllowed(session, BILLING_ROLES)) return permissionDenied();

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

  const lineItems = invoice.lineItems as LineItem[] | null;
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

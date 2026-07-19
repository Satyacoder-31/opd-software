"use server";

import { InvoiceStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { permissionDenied, requireSessionUser, roleAllowed } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { parseLocalDateInput } from "@/lib/date-utils";
import type { ActionResult } from "@/lib/types";

const VISIT_BILLING_EXPORT_ROLES: Role[] = [Role.admin, Role.receptionist];
const PATIENT_EXPORT_ROLES: Role[] = [Role.admin];
const MAX_EXPORT_ROWS = 5_000;
const MAX_EXPORT_RANGE_DAYS = 90;

function csvEscape(value: string | number | null | undefined): string {
  const raw = value == null ? "" : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function toCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>): string {
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ];
  return `${lines.join("\n")}\n`;
}

function parseRange(from?: string, to?: string): { from: Date; to: Date } | null {
  const fromDate = from ? parseLocalDateInput(from) : null;
  const toDate = to ? parseLocalDateInput(to) : null;
  if (!fromDate || !toDate) return null;
  const end = new Date(toDate);
  end.setHours(23, 59, 59, 999);
  if (end < fromDate) return null;

  const rangeMs = end.getTime() - fromDate.getTime();
  const maxMs = MAX_EXPORT_RANGE_DAYS * 24 * 60 * 60 * 1000;
  if (rangeMs > maxMs) return null;

  return { from: fromDate, to: end };
}

export async function exportPatientsCsv(): Promise<
  ActionResult<{ csv: string; filename: string }>
> {
  const session = await requireSessionUser();
  if (!roleAllowed(session, PATIENT_EXPORT_ROLES)) return permissionDenied();

  const patients = await prisma.patient.findMany({
    where: { clinicId: session.clinicId },
    orderBy: { createdAt: "desc" },
    take: MAX_EXPORT_ROWS,
  });

  const csv = toCsv(
    ["MRN", "Name", "Phone", "Age", "DOB", "Gender", "Allergies", "Chronic conditions", "Registered"],
    patients.map((p) => [
      p.mrn,
      p.name,
      p.phone,
      p.age,
      p.dateOfBirth ? p.dateOfBirth.toISOString().slice(0, 10) : "",
      p.gender,
      p.allergies,
      p.chronicConditions,
      p.createdAt.toISOString(),
    ])
  );

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "export",
    resourceType: "patient",
    metadata: { count: patients.length, capped: patients.length >= MAX_EXPORT_ROWS },
  });

  return {
    success: true,
    data: { csv, filename: `patients-${new Date().toISOString().slice(0, 10)}.csv` },
  };
}

export async function exportVisitsCsv(
  from: string,
  to: string
): Promise<ActionResult<{ csv: string; filename: string }>> {
  const session = await requireSessionUser();
  if (!roleAllowed(session, VISIT_BILLING_EXPORT_ROLES)) return permissionDenied();

  const range = parseRange(from, to);
  if (!range) {
    return {
      success: false,
      error: `Enter a valid from/to date range of at most ${MAX_EXPORT_RANGE_DAYS} days.`,
    };
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      clinicId: session.clinicId,
      queueDate: { gte: range.from, lte: range.to },
    },
    include: {
      patient: { select: { name: true, mrn: true } },
      consultation: {
        include: { doctor: { select: { name: true } } },
      },
    },
    orderBy: [{ queueDate: "asc" }, { tokenNumber: "asc" }],
    take: MAX_EXPORT_ROWS,
  });

  const csv = toCsv(
    ["Date", "Token", "Type", "Status", "Patient", "MRN", "Doctor", "Scheduled at"],
    appointments.map((a) => [
      a.queueDate.toISOString().slice(0, 10),
      a.tokenNumber,
      a.type,
      a.status,
      a.patient.name,
      a.patient.mrn,
      a.consultation?.doctor.name ?? "",
      a.scheduledAt?.toISOString() ?? "",
    ])
  );

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "export",
    resourceType: "appointment",
    metadata: { from, to, count: appointments.length },
  });

  return {
    success: true,
    data: { csv, filename: `visits-${from}-to-${to}.csv` },
  };
}

export async function exportBillingCsv(
  from: string,
  to: string
): Promise<ActionResult<{ csv: string; filename: string }>> {
  const session = await requireSessionUser();
  if (!roleAllowed(session, VISIT_BILLING_EXPORT_ROLES)) return permissionDenied();

  const range = parseRange(from, to);
  if (!range) {
    return {
      success: false,
      error: `Enter a valid from/to date range of at most ${MAX_EXPORT_RANGE_DAYS} days.`,
    };
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      clinicId: session.clinicId,
      createdAt: { gte: range.from, lte: range.to },
    },
    include: {
      consultation: {
        include: {
          patient: { select: { name: true, mrn: true } },
          doctor: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: MAX_EXPORT_ROWS,
  });

  const csv = toCsv(
    [
      "Created",
      "Invoice #",
      "Status",
      "Patient",
      "MRN",
      "Doctor",
      "Taxable",
      "Tax rate",
      "Tax",
      "Amount",
      "Payment mode",
    ],
    invoices.map((inv) => [
      inv.createdAt.toISOString(),
      inv.invoiceNumber,
      inv.status,
      inv.consultation.patient.name,
      inv.consultation.patient.mrn,
      inv.consultation.doctor.name,
      inv.taxableAmount != null ? Number(inv.taxableAmount) : "",
      inv.taxRate != null ? Number(inv.taxRate) : "",
      inv.taxAmount != null ? Number(inv.taxAmount) : "",
      Number(inv.amount),
      inv.status === InvoiceStatus.paid ? inv.paymentMode : "",
    ])
  );

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "export",
    resourceType: "invoice",
    metadata: { from, to, count: invoices.length },
  });

  return {
    success: true,
    data: { csv, filename: `billing-${from}-to-${to}.csv` },
  };
}

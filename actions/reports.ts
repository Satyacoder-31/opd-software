"use server";

import { AppointmentStatus, InvoiceStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { clinicTodayDate, parseLocalDateInput } from "@/lib/date-utils";
import { can } from "@/lib/rbac";

function csvEscape(value: string | number | null | undefined): string {
  const raw = value == null ? "" : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function parseReportDate(dateStr?: string): Date | null {
  const raw = dateStr?.trim();
  if (!raw) return clinicTodayDate();

  const parsed = parseLocalDateInput(raw);
  return parsed;
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export type DailyReportBillingRow = {
  consultationId: string;
  patientName: string;
  patientMrn: string;
  doctorName: string | null;
  status: "paid" | "draft" | "void" | "unbilled";
  amount: number | null;
  paymentMode: string | null;
  invoiceNumber: string | null;
};

export type DailyReport = {
  date: string;
  visits: {
    total: number;
    waiting: number;
    inProgress: number;
    done: number;
    cancelled: number;
    noShow: number;
  };
  collections: {
    totalPaid: number;
    paidCount: number;
    draftCount: number;
    draftAmount: number;
    voidCount: number;
    unbilledCount: number;
    byPaymentMode: Array<{ mode: string; amount: number; count: number }>;
  };
  byDoctor: Array<{
    doctorId: string;
    doctorName: string;
    visitCount: number;
    paidAmount: number;
  }>;
  billingRows: DailyReportBillingRow[];
};

export async function getDailyReport(dateStr?: string): Promise<DailyReport | null> {
  const session = await requireSessionUser();
  if (!can(session, "reports.read")) return null;

  const queueDate = parseReportDate(dateStr);
  if (!queueDate) return null;

  const dateKey = formatDateKey(queueDate);

  const appointments = await prisma.appointment.findMany({
    where: { clinicId: session.clinicId, queueDate },
    include: {
      patient: { select: { name: true, mrn: true } },
      consultation: {
        include: {
          doctor: { select: { id: true, name: true } },
          invoice: true,
        },
      },
    },
  });

  const visits = {
    total: appointments.length,
    waiting: 0,
    inProgress: 0,
    done: 0,
    cancelled: 0,
    noShow: 0,
  };

  const paymentTotals = new Map<string, { amount: number; count: number }>();
  let totalPaid = 0;
  let paidCount = 0;
  let draftCount = 0;
  let draftAmount = 0;
  let voidCount = 0;
  let unbilledCount = 0;
  const billingRows: DailyReportBillingRow[] = [];

  const doctorMap = new Map<
    string,
    { doctorName: string; visitCount: number; paidAmount: number }
  >();

  for (const appointment of appointments) {
    if (appointment.status === AppointmentStatus.waiting) visits.waiting += 1;
    if (appointment.status === AppointmentStatus.in_progress) {
      visits.inProgress += 1;
    }
    if (appointment.status === AppointmentStatus.done) visits.done += 1;
    if (appointment.status === AppointmentStatus.cancelled) {
      visits.cancelled += 1;
    }
    if (appointment.status === AppointmentStatus.no_show) visits.noShow += 1;

    const consultation = appointment.consultation;
    if (!consultation) continue;

    const doctorEntry = doctorMap.get(consultation.doctorId) ?? {
      doctorName: consultation.doctor.name,
      visitCount: 0,
      paidAmount: 0,
    };
    doctorEntry.visitCount += 1;

    const invoice = consultation.invoice;
    if (appointment.status === AppointmentStatus.done && !invoice) {
      unbilledCount += 1;
      billingRows.push({
        consultationId: consultation.id,
        patientName: appointment.patient.name,
        patientMrn: appointment.patient.mrn,
        doctorName: consultation.doctor.name,
        status: "unbilled",
        amount: null,
        paymentMode: null,
        invoiceNumber: null,
      });
    } else if (invoice) {
      if (invoice.status === InvoiceStatus.paid) {
        const amount = Number(invoice.amount);
        totalPaid += amount;
        paidCount += 1;
        doctorEntry.paidAmount += amount;

        const mode = invoice.paymentMode ?? "other";
        const modeEntry = paymentTotals.get(mode) ?? { amount: 0, count: 0 };
        modeEntry.amount += amount;
        modeEntry.count += 1;
        paymentTotals.set(mode, modeEntry);

        billingRows.push({
          consultationId: consultation.id,
          patientName: appointment.patient.name,
          patientMrn: appointment.patient.mrn,
          doctorName: consultation.doctor.name,
          status: "paid",
          amount,
          paymentMode: mode,
          invoiceNumber: invoice.invoiceNumber,
        });
      } else if (invoice.status === InvoiceStatus.draft) {
        draftCount += 1;
        draftAmount += Number(invoice.amount);
        billingRows.push({
          consultationId: consultation.id,
          patientName: appointment.patient.name,
          patientMrn: appointment.patient.mrn,
          doctorName: consultation.doctor.name,
          status: "draft",
          amount: Number(invoice.amount),
          paymentMode: null,
          invoiceNumber: invoice.invoiceNumber,
        });
      } else if (invoice.status === InvoiceStatus.void) {
        voidCount += 1;
        billingRows.push({
          consultationId: consultation.id,
          patientName: appointment.patient.name,
          patientMrn: appointment.patient.mrn,
          doctorName: consultation.doctor.name,
          status: "void",
          amount: Number(invoice.amount),
          paymentMode: invoice.paymentMode,
          invoiceNumber: invoice.invoiceNumber,
        });
      }
    }

    doctorMap.set(consultation.doctorId, doctorEntry);
  }

  billingRows.sort((a, b) => {
    const order = { unbilled: 0, draft: 1, void: 2, paid: 3 } as const;
    return order[a.status] - order[b.status];
  });

  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "read",
    resourceType: "clinic",
    resourceId: session.clinicId,
    metadata: { report: "daily", date: dateKey },
  });

  return {
    date: dateKey,
    visits,
    collections: {
      totalPaid,
      paidCount,
      draftCount,
      draftAmount,
      voidCount,
      unbilledCount,
      byPaymentMode: Array.from(paymentTotals.entries())
        .map(([mode, value]) => ({
          mode,
          amount: value.amount,
          count: value.count,
        }))
        .sort((a, b) => b.amount - a.amount),
    },
    byDoctor: Array.from(doctorMap.entries())
      .map(([doctorId, value]) => ({
        doctorId,
        doctorName: value.doctorName,
        visitCount: value.visitCount,
        paidAmount: value.paidAmount,
      }))
      .sort((a, b) => b.visitCount - a.visitCount),
    billingRows,
  };
}

export async function exportDailyReportCsv(
  dateStr?: string
): Promise<{ success: true; data: { csv: string; filename: string } } | { success: false; error: string }> {
  const report = await getDailyReport(dateStr);
  if (!report) {
    return { success: false, error: "You do not have access to reports." };
  }

  const lines = [
    "Dr Orthos Daily Report",
    `Date,${report.date}`,
    "",
    "Metric,Value",
    `Total visits,${report.visits.total}`,
    `Waiting,${report.visits.waiting}`,
    `In progress,${report.visits.inProgress}`,
    `Done,${report.visits.done}`,
    `Cancelled,${report.visits.cancelled}`,
    `No show,${report.visits.noShow}`,
    `Paid invoices,${report.collections.paidCount}`,
    `Collections (INR),${report.collections.totalPaid.toFixed(2)}`,
    `Draft invoices,${report.collections.draftCount}`,
    `Draft amount (INR),${report.collections.draftAmount.toFixed(2)}`,
    `Void invoices,${report.collections.voidCount}`,
    `Unbilled visits,${report.collections.unbilledCount}`,
    "",
    "Payment mode,Count,Amount (INR)",
    ...report.collections.byPaymentMode.map(
      (row) =>
        `${csvEscape(row.mode)},${row.count},${row.amount.toFixed(2)}`
    ),
    "",
    "Doctor,Visits,Paid amount (INR)",
    ...report.byDoctor.map(
      (row) =>
        `${csvEscape(row.doctorName)},${row.visitCount},${row.paidAmount.toFixed(2)}`
    ),
    "",
    "Patient,MRN,Doctor,Status,Invoice #,Amount (INR),Payment mode",
    ...report.billingRows.map(
      (row) =>
        [
          csvEscape(row.patientName),
          csvEscape(row.patientMrn),
          csvEscape(row.doctorName),
          row.status,
          csvEscape(row.invoiceNumber),
          row.amount != null ? row.amount.toFixed(2) : "",
          csvEscape(row.paymentMode),
        ].join(",")
    ),
  ];

  return {
    success: true,
    data: {
      csv: lines.join("\n"),
      filename: `daily-report-${report.date}.csv`,
    },
  };
}

export async function getClinicMisSummary(input?: {
  from?: string;
  to?: string;
}) {
  const session = await requireSessionUser();
  if (!can(session, "reports.read")) return null;
  const from = input?.from ? parseLocalDateInput(input.from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const toBase = input?.to ? parseLocalDateInput(input.to) : clinicTodayDate();
  if (!from || !toBase) return null;
  const to = new Date(toBase);
  to.setDate(to.getDate() + 1);
  const [appointments, paidInvoices, completedLabs] = await Promise.all([
    prisma.appointment.findMany({
      where: { clinicId: session.clinicId, queueDate: { gte: from, lt: to } },
      select: {
        status: true,
        consultation: {
          select: {
            doctorId: true,
            doctor: { select: { name: true } },
            invoice: { select: { amountPaid: true, status: true } },
          },
        },
      },
    }),
    prisma.invoice.findMany({
      where: {
        clinicId: session.clinicId,
        status: { in: [InvoiceStatus.paid, InvoiceStatus.partial] },
        updatedAt: { gte: from, lt: to },
      },
      select: { amountPaid: true, taxableAmount: true, taxAmount: true },
    }),
    prisma.labOrder.findMany({
      where: { clinicId: session.clinicId, status: "completed", updatedAt: { gte: from, lt: to } },
      select: { createdAt: true, updatedAt: true },
    }),
  ]);
  const doctorMap = new Map<string, { doctorName: string; visits: number; revenue: number }>();
  for (const appointment of appointments) {
    const consultation = appointment.consultation;
    if (!consultation) continue;
    const row = doctorMap.get(consultation.doctorId) ?? {
      doctorName: consultation.doctor.name,
      visits: 0,
      revenue: 0,
    };
    row.visits += 1;
    row.revenue += Number(consultation.invoice?.amountPaid ?? 0);
    doctorMap.set(consultation.doctorId, row);
  }
  const turnaroundHours = completedLabs.length
    ? completedLabs.reduce((sum, order) => sum + (order.updatedAt.getTime() - order.createdAt.getTime()) / 3_600_000, 0) / completedLabs.length
    : null;
  return {
    period: { from: formatDateKey(from), to: formatDateKey(toBase) },
    appointments: {
      total: appointments.length,
      completed: appointments.filter((a) => a.status === AppointmentStatus.done).length,
      cancelled: appointments.filter((a) => a.status === AppointmentStatus.cancelled).length,
      noShow: appointments.filter((a) => a.status === AppointmentStatus.no_show).length,
    },
    doctorRevenue: Array.from(doctorMap.entries()).map(([doctorId, value]) => ({ doctorId, ...value })).sort((a, b) => b.revenue - a.revenue),
    labTurnaroundHours: turnaroundHours,
    gst: {
      taxable: paidInvoices.reduce((sum, invoice) => sum + Number(invoice.taxableAmount ?? 0), 0),
      tax: paidInvoices.reduce((sum, invoice) => sum + Number(invoice.taxAmount ?? 0), 0),
      collected: paidInvoices.reduce((sum, invoice) => sum + Number(invoice.amountPaid), 0),
    },
  };
}

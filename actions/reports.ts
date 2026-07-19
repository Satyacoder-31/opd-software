"use server";

import { InvoiceStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSessionUser, roleAllowed } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { clinicTodayDate, parseLocalDateInput } from "@/lib/date-utils";

const REPORT_ROLES: Role[] = [Role.admin, Role.receptionist];

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

export type DailyReport = {
  date: string;
  visits: {
    total: number;
    waiting: number;
    inProgress: number;
    done: number;
  };
  collections: {
    totalPaid: number;
    paidCount: number;
    draftCount: number;
    voidCount: number;
    byPaymentMode: Array<{ mode: string; amount: number; count: number }>;
  };
  byDoctor: Array<{
    doctorId: string;
    doctorName: string;
    visitCount: number;
    paidAmount: number;
  }>;
};

export async function getDailyReport(dateStr?: string): Promise<DailyReport | null> {
  const session = await requireSessionUser();
  if (!roleAllowed(session, REPORT_ROLES)) return null;

  const queueDate = parseReportDate(dateStr);
  if (!queueDate) return null;

  const dateKey = formatDateKey(queueDate);

  const appointments = await prisma.appointment.findMany({
    where: { clinicId: session.clinicId, queueDate },
    include: {
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
  };

  const paymentTotals = new Map<string, { amount: number; count: number }>();
  let totalPaid = 0;
  let paidCount = 0;
  let draftCount = 0;
  let voidCount = 0;

  const doctorMap = new Map<
    string,
    { doctorName: string; visitCount: number; paidAmount: number }
  >();

  for (const appointment of appointments) {
    if (appointment.status === "waiting") visits.waiting += 1;
    if (appointment.status === "in_progress") visits.inProgress += 1;
    if (appointment.status === "done") visits.done += 1;

    const consultation = appointment.consultation;
    if (!consultation) continue;

    const doctorEntry = doctorMap.get(consultation.doctorId) ?? {
      doctorName: consultation.doctor.name,
      visitCount: 0,
      paidAmount: 0,
    };
    doctorEntry.visitCount += 1;

    const invoice = consultation.invoice;
    if (invoice) {
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
      } else if (invoice.status === InvoiceStatus.draft) {
        draftCount += 1;
      } else if (invoice.status === InvoiceStatus.void) {
        voidCount += 1;
      }
    }

    doctorMap.set(consultation.doctorId, doctorEntry);
  }

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
      voidCount,
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
    "Medyx Daily Report",
    `Date,${report.date}`,
    "",
    "Metric,Value",
    `Total visits,${report.visits.total}`,
    `Waiting,${report.visits.waiting}`,
    `In progress,${report.visits.inProgress}`,
    `Done,${report.visits.done}`,
    `Paid invoices,${report.collections.paidCount}`,
    `Collections (INR),${report.collections.totalPaid.toFixed(2)}`,
    `Draft invoices,${report.collections.draftCount}`,
    `Void invoices,${report.collections.voidCount}`,
    "",
    "Payment mode,Count,Amount (INR)",
    ...report.collections.byPaymentMode.map(
      (row) => `${row.mode},${row.count},${row.amount.toFixed(2)}`
    ),
    "",
    "Doctor,Visits,Paid amount (INR)",
    ...report.byDoctor.map(
      (row) =>
        `"${row.doctorName.replace(/"/g, '""')}",${row.visitCount},${row.paidAmount.toFixed(2)}`
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

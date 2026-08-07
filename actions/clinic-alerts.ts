"use server";

import {
  AppointmentStatus,
  InvoiceStatus,
  LabOrderStatus,
} from "@prisma/client";
import { requireSessionUser } from "@/lib/auth";
import type { ClinicAlert } from "@/lib/clinic-alerts";
import { clinicTodayDate } from "@/lib/date-utils";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";

/**
 * Aggregate operational signals for the staff notification bell.
 * Uses count queries only — no new tables, no audit spam on every layout render.
 */
export async function listClinicAlerts(): Promise<ClinicAlert[]> {
  const session = await requireSessionUser();
  const today = clinicTodayDate();
  const nowIso = new Date().toISOString();
  const alerts: ClinicAlert[] = [];

  const tasks: Promise<void>[] = [];

  if (can(session, "queue.read")) {
    tasks.push(
      (async () => {
        const waiting = await prisma.appointment.count({
          where: {
            clinicId: session.clinicId,
            queueDate: today,
            status: AppointmentStatus.waiting,
          },
        });
        if (waiting <= 0) return;
        alerts.push({
          id: "queue:waiting",
          title:
            waiting === 1
              ? "1 patient waiting"
              : `${waiting} patients waiting`,
          description: "Front desk queue for today",
          href: "/queue",
          createdAt: nowIso,
          tone: waiting >= 8 ? "warning" : "info",
        });
      })()
    );
  }

  if (can(session, "billing.read")) {
    tasks.push(
      (async () => {
        const [unbilled, openInvoices] = await Promise.all([
          prisma.appointment.count({
            where: {
              clinicId: session.clinicId,
              queueDate: today,
              status: AppointmentStatus.done,
              consultation: { is: { invoice: null } },
            },
          }),
          prisma.invoice.count({
            where: {
              clinicId: session.clinicId,
              status: {
                in: [InvoiceStatus.draft, InvoiceStatus.partial],
              },
              consultation: {
                appointment: {
                  queueDate: today,
                  status: AppointmentStatus.done,
                },
              },
            },
          }),
        ]);
        const total = unbilled + openInvoices;
        if (total <= 0) return;
        alerts.push({
          id: "billing:open",
          title:
            total === 1
              ? "1 visit needs billing"
              : `${total} visits need billing`,
          description:
            unbilled > 0 && openInvoices > 0
              ? `${unbilled} unbilled · ${openInvoices} unpaid`
              : unbilled > 0
                ? "Completed visits without an invoice"
                : "Draft or partially paid invoices",
          href: "/billing?status=unbilled",
          createdAt: nowIso,
          tone: "warning",
        });
      })()
    );
  }

  if (can(session, "labs.read")) {
    tasks.push(
      (async () => {
        const pending = await prisma.labOrder.count({
          where: {
            clinicId: session.clinicId,
            status: {
              in: [LabOrderStatus.ordered, LabOrderStatus.collected],
            },
          },
        });
        if (pending <= 0) return;
        alerts.push({
          id: "labs:pending",
          title:
            pending === 1
              ? "1 lab order in progress"
              : `${pending} lab orders in progress`,
          description: "Ordered or collected — awaiting results",
          href: "/labs",
          createdAt: nowIso,
          tone: "info",
        });
      })()
    );
  }

  if (can(session, "clinic.manage")) {
    tasks.push(
      (async () => {
        const clinic = await prisma.clinic.findUnique({
          where: { id: session.clinicId },
          select: {
            onboardingCompletedAt: true,
            onboardingSkippedAt: true,
          },
        });
        if (!clinic || clinic.onboardingCompletedAt) return;
        alerts.push({
          id: "onboarding:incomplete",
          title: clinic.onboardingSkippedAt
            ? "Finish clinic setup"
            : "Complete clinic setup",
          description: "A few setup steps still need your attention",
          href: "/onboarding",
          createdAt: nowIso,
          tone: "info",
        });
      })()
    );
  }

  if (can(session, "appointments.schedule")) {
    tasks.push(
      (async () => {
        const noShows = await prisma.appointment.count({
          where: {
            clinicId: session.clinicId,
            queueDate: today,
            status: AppointmentStatus.no_show,
          },
        });
        if (noShows <= 0) return;
        alerts.push({
          id: "appointments:no-show",
          title:
            noShows === 1
              ? "1 no-show today"
              : `${noShows} no-shows today`,
          description: "Scheduled visits marked as no-show",
          href: "/appointments",
          createdAt: nowIso,
          tone: "warning",
        });
      })()
    );
  }

  await Promise.all(tasks);

  const toneRank: Record<ClinicAlert["tone"], number> = {
    danger: 0,
    warning: 1,
    info: 2,
  };

  return alerts.sort((a, b) => {
    const byTone = toneRank[a.tone] - toneRank[b.tone];
    if (byTone !== 0) return byTone;
    return a.title.localeCompare(b.title);
  });
}

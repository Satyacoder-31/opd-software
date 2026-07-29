"use server";

import { NotificationChannel } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { permissionDenied, requireSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import {
  sendClinicNotification,
  type MessagingConfig,
} from "@/lib/integrations/messaging";
import { planAllows } from "@/lib/plan-features";
import { can } from "@/lib/rbac";
import type { ActionResult, VoidActionResult } from "@/lib/types";

const configSchema = z.object({
  smsEnabled: z.boolean(),
  whatsappEnabled: z.boolean(),
  senderId: z.string().trim().max(20).optional(),
  dryRun: z.boolean(),
  appointmentReminders: z.boolean().optional(),
});

async function messagingClinic(clinicId: string) {
  return prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { id: true, name: true, phone: true, plan: true, messagingConfig: true },
  });
}

export async function getMessagingConfig() {
  const session = await requireSessionUser();
  if (!can(session, "messaging.manage")) return null;
  const clinic = await messagingClinic(session.clinicId);
  if (!clinic || !planAllows(clinic.plan, "messaging")) return null;
  return {
    config: (clinic.messagingConfig ?? {}) as MessagingConfig,
    plan: clinic.plan,
  };
}

export async function updateMessagingConfig(
  input: z.infer<typeof configSchema>,
): Promise<VoidActionResult> {
  const session = await requireSessionUser();
  if (!can(session, "messaging.manage")) return permissionDenied();
  const clinic = await messagingClinic(session.clinicId);
  if (!clinic || !planAllows(clinic.plan, "messaging")) {
    return { success: false, error: "Your plan does not include messaging." };
  }
  const parsed = configSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid notification settings." };
  await prisma.clinic.update({
    where: { id: session.clinicId },
    data: { messagingConfig: parsed.data },
  });
  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "update",
    resourceType: "messaging_config",
  });
  revalidatePath("/settings/notifications");
  return { success: true };
}

export async function listNotificationLogs(take = 50) {
  const session = await requireSessionUser();
  if (!can(session, "messaging.manage")) return [];
  const clinic = await messagingClinic(session.clinicId);
  if (!clinic || !planAllows(clinic.plan, "messaging")) return [];
  return prisma.notificationLog.findMany({
    where: { clinicId: session.clinicId },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(take, 1), 100),
    include: { patient: { select: { name: true, mrn: true } } },
  });
}

export async function sendTestNotification(input: {
  phone: string;
  channel: NotificationChannel;
}): Promise<ActionResult<{ status: string }>> {
  const session = await requireSessionUser();
  if (!can(session, "messaging.send")) return permissionDenied();
  const clinic = await messagingClinic(session.clinicId);
  if (!clinic || !planAllows(clinic.plan, "messaging")) {
    return { success: false, error: "Your plan does not include messaging." };
  }
  if (!/^\+?[0-9\s-]{10,16}$/.test(input.phone.trim())) {
    return { success: false, error: "Enter a valid test phone number." };
  }
  const result = await sendClinicNotification({
    clinicId: clinic.id,
    clinicPlan: clinic.plan,
    phone: input.phone,
    channel: input.channel,
    templateKey: "appointment_reminder",
    vars: {
      patientName: "Test patient",
      when: new Date().toLocaleString("en-IN"),
      clinicName: clinic.name,
    },
  });
  await logAudit({
    clinicId: session.clinicId,
    actorId: session.userId,
    action: "create",
    resourceType: "notification",
    metadata: { test: true, channel: input.channel, status: result.status },
  });
  revalidatePath("/settings/notifications");
  if (!result.sent && result.error) return { success: false, error: result.error };
  return { success: true, data: { status: result.status } };
}

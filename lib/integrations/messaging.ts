import "server-only";

import {
  NotificationChannel,
  NotificationStatus,
  type Plan,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { planAllows } from "@/lib/plan-features";
import { logger } from "@/lib/logger";

export type MessagingConfig = {
  smsEnabled?: boolean;
  whatsappEnabled?: boolean;
  senderId?: string;
  /** When true, log only — never call external APIs (default in dev). */
  dryRun?: boolean;
  /** Opt-in for appointment reminder sends. */
  appointmentReminders?: boolean;
};

export type NotificationTemplateKey =
  | "appointment_booked"
  | "appointment_reminder"
  | "token_called"
  | "rx_ready"
  | "bill_paid"
  | "lab_report_ready"
  | "portal_otp";

function renderTemplate(
  key: NotificationTemplateKey,
  vars: Record<string, string>
): string {
  switch (key) {
    case "appointment_booked":
      return `Medyx: Appointment booked for ${vars.patientName} on ${vars.when} at ${vars.clinicName}.`;
    case "appointment_reminder":
      return `Medyx: Reminder — ${vars.patientName} has an appointment on ${vars.when} at ${vars.clinicName}.`;
    case "token_called":
      return `Medyx: Token #${vars.token} for ${vars.patientName} — please proceed to the doctor.`;
    case "rx_ready":
      return `Medyx: Prescription is ready for ${vars.patientName} at ${vars.clinicName}.`;
    case "bill_paid":
      return `Medyx: Payment of ₹${vars.amount} received for ${vars.patientName}. Thank you.`;
    case "lab_report_ready":
      return `Medyx: Lab report is ready for ${vars.patientName} at ${vars.clinicName}.`;
    case "portal_otp":
      return `Medyx: Your OTP for ${vars.clinicName} patient portal is ${vars.code}. It expires in 10 minutes.`;
    default:
      return `Medyx notification from ${vars.clinicName ?? "your clinic"}.`;
  }
}

async function deliverSms(to: string, body: string, dryRun: boolean): Promise<{ ok: boolean; error?: string }> {
  if (dryRun || !process.env.MSG91_AUTH_KEY) {
    logger.info("messaging_sms_dry_run", { to, body: body.slice(0, 80) });
    return { ok: true };
  }

  try {
    const res = await fetch("https://control.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: process.env.MSG91_AUTH_KEY,
      },
      body: JSON.stringify({
        recipients: [{ mobiles: to.replace(/\D/g, ""), message: body }],
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `SMS provider HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function deliverWhatsApp(
  to: string,
  body: string,
  dryRun: boolean
): Promise<{ ok: boolean; error?: string }> {
  if (dryRun || !process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_ID) {
    logger.info("messaging_whatsapp_dry_run", { to, body: body.slice(0, 80) });
    return { ok: true };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to.replace(/\D/g, ""),
          type: "text",
          text: { body },
        }),
      }
    );
    if (!res.ok) {
      return { ok: false, error: `WhatsApp provider HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function sendClinicNotification(input: {
  clinicId: string;
  clinicPlan: Plan;
  patientId?: string;
  phone: string;
  templateKey: NotificationTemplateKey;
  vars: Record<string, string>;
  channel?: NotificationChannel;
}): Promise<{ sent: boolean; status: NotificationStatus; error?: string }> {
  if (!planAllows(input.clinicPlan, "messaging")) {
    return { sent: false, status: NotificationStatus.skipped, error: "Plan does not include messaging." };
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: input.clinicId },
    select: { messagingConfig: true, name: true },
  });

  const config = (clinic?.messagingConfig ?? {}) as MessagingConfig;
  const dryRun = config.dryRun !== false && process.env.NODE_ENV !== "production"
    ? true
    : Boolean(config.dryRun);

  const channel =
    input.channel ??
    (config.whatsappEnabled
      ? NotificationChannel.whatsapp
      : NotificationChannel.sms);

  if (channel === NotificationChannel.sms && config.smsEnabled === false) {
    return { sent: false, status: NotificationStatus.skipped };
  }
  if (channel === NotificationChannel.whatsapp && !config.whatsappEnabled && config.smsEnabled === false) {
    return { sent: false, status: NotificationStatus.skipped };
  }

  const body = renderTemplate(input.templateKey, {
    clinicName: clinic?.name ?? "Clinic",
    ...input.vars,
  });

  const delivery =
    channel === NotificationChannel.whatsapp
      ? await deliverWhatsApp(input.phone, body, dryRun)
      : await deliverSms(input.phone, body, dryRun);

  const status = delivery.ok
    ? NotificationStatus.sent
    : NotificationStatus.failed;

  await prisma.notificationLog.create({
    data: {
      clinicId: input.clinicId,
      patientId: input.patientId,
      channel,
      templateKey: input.templateKey,
      recipient: input.phone,
      status,
      payload: { body, vars: input.vars },
      error: delivery.error,
    },
  });

  return { sent: delivery.ok, status, error: delivery.error };
}

import type { MessagingConfig } from "@/lib/integrations/messaging";
import { DetailRow } from "@/components/ui/DetailRow";

export function NotificationsSettingsProfile({
  config,
}: {
  config: MessagingConfig;
}) {
  return (
    <dl>
      <DetailRow
        label="SMS notifications"
        value={config.smsEnabled !== false ? "Enabled" : "Disabled"}
      />
      <DetailRow
        label="WhatsApp notifications"
        value={config.whatsappEnabled ? "Enabled" : "Disabled"}
      />
      <DetailRow label="Sender ID" value={config.senderId?.trim() || "—"} />
      <DetailRow
        label="Appointment reminders"
        value={config.appointmentReminders ? "Enabled" : "Disabled"}
      />
      <DetailRow
        label="Dry run"
        value={config.dryRun !== false ? "On (no provider calls)" : "Off"}
      />
    </dl>
  );
}

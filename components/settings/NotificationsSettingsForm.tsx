"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NotificationChannel } from "@prisma/client";
import { sendTestNotification, updateMessagingConfig } from "@/actions/messaging";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { MessagingConfig } from "@/lib/integrations/messaging";

export function NotificationsSettingsForm({
  initialConfig,
}: {
  initialConfig: MessagingConfig;
}) {
  const router = useRouter();
  const [config, setConfig] = useState({
    smsEnabled: initialConfig.smsEnabled !== false,
    whatsappEnabled: Boolean(initialConfig.whatsappEnabled),
    senderId: initialConfig.senderId ?? "",
    dryRun: initialConfig.dryRun !== false,
    appointmentReminders: Boolean(initialConfig.appointmentReminders),
  });
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState<"save" | "test" | null>(null);
  const [message, setMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  async function save() {
    setPending("save");
    const result = await updateMessagingConfig(config);
    setPending(null);
    if (!result.success) {
      setMessage({ kind: "error", text: result.error });
      return;
    }
    setMessage({ kind: "success", text: "Notification settings saved." });
    router.push("/settings/notifications");
    router.refresh();
  }

  async function test() {
    setPending("test");
    const channel = config.whatsappEnabled
      ? NotificationChannel.whatsapp
      : NotificationChannel.sms;
    const result = await sendTestNotification({ phone, channel });
    setPending(null);
    setMessage(
      result.success
        ? { kind: "success", text: `Test notification ${result.data.status}.` }
        : { kind: "error", text: result.error }
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex min-h-12 items-center gap-3 rounded-lg border border-border px-4 text-sm">
          <input
            type="checkbox"
            checked={config.smsEnabled}
            onChange={(e) =>
              setConfig({ ...config, smsEnabled: e.target.checked })
            }
          />
          Send SMS notifications
        </label>
        <label className="flex min-h-12 items-center gap-3 rounded-lg border border-border px-4 text-sm">
          <input
            type="checkbox"
            checked={config.whatsappEnabled}
            onChange={(e) =>
              setConfig({ ...config, whatsappEnabled: e.target.checked })
            }
          />
          Send WhatsApp notifications
        </label>
      </div>
      <Input
        label="Sender ID"
        value={config.senderId}
        onChange={(e) => setConfig({ ...config, senderId: e.target.value })}
        placeholder="MEDYX"
      />
      <label className="flex min-h-12 items-center gap-3 rounded-lg border border-border px-4 text-sm">
        <input
          type="checkbox"
          checked={config.appointmentReminders}
          onChange={(e) =>
            setConfig({ ...config, appointmentReminders: e.target.checked })
          }
        />
        Appointment reminder notifications
      </label>
      <label className="flex items-start gap-3 rounded-lg bg-muted/40 p-4 text-sm">
        <input
          className="mt-1"
          type="checkbox"
          checked={config.dryRun}
          onChange={(e) => setConfig({ ...config, dryRun: e.target.checked })}
        />
        <span>
          <strong>Dry run</strong>
          <span className="block text-muted-foreground">
            Record messages without contacting the provider.
          </span>
        </span>
      </label>
      {message ? <Banner variant={message.kind}>{message.text}</Banner> : null}
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={save} loading={pending === "save"}>
          Save changes
        </Button>
        <Link
          href="/settings/notifications"
          className="inline-flex min-h-11 items-center px-3 text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Cancel
        </Link>
      </div>
      <div className="grid gap-3 border-t border-border pt-5 sm:grid-cols-[1fr_auto]">
        <Input
          label="Test phone number"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 98765 43210"
        />
        <div className="flex items-end">
          <Button
            type="button"
            variant="secondary"
            onClick={test}
            loading={pending === "test"}
          >
            Send test
          </Button>
        </div>
      </div>
    </div>
  );
}

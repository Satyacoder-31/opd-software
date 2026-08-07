import { redirect } from "next/navigation";
import { getMessagingConfig } from "@/actions/messaging";
import { NotificationsSettingsForm } from "@/components/settings/NotificationsSettingsForm";
import { Card } from "@/components/ui/Card";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";

export default async function EditNotificationsSettingsPage() {
  const settings = await getMessagingConfig();

  if (!settings) {
    redirect("/settings/notifications");
  }

  return (
    <PageShell>
      <PageHeader
        title="Edit notifications"
        description="Configure SMS and WhatsApp delivery"
        backHref="/settings/notifications"
        backLabel="Back to notifications"
      />
      <PageBody className="max-w-4xl">
        <Card title="Delivery settings" className="border border-border">
          <NotificationsSettingsForm initialConfig={settings.config} />
        </Card>
      </PageBody>
    </PageShell>
  );
}

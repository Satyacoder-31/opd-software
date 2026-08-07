import Link from "next/link";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { getMessagingConfig, listNotificationLogs } from "@/actions/messaging";
import { NotificationsSettingsProfile } from "@/components/settings/NotificationsSettingsProfile";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PageBody, PageHeader, PageShell } from "@/components/ui/PageShell";

export default async function NotificationsSettingsPage() {
  const [settings, logs] = await Promise.all([
    getMessagingConfig(),
    listNotificationLogs(20),
  ]);

  return (
    <PageShell>
      <PageHeader
        title="Notifications"
        description="SMS and WhatsApp delivery for patient updates"
        backHref="/settings"
        backLabel="Back to settings"
        actions={
          settings ? (
            <Button
              nativeButton={false}
              render={<Link href="/settings/notifications/edit" />}
              size="sm"
            >
              <Icon icon={faPen} data-icon="inline-start" />
              Edit
            </Button>
          ) : null
        }
      />
      <PageBody className="max-w-4xl">
        {!settings ? (
          <Banner variant="info">
            Messaging is unavailable for this plan or role.
          </Banner>
        ) : (
          <>
            <Card title="Delivery settings" flush className="border border-border">
              <div className="px-5 py-5">
                <NotificationsSettingsProfile config={settings.config} />
              </div>
            </Card>
            <Card title="Recent deliveries" className="mt-5 border border-border">
              {logs.length ? (
                <ul className="divide-y divide-border">
                  {logs.map((log) => (
                    <li
                      key={log.id}
                      className="flex flex-wrap justify-between gap-2 py-3 text-sm"
                    >
                      <span>
                        {log.patient?.name ?? log.recipient} ·{" "}
                        {log.templateKey.replaceAll("_", " ")}
                      </span>
                      <span className="capitalize text-muted-foreground">
                        {log.channel} · {log.status} ·{" "}
                        {log.createdAt.toLocaleString("en-IN")}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No notification attempts yet.
                </p>
              )}
            </Card>
          </>
        )}
      </PageBody>
    </PageShell>
  );
}

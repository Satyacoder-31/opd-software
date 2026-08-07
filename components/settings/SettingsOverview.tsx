import {
  faBuilding,
  faCreditCard,
  faFileLines,
  faIndianRupeeSign,
  faPills,
  faScroll,
  faUsers,
  faBell,
  faFlask,
  faCalendarCheck,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { logout } from "@/actions/auth";
import { SettingsOverviewLink } from "@/components/settings/SettingsOverviewLink";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHeader, PageShell } from "@/components/ui/PageShell";

type SettingsOverviewProps = {
  showClinicAdmin: boolean;
};

function SettingsSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-1">
      <h2
        id={id}
        className="font-nav px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
      >
        {title}
      </h2>
      <div className="divide-y divide-border/80 border-y border-border/80">
        {children}
      </div>
    </section>
  );
}

export function SettingsOverview({ showClinicAdmin }: SettingsOverviewProps) {
  return (
    <PageShell>
      <PageHeader
        title="Settings"
        description={
          showClinicAdmin
            ? "Clinic administration — profile, people, billing, and governance"
            : "Account"
        }
      />

      <div className="font-nav flex max-w-xl flex-col gap-8 px-6 pb-8 md:px-8">
        {showClinicAdmin ? (
          <>
            <SettingsSection id="settings-clinic-heading" title="Clinic">
              <SettingsOverviewLink
                href="/settings/clinic"
                title="Clinic profile"
                icon={faBuilding}
              />
              <SettingsOverviewLink
                href="/settings/availability"
                title="Booking & schedules"
                icon={faCalendarCheck}
              />
              <SettingsOverviewLink
                href="/settings/prescriptions"
                title="Prescription layouts"
                icon={faFileLines}
              />
              <SettingsOverviewLink
                href="/settings/medicines"
                title="Medicine dictionary"
                icon={faPills}
              />
              <SettingsOverviewLink
                href="/settings/labs"
                title="Lab catalog"
                icon={faFlask}
              />
              <SettingsOverviewLink
                href="/settings/notifications"
                title="Patient notifications"
                icon={faBell}
              />
            </SettingsSection>

            <SettingsSection id="settings-people-heading" title="People">
              <SettingsOverviewLink
                href="/settings/staff"
                title="Staff & access"
                icon={faUsers}
              />
            </SettingsSection>

            <SettingsSection id="settings-billing-heading" title="Billing">
              <SettingsOverviewLink
                href="/settings/fees"
                title="Fee master"
                icon={faIndianRupeeSign}
              />
              <SettingsOverviewLink
                href="/settings/subscription"
                title="Subscription"
                icon={faCreditCard}
              />
            </SettingsSection>

            <SettingsSection id="settings-governance-heading" title="Governance">
              <SettingsOverviewLink
                href="/settings/audit"
                title="Audit log"
                icon={faScroll}
              />
            </SettingsSection>
          </>
        ) : null}

        <SettingsSection id="settings-account-heading" title="Account">
          <form action={logout} className="px-1 py-2">
            <Button
              type="submit"
              variant="secondary"
              className="w-full justify-start sm:w-auto"
            >
              <Icon icon={faRightFromBracket} data-icon="inline-start" />
              Sign out
            </Button>
          </form>
        </SettingsSection>
      </div>
    </PageShell>
  );
}

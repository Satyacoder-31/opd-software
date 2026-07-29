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
  faCalendarDays,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import { SettingsOverviewLink } from "@/components/settings/SettingsOverviewLink";
import { PageHeader, PageShell } from "@/components/ui/PageShell";

export function SettingsOverview() {
  return (
    <PageShell>
      <PageHeader
        title="Settings"
        description="Clinic administration — profile, people, billing, and governance"
      />

      <div className="flex flex-col gap-8 px-6 pb-8 md:px-8">
        <section aria-labelledby="settings-clinic-heading" className="flex flex-col gap-3">
          <h2
            id="settings-clinic-heading"
            className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Clinic
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <SettingsOverviewLink
              href="/settings/clinic"
              title="Clinic profile"
              description="Name, phone, address, and GSTIN used on invoices"
              icon={faBuilding}
            />
            <SettingsOverviewLink
              href="/settings/availability"
              title="Public booking"
              description="Clinic directory listing, specialties, and online booking"
              icon={faGlobe}
            />
            <SettingsOverviewLink
              href="/settings/availability/schedules"
              title="Doctor schedules"
              description="Weekly hours, slot length, and leave days for booking"
              icon={faCalendarDays}
            />
            <SettingsOverviewLink
              href="/settings/prescriptions"
              title="Prescription layouts"
              description="Choose the printed look of clinic prescriptions"
              icon={faFileLines}
            />
            <SettingsOverviewLink
              href="/settings/medicines"
              title="Medicine dictionary"
              description="Manage quick suggestions used while prescribing"
              icon={faPills}
            />
            <SettingsOverviewLink
              href="/settings/labs"
              title="Lab catalog"
              description="Manage tests, sample types, fees, and billing codes"
              icon={faFlask}
            />
            <SettingsOverviewLink
              href="/settings/notifications"
              title="Patient notifications"
              description="Configure SMS and WhatsApp delivery"
              icon={faBell}
            />
          </div>
        </section>

        <section aria-labelledby="settings-people-heading" className="flex flex-col gap-3">
          <h2
            id="settings-people-heading"
            className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground"
          >
            People
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <SettingsOverviewLink
              href="/settings/staff"
              title="Staff & access"
              description="Invite teammates and manage active accounts"
              icon={faUsers}
            />
          </div>
        </section>

        <section aria-labelledby="settings-billing-heading" className="flex flex-col gap-3">
          <h2
            id="settings-billing-heading"
            className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Billing
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <SettingsOverviewLink
              href="/settings/fees"
              title="Fee master"
              description="Consultation and procedure fees used in billing"
              icon={faIndianRupeeSign}
            />
            <SettingsOverviewLink
              href="/settings/subscription"
              title="Subscription"
              description="Current plan and billing status"
              icon={faCreditCard}
            />
          </div>
        </section>

        <section
          aria-labelledby="settings-governance-heading"
          className="flex flex-col gap-3"
        >
          <h2
            id="settings-governance-heading"
            className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Governance
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <SettingsOverviewLink
              href="/settings/audit"
              title="Audit log"
              description="Who accessed or changed clinic records"
              icon={faScroll}
            />
          </div>
        </section>
      </div>
    </PageShell>
  );
}

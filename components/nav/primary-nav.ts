import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faCalendarDays,
  faChartSimple,
  faFlask,
  faGear,
  faIndianRupeeSign,
  faListOl,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import type { Permission } from "@/lib/rbac";

export type PrimaryNavItem = {
  href: string;
  label: string;
  permission: Permission;
  icon: IconDefinition;
  /** Shown in the mobile bottom bar (max ~3). */
  mobilePrimary?: boolean;
};

export type PrimaryNavGroup = {
  id: string;
  label: string;
  items: readonly PrimaryNavItem[];
};

export const PRIMARY_NAV_GROUPS: readonly PrimaryNavGroup[] = [
  {
    id: "today",
    label: "Today",
    items: [
      {
        href: "/queue",
        label: "Queue",
        permission: "queue.read",
        icon: faListOl,
        mobilePrimary: true,
      },
      {
        href: "/appointments",
        label: "Appointments",
        permission: "appointments.schedule",
        icon: faCalendarDays,
        mobilePrimary: true,
      },
    ],
  },
  {
    id: "records",
    label: "Records",
    items: [
      {
        href: "/patients",
        label: "Patients",
        permission: "patients.read",
        icon: faUsers,
        mobilePrimary: true,
      },
      {
        href: "/labs",
        label: "Labs",
        permission: "labs.read",
        icon: faFlask,
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      {
        href: "/billing",
        label: "Billing",
        permission: "billing.read",
        icon: faIndianRupeeSign,
      },
      {
        href: "/reports",
        label: "Reports",
        permission: "reports.read",
        icon: faChartSimple,
      },
    ],
  },
] as const;

export const SETTINGS_NAV_ITEM: PrimaryNavItem = {
  href: "/settings",
  label: "Settings",
  permission: "settings.access",
  icon: faGear,
};

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function flattenPrimaryNav(): PrimaryNavItem[] {
  return [
    ...PRIMARY_NAV_GROUPS.flatMap((group) => [...group.items]),
    SETTINGS_NAV_ITEM,
  ];
}

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBookOpen,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";

export type ReportsSection = {
  href: string;
  label: string;
  description: string;
  when: string;
  icon: IconDefinition;
};

/** Two jobs under Reports — keep them on dedicated pages, not one scroll. */
export const REPORTS_SECTIONS: readonly ReportsSection[] = [
  {
    href: "/reports/daily",
    label: "Daily close",
    description: "Review one day’s visits, collections, and open bills before you leave.",
    when: "End of day",
    icon: faBookOpen,
  },
  {
    href: "/reports/exports",
    label: "Data exports",
    description: "Download visit, billing, or patient CSVs for backup and accounting.",
    when: "As needed",
    icon: faDownload,
  },
] as const;

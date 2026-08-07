"use client";

import Link from "next/link";
import {
  faBell,
  faClipboardList,
  faFlask,
  faIndianRupeeSign,
  faListOl,
  faRocket,
  faUserClock,
} from "@fortawesome/free-solid-svg-icons";
import type { ClinicAlert, ClinicAlertTone } from "@/lib/clinic-alerts";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

const TONE_DOT: Record<ClinicAlertTone, string> = {
  info: "bg-primary",
  warning: "bg-accent",
  danger: "bg-danger",
};

const ALERT_ICON = {
  "queue:waiting": faListOl,
  "billing:open": faIndianRupeeSign,
  "labs:pending": faFlask,
  "onboarding:incomplete": faRocket,
  "appointments:no-show": faUserClock,
} as const;

export function ClinicAlertsBell({ alerts }: { alerts: ClinicAlert[] }) {
  const count = alerts.length;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={
              count > 0
                ? `Notifications, ${count} alert${count === 1 ? "" : "s"}`
                : "Notifications"
            }
            className={cn(
              "relative inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors",
              "hover:bg-surface-muted hover:text-ink",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            )}
          >
            <Icon icon={faBell} className="size-4" aria-hidden />
            {count > 0 ? (
              <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-accent text-[0.625rem] font-semibold text-white">
                {count > 9 ? "9+" : count}
              </span>
            ) : null}
          </button>
        }
      />
      <PopoverContent align="end" className="w-80 gap-0 p-0">
        <PopoverHeader className="border-b border-border px-3 py-2.5">
          <PopoverTitle>Clinic alerts</PopoverTitle>
          <PopoverDescription>
            {count > 0
              ? "Live signals from today's operations"
              : "Nothing needs attention right now"}
          </PopoverDescription>
        </PopoverHeader>

        {count === 0 ? (
          <div className="flex items-start gap-2.5 px-3 py-4">
            <Icon
              icon={faClipboardList}
              className="mt-0.5 size-3.5 text-muted-foreground"
              aria-hidden
            />
            <p className="text-sm text-muted-foreground">
              Queue, billing, and labs are clear for now.
            </p>
          </div>
        ) : (
          <ul className="max-h-80 overflow-y-auto py-1">
            {alerts.map((alert) => {
              const icon =
                ALERT_ICON[alert.id as keyof typeof ALERT_ICON] ??
                faClipboardList;
              return (
                <li key={alert.id}>
                  <Link
                    href={alert.href}
                    className="flex gap-3 px-3 py-2.5 transition-colors hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none"
                  >
                    <span className="mt-1.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink">
                      <Icon icon={icon} className="size-3.5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "size-1.5 shrink-0 rounded-full",
                            TONE_DOT[alert.tone]
                          )}
                          aria-hidden
                        />
                        <span className="truncate text-sm font-medium text-ink">
                          {alert.title}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {alert.description}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

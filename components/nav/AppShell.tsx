"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { faAnglesLeft, faEllipsis } from "@fortawesome/free-solid-svg-icons";
import type { SessionUser } from "@/lib/types";
import { can } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Icon } from "@/components/ui/Icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { GlobalPatientSearch } from "@/components/nav/GlobalPatientSearch";
import { ClinicAlertsBell } from "@/components/nav/ClinicAlertsBell";
import {
  PRIMARY_NAV_GROUPS,
  SETTINGS_NAV_ITEM,
  flattenPrimaryNav,
  isNavItemActive,
  type PrimaryNavItem,
} from "@/components/nav/primary-nav";
import type { ClinicAlert } from "@/lib/clinic-alerts";

const SIDEBAR_COLLAPSED_KEY = "medyx.sidebar.collapsed";

type AppShellProps = {
  session: SessionUser;
  clinicName: string;
  clinicLogoUrl?: string | null;
  alerts?: ClinicAlert[];
  children: React.ReactNode;
};

function NavPendingSpinner({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      className={cn(
        "absolute animate-spin rounded-full border-2 border-current/30 border-t-current",
        className
      )}
      aria-hidden
    />
  );
}

function NavLink({
  item,
  active,
  disabled,
  onNavigate,
  variant,
  collapsed = false,
}: {
  item: PrimaryNavItem;
  active: boolean;
  disabled: boolean;
  onNavigate: () => void;
  variant: "sidebar" | "mobile" | "sheet";
  collapsed?: boolean;
}) {
  return (
    <Link
      href={item.href}
      title={collapsed && variant === "sidebar" ? item.label : undefined}
      aria-label={collapsed && variant === "sidebar" ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        if (!active) onNavigate();
      }}
      className={cn(
        "relative transition-[color,background-color,opacity,transform] duration-150",
        "active:scale-[0.98] active:opacity-80",
        disabled && "pointer-events-none opacity-60",
        variant === "sidebar" &&
          cn(
            "flex items-center rounded-lg text-sm font-medium",
            collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-3 py-2",
            active
              ? "bg-sidebar-accent text-sidebar-primary"
              : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
          ),
        variant === "mobile" &&
          cn(
            "flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[0.6875rem] font-medium",
            active ? "text-primary" : "text-muted-foreground"
          ),
        variant === "sheet" &&
          cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
            active
              ? "bg-surface-muted text-ink"
              : "text-muted-foreground hover:bg-surface-muted/70 hover:text-ink"
          )
      )}
    >
      <Icon
        icon={item.icon}
        aria-hidden
        className={variant === "mobile" ? "size-4" : "size-3.5"}
      />
      {variant === "sidebar" && collapsed ? null : (
        <span className={cn(variant === "mobile" && "leading-tight")}>
          {item.label}
        </span>
      )}
      <NavPendingSpinner
        className={
          variant === "mobile"
            ? "top-1.5 right-[calc(50%-1.1rem)] size-2"
            : collapsed
              ? "top-1.5 right-1.5 size-2"
              : "top-2.5 right-2.5 size-2.5"
        }
      />
    </Link>
  );
}

function ClinicMark({
  clinicName,
  clinicLogoUrl,
}: {
  clinicName: string;
  clinicLogoUrl?: string | null;
}) {
  if (clinicLogoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={clinicLogoUrl}
        alt=""
        className="size-9 shrink-0 rounded-lg border border-border bg-white object-contain p-0.5"
      />
    );
  }

  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-deep text-xs font-semibold text-white">
      {clinicName.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function AppShell({
  session,
  clinicName,
  clinicLogoUrl,
  alerts = [],
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const [navigating, setNavigating] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const canSearchPatients = can(session, "patients.read");
  const allItems = flattenPrimaryNav().filter((item) =>
    item.href === SETTINGS_NAV_ITEM.href
      ? true
      : can(session, item.permission)
  );
  const mobilePrimary = allItems.filter((item) => item.mobilePrimary);
  const moreItems = allItems.filter((item) => !item.mobilePrimary);
  const moreActive = moreItems.some((item) =>
    isNavItemActive(pathname, item.href)
  );

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1");
    } catch {
      // Ignore private-mode / storage failures.
    }
  }, []);

  useEffect(() => {
    setNavigating(false);
    setMoreOpen(false);
  }, [pathname]);

  function onNavigate() {
    setNavigating(true);
  }

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // Ignore private-mode / storage failures.
      }
      return next;
    });
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "font-nav sticky top-0 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-out md:flex",
          collapsed ? "w-17" : "w-60"
        )}
      >
        <div
          className={cn(
            "flex items-center border-b border-sidebar-border",
            collapsed ? "justify-center px-2 py-3.5" : "gap-2.5 px-4 py-4"
          )}
        >
          {collapsed ? (
            <Image
              src="/logo.png"
              alt="Medyx"
              width={80}
              height={59}
              className="h-7 w-auto object-contain"
            />
          ) : (
            <BrandLogo size="sm" />
          )}
        </div>

        <div
          className={cn(
            "flex items-center border-b border-sidebar-border",
            collapsed ? "justify-center px-2 py-3" : "gap-2.5 px-4 py-3"
          )}
          title={collapsed ? clinicName : undefined}
        >
          <ClinicMark clinicName={clinicName} clinicLogoUrl={clinicLogoUrl} />
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{clinicName}</p>
              <p className="truncate text-xs text-muted-foreground">
                Clinic workspace
              </p>
            </div>
          ) : null}
        </div>

        <nav
          className={cn(
            "flex flex-1 flex-col overflow-y-auto py-4",
            collapsed ? "gap-3 px-2" : "gap-5 px-3"
          )}
          aria-label="Main"
          aria-busy={navigating || undefined}
        >
          {PRIMARY_NAV_GROUPS.map((group) => {
            const items = group.items.filter((item) =>
              can(session, item.permission)
            );
            if (items.length === 0) return null;
            return (
              <div key={group.id} className="space-y-1">
                {!collapsed ? (
                  <p className="px-3 text-[0.6875rem] font-semibold tracking-wide text-muted-foreground uppercase">
                    {group.label}
                  </p>
                ) : (
                  <span className="sr-only">{group.label}</span>
                )}
                <div className="space-y-0.5">
                  {items.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      active={isNavItemActive(pathname, item.href)}
                      disabled={navigating}
                      onNavigate={onNavigate}
                      variant="sidebar"
                      collapsed={collapsed}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div
          className={cn(
            "space-y-0.5 border-t border-sidebar-border py-3",
            collapsed ? "px-2" : "px-3"
          )}
        >
          <NavLink
            item={SETTINGS_NAV_ITEM}
            active={isNavItemActive(pathname, SETTINGS_NAV_ITEM.href)}
            disabled={navigating}
            onNavigate={onNavigate}
            variant="sidebar"
            collapsed={collapsed}
          />
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-pressed={collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex w-full items-center rounded-lg text-sm font-medium text-sidebar-foreground/75 transition-colors",
              "hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-3 py-2"
            )}
          >
            <Icon
              icon={faAnglesLeft}
              aria-hidden
              className={cn(
                "size-3.5 transition-transform duration-200",
                collapsed && "rotate-180"
              )}
            />
            {!collapsed ? <span>Collapse</span> : null}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top utility bar */}
        <header className="font-nav sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-3 py-2.5 md:px-5">
            <div className="flex shrink-0 items-center gap-2 md:hidden">
              <ClinicMark
                clinicName={clinicName}
                clinicLogoUrl={clinicLogoUrl}
              />
              <span className="sr-only">{clinicName}</span>
            </div>

            <GlobalPatientSearch
              enabled={canSearchPatients}
              inputId="global-patient-search-desktop"
              className="hidden max-w-xl md:block"
            />

            <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2 md:flex-none">
              <GlobalPatientSearch
                enabled={canSearchPatients}
                inputId="global-patient-search-mobile"
                placeholder="Search patients"
                className="max-w-none md:hidden"
              />

              <ClinicAlertsBell alerts={alerts} />
            </div>
          </div>
        </header>

        {children}

        {/* Mobile bottom nav */}
        <nav
          className="font-nav fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden"
          aria-label="Primary"
          aria-busy={navigating || undefined}
        >
          <div className="flex items-stretch">
            {mobilePrimary.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isNavItemActive(pathname, item.href)}
                disabled={navigating}
                onNavigate={onNavigate}
                variant="mobile"
              />
            ))}
            {moreItems.length > 0 ? (
              <Popover open={moreOpen} onOpenChange={setMoreOpen}>
                <PopoverTrigger
                  render={
                    <button
                      type="button"
                      className={cn(
                        "flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[0.6875rem] font-medium transition-colors",
                        moreActive || moreOpen
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      <Icon icon={faEllipsis} className="size-4" aria-hidden />
                      More
                    </button>
                  }
                />
                <PopoverContent
                  side="top"
                  align="end"
                  sideOffset={10}
                  className="font-nav mb-1 w-56 p-2"
                >
                  <div className="space-y-0.5">
                    {moreItems.map((item) => (
                      <NavLink
                        key={item.href}
                        item={item}
                        active={isNavItemActive(pathname, item.href)}
                        disabled={navigating}
                        onNavigate={onNavigate}
                        variant="sheet"
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            ) : null}
          </div>
        </nav>
      </div>
    </div>
  );
}

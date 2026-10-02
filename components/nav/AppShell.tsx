"use client";

import { useEffect, useState } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  faAnglesLeft,
  faEllipsis,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { logout } from "@/actions/auth";
import type { SessionUser } from "@/lib/types";
import { can, ROLE_LABELS } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { BrandLogo, OrthoIcon } from "@/components/ui/BrandLogo";
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

const SIDEBAR_COLLAPSED_KEY = "drorthos.sidebar.collapsed";

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

function getAlertsForItem(href: string, alerts: ClinicAlert[]) {
  const matching = alerts.filter(
    (a) =>
      a.href === href ||
      a.href.startsWith(`${href}/`) ||
      (href === "/queue" && a.id.startsWith("queue:"))
  );
  if (matching.length === 0) return { count: 0, tone: undefined };

  const count = matching.length;
  const tone: "info" | "warning" | "danger" = matching.some(
    (a) => a.tone === "danger"
  )
    ? "danger"
    : matching.some((a) => a.tone === "warning")
      ? "warning"
      : "info";

  return { count, tone };
}

function SidebarNavLink({
  item,
  active,
  disabled,
  onNavigate,
  collapsed = false,
  alertCount,
  alertTone,
}: {
  item: PrimaryNavItem;
  active: boolean;
  disabled: boolean;
  onNavigate: () => void;
  collapsed?: boolean;
  alertCount?: number;
  alertTone?: "info" | "warning" | "danger";
}) {
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
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
        "group relative flex items-center rounded-xl text-xs font-semibold transition-all duration-150 select-none",
        "active:scale-[0.98]",
        disabled && "pointer-events-none opacity-60",
        collapsed
          ? "justify-center p-2 mx-auto w-11 h-11"
          : "gap-2.5 px-3 py-2.5 mx-2",
        active
          ? "bg-gradient-to-r from-sky-50 via-sky-50/70 to-white text-sky-950 border border-sky-200/80 shadow-[0_1px_2px_rgba(2,132,199,0.06)]"
          : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 border border-transparent"
      )}
    >
      {/* Active accent pill on the left */}
      {active && !collapsed && (
        <span
          className="absolute -left-2 top-2 bottom-2 w-1 rounded-r-full bg-sky-600 shadow-xs shadow-sky-500/40"
          aria-hidden
        />
      )}

      {/* Icon with container */}
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-lg transition-all duration-150",
          active
            ? "bg-sky-600 text-white shadow-xs shadow-sky-500/25"
            : "bg-slate-100/90 text-slate-500 group-hover:bg-white group-hover:text-slate-800 group-hover:shadow-2xs"
        )}
      >
        <Icon icon={item.icon} aria-hidden className="size-3.5" />
      </div>

      {/* Label */}
      {!collapsed && (
        <span className="truncate tracking-tight font-medium text-slate-800 group-hover:text-slate-950">
          {item.label}
        </span>
      )}

      {/* Alert badge in expanded mode */}
      {!collapsed && alertCount && alertCount > 0 ? (
        <span
          className={cn(
            "ml-auto inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold leading-none shrink-0 shadow-2xs",
            alertTone === "danger"
              ? "bg-rose-100 text-rose-700 ring-1 ring-rose-300/80"
              : alertTone === "warning"
                ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300/80"
                : "bg-sky-100 text-sky-700 ring-1 ring-sky-200"
          )}
        >
          {alertCount}
        </span>
      ) : null}

      {/* Alert dot in collapsed mode */}
      {collapsed && alertCount && alertCount > 0 ? (
        <span
          className={cn(
            "absolute top-1.5 right-1.5 size-2.5 rounded-full ring-2 ring-white shadow-xs animate-pulse",
            alertTone === "danger"
              ? "bg-rose-500"
              : alertTone === "warning"
                ? "bg-amber-500"
                : "bg-sky-500"
          )}
        />
      ) : null}

      {/* Hover tooltip in collapsed mode */}
      {collapsed && (
        <div
          role="tooltip"
          className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xl whitespace-nowrap group-hover:flex items-center gap-2 animate-in fade-in zoom-in-95 duration-100"
        >
          <span>{item.label}</span>
          {alertCount && alertCount > 0 ? (
            <span
              className={cn(
                "rounded px-1.5 py-0.2 text-[10px] font-bold",
                alertTone === "danger"
                  ? "bg-rose-500 text-white"
                  : alertTone === "warning"
                    ? "bg-amber-500 text-white"
                    : "bg-sky-500 text-white"
              )}
            >
              {alertCount}
            </span>
          ) : null}
        </div>
      )}

      <NavPendingSpinner
        className={
          collapsed ? "top-1.5 right-1.5 size-2" : "top-2.5 right-2.5 size-2.5"
        }
      />
    </Link>
  );
}

function NavLink({
  item,
  active,
  disabled,
  onNavigate,
  variant,
}: {
  item: PrimaryNavItem;
  active: boolean;
  disabled: boolean;
  onNavigate: () => void;
  variant: "mobile" | "sheet";
}) {
  return (
    <Link
      href={item.href}
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
      <span className={cn(variant === "mobile" && "leading-tight")}>
        {item.label}
      </span>
      <NavPendingSpinner
        className={
          variant === "mobile"
            ? "top-1.5 right-[calc(50%-1.1rem)] size-2"
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
      <div className="relative shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={clinicLogoUrl}
          alt=""
          className="size-9 rounded-xl border border-slate-200/90 bg-white object-contain p-0.5 shadow-2xs"
        />
        <span
          className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-emerald-500 shadow-xs"
          title="Active Clinic"
        />
      </div>
    );
  }

  return (
    <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-xs font-extrabold text-white shadow-xs ring-1 ring-sky-500/20">
      {clinicName.slice(0, 1).toUpperCase()}
      <span
        className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-emerald-500 shadow-xs"
        title="Active Practice"
      />
    </div>
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

  const userInitials =
    (session.name || "Dr")
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "D";

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1");
    } catch {
      // Ignore private-mode / storage failures.
    }
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isEditing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (isEditing) return;

      if (
        (event.ctrlKey || event.metaKey) &&
        (event.key === "[" || event.key === "b" || event.key === "B")
      ) {
        event.preventDefault();
        toggleCollapsed();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
          "font-nav sticky top-0 hidden h-svh shrink-0 flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-sm transition-[width] duration-200 ease-out md:flex shadow-[1px_0_3px_rgba(0,0,0,0.02)] select-none",
          collapsed ? "w-18" : "w-[16.5rem]"
        )}
      >
        {/* Brand Header */}
        <div
          className={cn(
            "flex items-center border-b border-slate-200/70",
            collapsed ? "justify-center px-2 py-3.5" : "justify-between px-4 py-3.5"
          )}
        >
          {collapsed ? (
            <OrthoIcon size={30} />
          ) : (
            <div className="flex items-center justify-between w-full">
              <BrandLogo size="sm" />
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 ring-1 ring-sky-200/80 tracking-wide select-none">
                OPD
              </span>
            </div>
          )}
        </div>

        {/* Clinic Workspace Card */}
        <div className={cn(collapsed ? "p-2" : "px-3 pt-3 pb-1")}>
          <div
            className={cn(
              "group relative flex items-center rounded-xl border border-slate-200/80 bg-white/90 p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-150",
              "hover:border-sky-300/80 hover:bg-sky-50/20 hover:shadow-xs",
              collapsed ? "justify-center p-2 mx-auto w-11 h-11" : "gap-2.5"
            )}
            title={clinicName}
          >
            <ClinicMark clinicName={clinicName} clinicLogoUrl={clinicLogoUrl} />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-xs font-bold text-slate-900 tracking-tight leading-snug"
                  title={clinicName}
                >
                  {clinicName}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 mt-0.5">
                  <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="truncate">Active Workspace</span>
                </div>
              </div>
            )}

            {collapsed && (
              <div
                role="tooltip"
                className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xl whitespace-nowrap group-hover:flex items-center gap-2 animate-in fade-in zoom-in-95 duration-100"
              >
                <span>{clinicName}</span>
                <span className="text-[10px] text-emerald-400 font-medium">• Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Group Items */}
        <nav
          className={cn(
            "flex flex-1 flex-col overflow-y-auto py-2 scrollbar-hide",
            collapsed ? "gap-2 px-1" : "gap-3 px-1"
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
              <div key={group.id} className="space-y-0.5">
                {!collapsed ? (
                  <div className="flex items-center px-4 pt-2.5 pb-1 select-none">
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      {group.label}
                    </span>
                    <span className="ml-2 h-px flex-1 bg-slate-200/60" />
                  </div>
                ) : (
                  <div className="my-1 border-t border-slate-200/60 mx-2" />
                )}
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const { count, tone } = getAlertsForItem(item.href, alerts);
                    return (
                      <SidebarNavLink
                        key={item.href}
                        item={item}
                        active={isNavItemActive(pathname, item.href)}
                        disabled={navigating}
                        onNavigate={onNavigate}
                        collapsed={collapsed}
                        alertCount={count}
                        alertTone={tone}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Clinician Profile & Footer Navigation */}
        <div className="mt-auto border-t border-slate-200/80 p-2 space-y-1 bg-slate-50/50">
          {/* Clinician Card */}
          <div
            className={cn(
              "group relative flex items-center rounded-xl border border-slate-200/70 bg-white/80 p-2 transition-all hover:border-slate-300 hover:bg-white hover:shadow-2xs",
              collapsed ? "justify-center p-1.5 mx-auto w-11 h-11" : "gap-2.5"
            )}
            title={
              collapsed
                ? `${session.name || "Doctor"} (${ROLE_LABELS[session.role] ?? session.role})`
                : undefined
            }
          >
            <div className="relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-900 to-sky-950 text-xs font-bold text-white shadow-xs ring-1 ring-slate-200/60">
              {userInitials}
              <span
                className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-white bg-emerald-500 shadow-xs"
                title="Online / On Duty"
              />
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-800 tracking-tight">
                  {session.name || "Doctor"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={cn(
                      "inline-block rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider",
                      session.role === "doctor" &&
                        "bg-sky-50 text-sky-700 ring-1 ring-sky-200/70",
                      session.role === "admin" &&
                        "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/70",
                      session.role === "owner" &&
                        "bg-purple-50 text-purple-700 ring-1 ring-purple-200/70",
                      session.role === "receptionist" &&
                        "bg-teal-50 text-teal-700 ring-1 ring-teal-200/70"
                    )}
                  >
                    {ROLE_LABELS[session.role] ?? session.role}
                  </span>
                </div>
              </div>
            )}

            {!collapsed && (
              <form action={logout}>
                <button
                  type="submit"
                  title="Sign out of OPD"
                  aria-label="Sign out"
                  className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                >
                  <Icon icon={faRightFromBracket} className="size-3.5" />
                </button>
              </form>
            )}

            {collapsed && (
              <div
                role="tooltip"
                className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xl whitespace-nowrap group-hover:flex items-center gap-2 animate-in fade-in zoom-in-95 duration-100"
              >
                <span>{session.name || "Doctor"}</span>
                <span className="text-[10px] text-slate-300 font-normal">
                  ({ROLE_LABELS[session.role] ?? session.role})
                </span>
              </div>
            )}
          </div>

          {/* Settings Navigation Link */}
          <SidebarNavLink
            item={SETTINGS_NAV_ITEM}
            active={isNavItemActive(pathname, SETTINGS_NAV_ITEM.href)}
            disabled={navigating}
            onNavigate={onNavigate}
            collapsed={collapsed}
          />

          {/* Collapse Toggle */}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-pressed={collapsed}
            aria-label={collapsed ? "Expand sidebar (Ctrl+[)" : "Collapse sidebar (Ctrl+[)"}
            title={collapsed ? "Expand sidebar (Ctrl+[)" : "Collapse sidebar (Ctrl+[)"}
            className={cn(
              "group relative flex w-full items-center rounded-xl text-xs font-medium text-slate-500 transition-all select-none",
              "hover:bg-slate-100 hover:text-slate-800 active:scale-[0.98]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30",
              collapsed
                ? "justify-center p-2 mx-auto w-11 h-11"
                : "gap-2.5 px-3 py-2 mx-2 w-[calc(100%-1rem)]"
            )}
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 group-hover:text-slate-700 transition-colors">
              <Icon
                icon={faAnglesLeft}
                aria-hidden
                className={cn(
                  "size-3.5 transition-transform duration-200",
                  collapsed && "rotate-180"
                )}
              />
            </div>
            {!collapsed ? (
              <div className="flex flex-1 items-center justify-between">
                <span className="font-medium text-slate-700 group-hover:text-slate-950">
                  Collapse
                </span>
                <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-slate-400 shadow-2xs">
                  Ctrl+[
                </kbd>
              </div>
            ) : (
              <div
                role="tooltip"
                className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xl whitespace-nowrap group-hover:flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-100"
              >
                <span>Expand sidebar</span>
                <kbd className="rounded bg-white/20 px-1.5 py-0.2 text-[9px]">
                  Ctrl+[
                </kbd>
              </div>
            )}
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

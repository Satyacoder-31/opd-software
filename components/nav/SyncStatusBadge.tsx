"use client";

import { useEffect, useState, useTransition } from "react";
import {
  faCloud,
  faRotate,
  faCheck,
  faTriangleExclamation,
  faArrowsRotate,
} from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface SyncStatusBadgeProps {
  clinicId?: string;
  className?: string;
}

interface SyncState {
  isOnline: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  lastError?: string;
}

export function SyncStatusBadge({ clinicId, className }: SyncStatusBadgeProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: true,
    pendingCount: 0,
    lastSyncedAt: null,
  });
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  async function fetchStatus() {
    try {
      const url = clinicId ? `/api/sync?clinicId=${clinicId}` : "/api/sync";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSyncState({
          isOnline: data.isOnline ?? true,
          pendingCount: data.pendingCount ?? 0,
          lastSyncedAt: data.lastSyncedAt ?? null,
        });
      }
    } catch {
      setSyncState((prev) => ({ ...prev, isOnline: false }));
    }
  }

  async function triggerSync() {
    startTransition(async () => {
      try {
        setSyncMessage(null);
        const res = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clinicId }),
        });
        const data = await res.json();
        if (data.success && data.result) {
          setSyncMessage(data.result.message || "Sync completed successfully");
          setSyncState({
            isOnline: data.result.status !== "offline",
            pendingCount: data.result.failed || 0,
            lastSyncedAt: data.result.lastSyncedAt || new Date().toISOString(),
          });
        } else {
          setSyncMessage(data.error || "Sync failed");
        }
      } catch (err: any) {
        setSyncMessage(err.message || "Failed to trigger sync");
      }
    });
  }

  useEffect(() => {
    fetchStatus();

    // Poll status periodically and auto-sync when online
    const interval = setInterval(() => {
      fetchStatus();
      if (navigator.onLine && syncState.pendingCount > 0) {
        triggerSync();
      }
    }, 30_000);

    function handleOnline() {
      fetchStatus();
      triggerSync();
    }
    function handleOffline() {
      setSyncState((prev) => ({ ...prev, isOnline: false }));
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [clinicId, syncState.pendingCount]);

  const { isOnline, pendingCount, lastSyncedAt } = syncState;

  // Render tone badge
  let badgeTone = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
  let badgeIcon = faCloud;
  let badgeLabel = "Synced";

  if (isPending) {
    badgeTone = "bg-sky-50 text-sky-700 border-sky-200/80";
    badgeIcon = faRotate;
    badgeLabel = "Syncing...";
  } else if (!isOnline) {
    badgeTone = "bg-amber-50 text-amber-700 border-amber-200/80";
    badgeIcon = faTriangleExclamation;
    badgeLabel = pendingCount > 0 ? `Offline (${pendingCount})` : "Offline";
  } else if (pendingCount > 0) {
    badgeTone = "bg-indigo-50 text-indigo-700 border-indigo-200/80";
    badgeIcon = faArrowsRotate;
    badgeLabel = `${pendingCount} to sync`;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-2xs transition-all hover:scale-[1.02] active:scale-[0.98]",
              badgeTone,
              className
            )}
            title="Local & Cloud Synchronization Status"
            aria-label="Cloud sync status"
          >
            <Icon
              icon={badgeIcon}
              className={cn("size-3", isPending && "animate-spin")}
            />
            <span className="hidden sm:inline">{badgeLabel}</span>
            <span
              className={cn(
                "size-1.5 rounded-full",
                !isOnline
                  ? "bg-amber-500 animate-pulse"
                  : pendingCount > 0
                    ? "bg-indigo-500"
                    : "bg-emerald-500"
              )}
            />
          </button>
        }
      />
      <PopoverContent align="end" side="bottom" sideOffset={8} className="w-80 p-4 font-sans">
        <PopoverHeader className="pb-2 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <PopoverTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Icon icon={faCloud} className="text-sky-600 size-3.5" />
              Local & Cloud Sync
            </PopoverTitle>
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                isOnline
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              )}
            >
              {isOnline ? "Cloud Online" : "Offline Mode"}
            </span>
          </div>
        </PopoverHeader>

        <div className="space-y-3 py-3 text-xs text-slate-600">
          <div className="flex items-center justify-between py-1 bg-slate-50/80 rounded-lg px-2.5">
            <span className="font-medium text-slate-700">Pending Local Changes:</span>
            <span
              className={cn(
                "font-bold text-xs px-2 py-0.5 rounded",
                pendingCount > 0 ? "bg-amber-100 text-amber-900" : "text-emerald-700"
              )}
            >
              {pendingCount === 0 ? "All saved & synced" : `${pendingCount} queued`}
            </span>
          </div>

          <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
            <span>Last Synced:</span>
            <span className="font-medium text-slate-700">
              {lastSyncedAt
                ? new Date(lastSyncedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : "Not yet synced"}
            </span>
          </div>

          <p className="text-[11px] leading-relaxed text-slate-500 bg-sky-50/50 p-2 rounded-lg border border-sky-100">
            ⚡ <strong>Offline-First:</strong> All patient data, prescriptions, and invoices are saved
            instantaneously to your computer first and automatically backed up to the cloud.
          </p>

          {syncMessage && (
            <div className="text-[11px] p-2 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {syncMessage}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={triggerSync}
            disabled={isPending}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 w-full rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-sky-500 disabled:opacity-50",
              isPending && "cursor-not-allowed"
            )}
          >
            <Icon
              icon={faRotate}
              className={cn("size-3", isPending && "animate-spin")}
            />
            {isPending ? "Syncing with Cloud..." : "Sync Now"}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { useEffect, useState } from "react";
import { getQueuePosition } from "@/actions/portal";

export function QueueStatusBadge({ appointmentId }: { appointmentId: string }) {
  const [info, setInfo] = useState<{
    position: number | null;
    tokenNumber: number;
    status: string;
    isToday: boolean;
  } | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      const result = await getQueuePosition(appointmentId);
      if (alive && result) setInfo(result);
    }
    void load();
    const id = window.setInterval(load, 15_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [appointmentId]);

  if (!info?.isToday) return null;

  const isInConsult = info.status === "in_progress";

  return (
    <div className={`mt-3 flex items-center justify-between rounded-xl border p-3 text-xs sm:text-sm font-semibold transition-all ${
      isInConsult
        ? "border-emerald-500/40 bg-emerald-50 text-emerald-900"
        : "border-sky-200 bg-sky-50/80 text-sky-950"
    }`}>
      <div className="flex items-center gap-2">
        <span className={`size-2.5 rounded-full ${isInConsult ? "bg-emerald-500 animate-ping" : "bg-sky-500 animate-pulse"}`} />
        <span>
          {isInConsult
            ? "Your token is currently inside with the doctor"
            : info.position != null
              ? `You are #${info.position} in queue waiting line`
              : "Waiting for consultation"}
        </span>
      </div>
      <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold shadow-sm">
        Token #{info.tokenNumber}
      </span>
    </div>
  );
}

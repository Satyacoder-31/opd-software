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
    const id = window.setInterval(load, 20_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [appointmentId]);

  if (!info?.isToday) return null;

  return (
    <p className="mt-3 rounded-lg bg-surface-muted px-3 py-2 text-sm text-ink">
      {info.status === "in_progress"
        ? "You are with the doctor now"
        : info.position != null
          ? `You're #${info.position} in line · token ${info.tokenNumber}`
          : `Token ${info.tokenNumber}`}
    </p>
  );
}

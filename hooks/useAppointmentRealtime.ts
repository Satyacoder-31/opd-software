"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { todayDateString } from "@/lib/utils";

const FALLBACK_POLL_MS = 60_000;

export type RealtimeConnectionStatus = "connected" | "disconnected" | "error";

type AppointmentRow = {
  queueDate?: string;
};

export function useAppointmentRealtime(
  clinicId: string,
  onChange: () => void,
  onStatusChange?: (status: RealtimeConnectionStatus) => void
) {
  const onChangeRef = useRef(onChange);
  const onStatusChangeRef = useRef(onStatusChange);
  onChangeRef.current = onChange;
  onStatusChangeRef.current = onStatusChange;

  useEffect(() => {
    const supabase = createClient();
    const today = todayDateString();
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;

    function startFallbackPoll() {
      if (fallbackInterval || document.hidden) return;
      fallbackInterval = setInterval(() => {
        if (!document.hidden) onChangeRef.current();
      }, FALLBACK_POLL_MS);
    }

    function stopFallbackPoll() {
      if (!fallbackInterval) return;
      clearInterval(fallbackInterval);
      fallbackInterval = null;
    }

    const channel = supabase
      .channel(`queue:${clinicId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Appointment",
          filter: `clinicId=eq.${clinicId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as AppointmentRow | undefined;
          if (!row?.queueDate) return;
          const queueDay = String(row.queueDate).slice(0, 10);
          if (queueDay !== today) return;
          onChangeRef.current();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          onStatusChangeRef.current?.("connected");
          stopFallbackPoll();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          onStatusChangeRef.current?.("error");
          startFallbackPoll();
        } else if (status === "CLOSED") {
          onStatusChangeRef.current?.("disconnected");
        }
      });

    function onVisibilityChange() {
      if (document.hidden) {
        stopFallbackPoll();
      } else {
        onChangeRef.current();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopFallbackPoll();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      void supabase.removeChannel(channel);
    };
  }, [clinicId]);
}

"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Tracks async action pending state. Unlike useTransition, pending stays true
 * until the promise settles — giving immediate click feedback during server actions.
 * Concurrent actions with different keys stay pending independently.
 */
export function usePendingAction<K extends string = string>() {
  const [pendingKeys, setPendingKeys] = useState<Set<K | "__default__">>(
    () => new Set()
  );
  const inFlight = useRef(new Map<K | "__default__", number>());

  const run = useCallback(
    async <T>(action: () => Promise<T>, key?: K): Promise<T> => {
      const trackKey: K | "__default__" = key ?? "__default__";
      inFlight.current.set(
        trackKey,
        (inFlight.current.get(trackKey) ?? 0) + 1
      );
      setPendingKeys(new Set(inFlight.current.keys()));

      try {
        return await action();
      } finally {
        const remaining = (inFlight.current.get(trackKey) ?? 1) - 1;
        if (remaining <= 0) {
          inFlight.current.delete(trackKey);
        } else {
          inFlight.current.set(trackKey, remaining);
        }
        setPendingKeys(new Set(inFlight.current.keys()));
      }
    },
    []
  );

  const isPending = useCallback(
    (key?: K) => {
      if (key === undefined) return pendingKeys.size > 0;
      return pendingKeys.has(key);
    },
    [pendingKeys]
  );

  return { pending: pendingKeys.size > 0, isPending, run };
}

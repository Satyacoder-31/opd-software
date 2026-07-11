"use client";

import { useCallback, useState } from "react";

/**
 * Tracks async action pending state. Unlike useTransition, pending stays true
 * until the promise settles — giving immediate click feedback during server actions.
 */
export function usePendingAction<K extends string = string>() {
  const [pendingKey, setPendingKey] = useState<K | true | null>(null);

  const run = useCallback(
    async <T>(action: () => Promise<T>, key?: K): Promise<T> => {
      setPendingKey(key ?? true);
      try {
        return await action();
      } finally {
        setPendingKey(null);
      }
    },
    []
  );

  const isPending = useCallback(
    (key?: K) => {
      if (key === undefined) return pendingKey !== null;
      return pendingKey === key;
    },
    [pendingKey]
  );

  return { pending: pendingKey !== null, isPending, run };
}

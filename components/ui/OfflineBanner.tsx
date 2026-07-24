"use client";

import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/ui/Icon";
import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);

    function handleOffline() {
      setOffline(true);
    }

    function handleOnline() {
      setOffline(false);
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-900"
    >
      <Icon icon={faTriangleExclamation} className="size-4" aria-hidden />
      You are offline. Changes will not sync until your connection returns.
    </div>
  );
}

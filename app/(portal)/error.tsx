"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      JSON.stringify({
        level: "error",
        message: "portal_route_error",
        error: error.message,
        digest: error.digest,
        timestamp: new Date().toISOString(),
      })
    );
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Patient Portal
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Unable to load portal
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          We encountered an issue loading your patient portal. Please try again or return to the clinic directory.
        </p>
        {process.env.NODE_ENV !== "production" && error.message ? (
          <p className="mt-2 text-xs font-mono text-danger bg-danger/10 p-2 rounded max-w-lg mx-auto overflow-auto">
            {error.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link
          href="/clinics"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-surface-deep px-4 text-sm font-semibold text-white hover:bg-primary"
        >
          Browse Clinics
        </Link>
      </div>
    </div>
  );
}

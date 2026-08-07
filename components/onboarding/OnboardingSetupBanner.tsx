"use client";

import Link from "next/link";
import { Banner } from "@/components/ui/Banner";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function OnboardingSetupBanner({
  skipped,
}: {
  skipped: boolean;
}) {
  return (
    <div className="border-b border-border px-4 py-3 md:px-5">
      <Banner variant="info">
        <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {skipped
              ? "Clinic setup is incomplete. Finish your listing so patients can find and book you."
              : "Finish clinic setup to appear in the patient directory and accept online bookings."}
          </span>
          <Link
            href="/onboarding"
            className={cn(
              buttonVariants({ size: "sm" }),
              "min-h-9 shrink-0 self-start sm:self-auto",
            )}
          >
            Continue setup
          </Link>
        </div>
      </Banner>
    </div>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import { Banner } from "@/components/ui/Banner";

export function LoginBanner() {
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");

  if (registered !== "1") return null;

  return (
    <Banner variant="success" className="mb-4">
      Your clinic account was created. Sign in with your email and password.
    </Banner>
  );
}

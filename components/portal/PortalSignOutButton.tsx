"use client";

import { useRouter } from "next/navigation";
import { logoutPortal } from "@/actions/portal";
import { Button } from "@/components/ui/Button";

export function PortalSignOutButton() {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={async () => {
        await logoutPortal();
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}

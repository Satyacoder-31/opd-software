"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveClinicRazorpayKeyId } from "@/actions/onboarding-medium";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

/** Save public Razorpay key id (secret stays in server env). */
export function RazorpayKeyForm({
  initialKeyId,
}: {
  initialKeyId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [keyId, setKeyId] = useState(initialKeyId ?? "");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.set("razorpayKeyId", keyId);
        startTransition(async () => {
          const result = await saveClinicRazorpayKeyId(fd);
          if (!result.success) {
            setMessage({ type: "error", text: result.error });
            return;
          }
          setMessage({ type: "success", text: "Razorpay key saved." });
          router.push("/settings/subscription");
          router.refresh();
        });
      }}
    >
      <Input
        label="Razorpay Key ID (public)"
        name="razorpayKeyId"
        value={keyId}
        onChange={(e) => setKeyId(e.target.value)}
        placeholder="rzp_live_… or rzp_test_…"
      />
      <p className="text-xs text-muted-foreground">
        Only the public key is stored here. Keep{" "}
        <code className="text-ink">RAZORPAY_KEY_SECRET</code> in server env.
      </p>
      {message ? (
        <Banner variant={message.type === "error" ? "error" : "success"}>
          {message.text}
        </Banner>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={pending} size="sm">
          Save payment key
        </Button>
        <Link
          href="/settings/subscription"
          className="inline-flex min-h-11 items-center px-3 text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
